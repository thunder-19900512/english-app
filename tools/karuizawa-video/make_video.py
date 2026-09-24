#!/usr/bin/env python3
"""スポット1件分の学習動画：Wikimedia画像＋英語ナレーション＋焼き込み字幕。
このMacのffmpegはdrawtext非搭載のため、字幕はPillowで画像に描いてから合成する。
画面は「①タイトルのみ → ②You can ... → ③It's ... → ④両方（まとめ）」の4カット。"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_JP = "/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc"
W, H = 1280, 720

def font(size, jp=False):
    return ImageFont.truetype(FONT_JP if jp else FONT_PATH, size)

def center_text(d, y, text, f, fill="white", shadow=True):
    bbox = d.textbbox((0, 0), text, font=f)
    x = (W - (bbox[2] - bbox[0])) / 2 - bbox[0]
    if shadow:
        d.text((x + 3, y + 3), text, font=f, fill=(0, 0, 0, 180))
    d.text((x, y), text, font=f, fill=fill)

def base_image(img_path):
    im = Image.open(img_path).convert("RGB")
    # 中央クロップして1280x720に
    ratio = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * ratio), int(im.height * ratio)), Image.LANCZOS)
    left, top = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((left, top, left + W, top + H))

def make_frame(base, title, lines, credit, out_path):
    """lines は (英文, 和訳) のタプルの配列。英語を大きく、和訳を下に小さく出す。"""
    im = base.copy()
    d = ImageDraw.Draw(im, "RGBA")
    # 上：タイトル帯
    d.rectangle([0, 30, W, 130], fill=(0, 0, 0, 150))
    center_text(d, 48, title, font(58))
    # 下：字幕帯（英語＋和訳の2段）
    if lines:
        band_h = 96 * len(lines) + 26
        top = H - band_h - 52
        d.rectangle([0, top, W, H - 52], fill=(0, 0, 0, 175))
        y = top + 14
        for en, ja in lines:
            center_text(d, y, en, font(44))
            center_text(d, y + 50, ja, font(30, jp=True), fill=(255, 240, 170))
            y += 96
    # 右下：クレジット（白い風景に埋もれないよう黒帯を敷く）
    f = font(18)
    bbox = d.textbbox((0, 0), credit, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x, y = W - tw - 18, H - 36
    d.rectangle([x - 10, y - 6, x + tw + 10, y + th + 10], fill=(0, 0, 0, 170))
    d.text((x, y), credit, font=f, fill=(255, 255, 255, 235))
    im.save(out_path, quality=92)

def make(spot, outdir):
    sid, title, can_do, location, query = spot['id'], spot['title'], spot['canDo'], spot['location'], spot['query']
    os.makedirs(outdir, exist_ok=True)
    img = os.path.join(outdir, f'{sid}.jpg')
    meta_path = os.path.join(outdir, f'{sid}.json')

    if not os.path.exists(img):
        r = subprocess.run(['python3', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fetch.py'),
                            query, img, meta_path], capture_output=True, text=True)
        if r.returncode != 0:
            print(f'  ⚠️  画像なし: {query}'); return None
        print(f'  画像: {r.stdout.strip()}')
    meta = json.load(open(meta_path))
    credit = f"Photo: {meta['artist']} / Wikimedia Commons ({meta['license']})"

    # 音声（4パート。各パートの尺を測ってカットの長さにする）
    parts = [
        ("intro", f"This is {title}."),
        ("l1",    f"You can {can_do} here."),
        ("l2",    f"It's {location}."),
        ("recap", f"One more time. You can {can_do} here. It's {location}."),
    ]
    voice = spot.get('voice', 'en-US-JennyNeural')
    edge = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.venv', 'bin', 'edge-tts')
    seg_files, durs = [], []
    for key, text in parts:
        mp3 = os.path.join(outdir, f'{sid}.{key}.mp3')
        m4a = os.path.join(outdir, f'{sid}.{key}.m4a')
        subprocess.run([edge, '--voice', voice, '--rate=-15%', '--text', text,
                        '--write-media', mp3], check=True, capture_output=True)
        # 各パートの後ろに0.7秒の間を入れる（子どもが復唱できる余白）
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', mp3,
                        '-af', 'apad=pad_dur=0.7', '-ar', '44100', '-ac', '2', m4a], check=True)
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                    '-of', 'csv=p=0', m4a], capture_output=True, text=True).stdout.strip())
        seg_files.append(m4a); durs.append(dur)

    # 音声を連結
    concat_list = os.path.join(outdir, f'{sid}.concat.txt')
    with open(concat_list, 'w') as f:
        for p in seg_files:
            f.write(f"file '{os.path.abspath(p)}'\n")
    audio = os.path.join(outdir, f'{sid}.audio.m4a')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0',
                    '-i', concat_list, '-c', 'copy', audio], check=True)

    # 4カットの静止画
    base = base_image(img)
    ja1 = spot.get('ja1', '')
    ja2 = spot.get('ja2', '')
    cuts = [
        (durs[0], []),
        (durs[1], [(f'You can {can_do} here.', ja1)]),
        (durs[2], [(f"It's {location}.", ja2)]),
        (durs[3], [(f'You can {can_do} here.', ja1), (f"It's {location}.", ja2)]),
    ]
    frames = []
    for i, (dur, lines) in enumerate(cuts):
        p = os.path.join(outdir, f'{sid}.f{i}.jpg')
        make_frame(base, title, lines, credit, p)
        frames.append((p, dur))

    # 静止画のスライドショー（concat demuxer）
    vlist = os.path.join(outdir, f'{sid}.frames.txt')
    with open(vlist, 'w') as f:
        for p, dur in frames:
            f.write(f"file '{os.path.abspath(p)}'\nduration {dur:.3f}\n")
        f.write(f"file '{os.path.abspath(frames[-1][0])}'\n")  # 最後の1枚をもう一度（仕様）

    out = os.path.join(outdir, f'kz-{sid}.mp4')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', vlist,
                    '-i', audio, '-c:v', 'libx264', '-preset', 'medium', '-crf', '25',
                    '-pix_fmt', 'yuv420p', '-r', '25', '-c:a', 'aac', '-b:a', '96k',
                    '-shortest', out], check=True)
    total = sum(durs)
    size = os.path.getsize(out) / 1024 / 1024
    print(f'  ✅ {out}  {total:.1f}秒  {size:.1f}MB')
    return out

if __name__ == '__main__':
    spots = json.load(open(sys.argv[1]))
    outdir = sys.argv[2]
    only = sys.argv[3] if len(sys.argv) > 3 else None
    for s in spots:
        if only and s['id'] != only:
            continue
        print(f"▶ {s['id']}")
        make(s, outdir)
