# 軽井沢まちクイズ 動画生成ツール

まちクイズ（`/textbook?set=karuizawa`）で使う学習動画を作り直すための一式。

## できること
Wikimedia Commons の再利用可ライセンス画像＋Microsoftニューラル音声（Ana/Guy/Jenny の3人ローテ）で、
各スポット19〜21秒の動画を作る。字幕は英語（大）＋日本語訳（小）。画像のクレジットは動画内に焼き込み。

## 使い方
```bash
# 初回だけ：音声合成ツールを入れる（このフォルダを汚さないよう venv に）
python3 -m venv .venv && .venv/bin/pip install edge-tts

python3 make_video.py spots.json out          # 8本ぜんぶ作る
python3 make_video.py spots.json out station  # 1本だけ作る

python3 upload.py    # Driveへ新規アップ（初回のみ）
python3 update.py    # Drive上のファイルを差し替え（IDは変わらないのでアプリ修正不要）
```

## 直したいとき
- **文言・日本語訳** … `spots.json` の canDo / location / ja1 / ja2
- **声** … `spots.json` の voice（en-US-AnaNeural / en-US-GuyNeural / en-US-JennyNeural）
- **画像** … `spots.json` の query を変えて該当スポットだけ作り直す
  （中身が合っているか必ず `out/{id}.f3.jpg` を目で確認すること。1度、ショッピングモールが
    ゴルフ場の池になっていた）

## 注意
- 画像は必ずライセンス表示のあるものだけを使う（fetch.py がCC BY/CC BY-SA/CC0/PDに限定）
- Drive の共有は「リンクを知っている全員（閲覧者）」。子どもが学校アカウント以外でも見られるようにするため
- ffmpeg は drawtext 非搭載のビルドなので、字幕は Pillow で画像に焼いてから合成している
