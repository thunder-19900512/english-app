import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../hooks/useShop';
import { Button } from '../ui/Button';
import { ArrowLeft, Star } from 'lucide-react';
import { findTitle, FRAMES, findFrame, TITLES, THEMES, SEASONAL_TITLES, seasonalThisMonth, currentMonth, BG_PRICE, BG_UNLOCK_ID, BG_MAX_INPUT_MB, BG_MAX_STORED_KB, type ShopItem } from '../../data/shopItems';
import { supabase } from '../../lib/supabase';
import { ensureSpendAllowed } from '../../lib/spendPin';
import { SpendLockedNotice } from '../ui/SpendGate';
import { useAppSettings } from '../../hooks/useAppSettings';

type Tab = 'title' | 'theme' | 'frame' | 'bg';

// 読み込んだ写真を、指定の大きさ・品質でJPEGにする
const toJpeg = (img: HTMLImageElement, max: number, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    let { width, height } = img;
    if (width > max || height > max) {
      const r = Math.min(max / width, max / height);
      width = Math.round(width * r); height = Math.round(height * r);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('no ctx'));
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', quality);
  });

const loadImage = (file: File): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load failed')); };
  img.src = url;
});

// 保存サイズが上限（BG_MAX_STORED_KB）に収まるまで、段階的に小さく・粗くする。
// 大きな写真をそのまま貯めないための歯止め。1人1枚しか持てないので、
// これで保存容量は「人数 × 1MB弱」で頭打ちになる。
const compressImage = async (file: File): Promise<Blob> => {
  const img = await loadImage(file);
  const steps: [number, number][] = [[1600, 0.8], [1280, 0.7], [1024, 0.6], [800, 0.5]];
  let last: Blob | null = null;
  for (const [max, q] of steps) {
    last = await toJpeg(img, max, q);
    if (last.size <= BG_MAX_STORED_KB * 1024) return last;
  }
  return last!; // ここまで縮めれば十分小さい
};

export const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { shop, balance, buy, equipTitle, equipTheme, equipFrame, setBackgroundImage, setBackgroundOn } = useShop();
  const { salePercent, saleLabel } = useAppSettings();
  const [tab, setTab] = useState<Tab>('title');
  // 着せ替えの「おためし」。このページにいる間だけ見た目を変える（買わなくても試せる）。
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);   // 称号のおためし（子どもの声 2026-09-15）
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);   // 名前のわくのおためし
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = previewTheme ?? (shop.equippedTheme || '');
    return () => { root.dataset.theme = shop.equippedTheme || ''; }; // ページを出たら元にもどす
  }, [previewTheme, shop.equippedTheme]);
  useEffect(() => { if (tab !== 'theme') setPreviewTheme(null); }, [tab]);
  useEffect(() => { if (tab !== 'frame') setPreviewFrame(null); }, [tab]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const studentId = localStorage.getItem('studentId');

  const owned = (id: string) => shop.owned.includes(id);

  const handleBuy = async (item: ShopItem) => {
    const price = Math.max(1, Math.round(item.price * (100 - salePercent) / 100));
    if (!window.confirm(`「${item.name}」を ${price}P で かいますか？`)) return;
    if (!(await ensureSpendAllowed())) return;   // 合言葉（なりすまし対策）
    buy({ ...item, price });                      // セール中はその値段で買える
  };

  const bgUnlocked = shop.owned.includes(BG_UNLOCK_ID);

  const handleUpload = async (file: File) => {
    if (!supabase || !studentId) return;
    // 大きすぎる写真はそもそも受け取らない（読み込みで固まるのを防ぐ）
    if (file.size > BG_MAX_INPUT_MB * 1024 * 1024) {
      setUploadMsg(`この写真は大きすぎるよ（${BG_MAX_INPUT_MB}MBまで）。ちがう写真を選んでね`);
      setTimeout(() => setUploadMsg(''), 6000); return;
    }
    if (shop.bgImage) return; // すでに1枚持っている（入れ替えはできない）
    if (!bgUnlocked && balance < BG_PRICE) { setUploadMsg(`ポイントが 足りないよ！（${BG_PRICE}P 必要）`); setTimeout(() => setUploadMsg(''), 5000); return; }
    if (!window.confirm(
      (bgUnlocked ? 'この写真を 背景にするよ。（ポイントは かからないよ）\n\n'
                  : `この写真を 背景にすると ${BG_PRICE}P つかうよ。\n\n`)
      + '★ 登録できるのは 1枚だけ。あとから 写真を 変えることは できません。\n'
      + '（つけたり 消したりは、いつでも 無料でできるよ）\n\n'
      + 'この写真で いい？')) return;
    if (!bgUnlocked && !(await ensureSpendAllowed())) return;   // ポイントを使うときだけ合言葉
    setUploading(true); setUploadMsg('');
    try {
      const blob = await compressImage(file);
      const path = `${studentId}.jpg`; // 1人1枚。前の写真は上書きされる
      const { error } = await supabase.storage.from('backgrounds').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('backgrounds').getPublicUrl(path);
      const ok = setBackgroundImage(`${data.publicUrl}?t=${Date.now()}`);
      setUploadMsg(ok ? '背景を 変えたよ！🎉' : 'ポイントが 足りなかった…');
    } catch (e) {
      setUploadMsg('アップロードできなかった…もう一度試してね');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(''), 5000);
    }
  };

  // セールの日（先生がスタッフ画面で決める。子どもの声 2026-09-21「◯◯の日は50%オフ」）
  const priceOf = (p: number) => Math.max(1, Math.round(p * (100 - salePercent) / 100));

  const ItemCard: React.FC<{ item: ShopItem; equipped: boolean; onEquip: () => void; onUnequip: () => void; onPreview?: () => void; previewing?: boolean }> =
    ({ item, equipped, onEquip, onUnequip, onPreview, previewing }) => {
      const has = owned(item.id);
      const price = priceOf(item.price);
      const canBuy = balance >= price;
      return (
        <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', border: equipped ? '2px solid var(--color-success)' : previewing ? '2px dashed var(--color-primary)' : '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2.4rem' }}>{item.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.name} {equipped && <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>（つけてる）</span>}{previewing && <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>（おためし中）</span>}</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.desc}</div>
          </div>
          {onPreview && !equipped && (
            <Button variant="outline" onClick={onPreview} style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}>
              {previewing ? 'やめる' : '👀 おためし'}
            </Button>
          )}
          {!has ? (
            <button onClick={() => handleBuy(item)} disabled={!canBuy}
              style={{ padding: '0.6rem 1rem', borderRadius: '999px', border: 'none', cursor: canBuy ? 'pointer' : 'default', fontWeight: 'bold', whiteSpace: 'nowrap',
                background: canBuy ? 'var(--color-accent)' : '#e2e8f0', color: canBuy ? '#000' : '#94a3b8' }}>
              {salePercent > 0 && <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '0.3rem', fontSize: '0.8rem' }}>{item.price}</span>}
              ⭐{price}
            </button>
          ) : equipped ? (
            <Button variant="outline" onClick={onUnequip} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>はずす</Button>
          ) : (
            <Button onClick={onEquip} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>つける</Button>
          )}
        </div>
      );
    };

  return (
    <div className="flex-col gap-lg" style={{ flex: 1, maxWidth: '680px', margin: '0 auto', width: '100%', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>もどる</Button>
        <h2 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', marginRight: '80px' }}>🎁 ごほうびショップ</h2>
      </div>

      <SpendLockedNotice />

      {salePercent > 0 && (
        <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '14px', padding: '0.8rem 1rem', textAlign: 'center', fontWeight: 'bold', color: '#b91c1c' }}>
          🎉 今日は セールの日！ ぜんぶ {salePercent}%オフ{saleLabel ? `（${saleLabel}）` : ''}
        </div>
      )}

      {/* 残高 */}
      <div className="glass-card" style={{ padding: '1.2rem', textAlign: 'center', background: 'rgba(253, 203, 110, 0.15)', border: '2px solid var(--color-accent)' }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Star fill="var(--color-accent)" stroke="var(--color-accent)" size={28} /> いま 使える：{balance.toLocaleString()}P
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {([['title', '🏅 称号'], ['theme', '🎨 着せ替え'], ['frame', '🖼 名前のわく'], ['bg', '🖼️ 背景']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '999px', border: '2px solid var(--color-primary)', cursor: 'pointer', fontWeight: 'bold',
              background: tab === v ? 'var(--color-primary)' : 'white', color: tab === v ? 'white' : 'var(--color-primary)' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'title' && (
        <div className="flex-col gap-md">
          <p style={{ textAlign: 'center', color: '#666', margin: 0, fontSize: '0.9rem' }}>つけると、名前の横に 表示されるよ！</p>
          {/* おためし中の見え方（ホームの見出しと同じ形） */}
          <div style={{ textAlign: 'center', padding: '0.6rem', borderRadius: '12px', background: 'rgba(253, 203, 110, 0.18)', fontWeight: 'bold' }}>
            こんにちは、{localStorage.getItem('studentName') || 'ゲスト'}
            {findTitle(previewTitle || shop.equippedTitle)?.emoji || ''}さん！
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>
              {previewTitle ? `${findTitle(previewTitle)?.name} を おためし中` : 'いまの 見え方'}
            </div>
          </div>
          {/* 今月限定：その月だけ買える。買ったものは月が変わっても持ったまま */}
          <div style={{ border: '2px dashed var(--color-accent)', borderRadius: '14px', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontWeight: 'bold', textAlign: 'center' }}>🗓️ {currentMonth()}月だけの 限定称号</div>
            {seasonalThisMonth().map(t => (
              <ItemCard key={t.id} item={t} equipped={shop.equippedTitle === t.id}
                previewing={previewTitle === t.id}
                onPreview={() => setPreviewTitle(prev => prev === t.id ? null : t.id)}
                onEquip={() => { setPreviewTitle(null); equipTitle(t.id); }} onUnequip={() => equipTitle(null)} />
            ))}
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>来月は ちがう称号が 出るよ。手に入れたものは ずっと使えるよ</div>
          </div>
          {SEASONAL_TITLES.filter(t => t.month !== currentMonth() && owned(t.id)).map(t => (
            <ItemCard key={t.id} item={{ ...t, desc: `${t.month}月の限定称号（持っているよ）` }} equipped={shop.equippedTitle === t.id}
              previewing={previewTitle === t.id}
              onPreview={() => setPreviewTitle(prev => prev === t.id ? null : t.id)}
              onEquip={() => { setPreviewTitle(null); equipTitle(t.id); }} onUnequip={() => equipTitle(null)} />
          ))}
          {TITLES.map(t => (
            <ItemCard key={t.id} item={t} equipped={shop.equippedTitle === t.id}
              previewing={previewTitle === t.id}
              onPreview={() => setPreviewTitle(prev => prev === t.id ? null : t.id)}
              onEquip={() => { setPreviewTitle(null); equipTitle(t.id); }} onUnequip={() => equipTitle(null)} />
          ))}
        </div>
      )}

      {tab === 'theme' && (
        <div className="flex-col gap-md">
          <p style={{ textAlign: 'center', color: '#666', margin: 0, fontSize: '0.9rem' }}>
            つけると、画面のいろが かわるよ！ 「👀 おためし」で、買う前に このページの中だけ ためせるよ。
          </p>
          {previewTheme && (
            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
              👀 おためし中：{THEMES.find(t => t.id === previewTheme)?.name}（このページを出ると もとにもどるよ）
            </div>
          )}
          {THEMES.map(t => (
            <ItemCard key={t.id} item={t} equipped={shop.equippedTheme === t.id}
              previewing={previewTheme === t.id}
              onPreview={() => setPreviewTheme(prev => prev === t.id ? null : t.id)}
              onEquip={() => { setPreviewTheme(null); equipTheme(t.id); }} onUnequip={() => equipTheme(null)} />
          ))}
        </div>
      )}

      {tab === 'frame' && (
        <div className="flex-col gap-md">
          <p style={{ textAlign: 'center', color: '#666', margin: 0, fontSize: '0.9rem' }}>
            名前をえらぶ画面（みんなで使う画面）で、自分のタイルの ふちの色が 変わるよ
          </p>
          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'inline-block', padding: '0.6rem 1.4rem', borderRadius: '10px', fontWeight: 'bold', color: 'white',
              background: 'var(--color-primary)',
              border: '4px solid transparent',
              ...(findFrame(previewFrame || shop.equippedFrame)?.color === 'rainbow'
                ? { borderImage: 'linear-gradient(90deg,#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa) 1' }
                : findFrame(previewFrame || shop.equippedFrame) ? { borderColor: findFrame(previewFrame || shop.equippedFrame)!.color } : {}),
            }}>
              {localStorage.getItem('studentName') || 'ゲスト'}
            </span>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem' }}>
              {previewFrame ? `${findFrame(previewFrame)?.name} を おためし中` : 'いまの 見え方'}
            </div>
          </div>
          {FRAMES.map(f => (
            <ItemCard key={f.id} item={f} equipped={shop.equippedFrame === f.id}
              previewing={previewFrame === f.id}
              onPreview={() => setPreviewFrame(prev => prev === f.id ? null : f.id)}
              onEquip={() => { setPreviewFrame(null); equipFrame(f.id); }} onUnequip={() => equipFrame(null)} />
          ))}
        </div>
      )}

      {tab === 'bg' && (
        <div className="glass-card flex-col gap-md" style={{ padding: '1.5rem', textAlign: 'center' }}>
          {!bgUnlocked ? (
            <>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>⭐ {BG_PRICE}P で 背景を 手に入れる</div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                すきな写真を 1枚 えらぶと、アプリの背景に なるよ。<br />
                買ったあとは、<b>つけたり 消したり いつでも 無料</b>。<br />
                <b style={{ color: '#c0392b' }}>★ 登録できるのは 1枚だけ。あとから 変えられないよ。</b><br />
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>※ 自分だけに見えるよ。学校にふさわしい写真を選ぼう！</span>
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>✅ 背景（持っているよ）</div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                つけたり 消したりは <b>いつでも 無料</b>。写真は この1枚だよ。
              </p>
            </>
          )}

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.currentTarget.value = ''; }} />

          {/* もっている人：まず「つける／けす」を大きく出す（ここが要望の中心） */}
          {bgUnlocked && shop.bgImage && (
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                onClick={() => setBackgroundOn(true)}
                variant={shop.bgOn ? 'primary' : 'outline'}
                style={{ minWidth: '130px' }}
              >
                {shop.bgOn ? '✅ ついている' : '🖼️ つける'}
              </Button>
              <Button
                onClick={() => setBackgroundOn(false)}
                variant={!shop.bgOn ? 'primary' : 'outline'}
                style={{ minWidth: '130px' }}
              >
                {!shop.bgOn ? '✅ 消している' : '🚫 けす'}
              </Button>
            </div>
          )}

          {!shop.bgImage && (
            <Button onClick={() => fileRef.current?.click()} disabled={uploading || (!bgUnlocked && balance < BG_PRICE)}>
              {uploading ? 'アップロード中…' : bgUnlocked ? '📷 写真を選ぶ（無料）' : `📷 写真を選ぶ（${BG_PRICE}P）`}
            </Button>
          )}

          {!shop.bgImage && !bgUnlocked && balance < BG_PRICE && (
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>あと {BG_PRICE - balance}P たまったら 手に入れられるよ</div>
          )}

          {uploadMsg && <div style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{uploadMsg}</div>}

          {shop.bgImage && (
            <>
              <div style={{ position: 'relative' }}>
                <img src={shop.bgImage} alt="背景"
                  style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '12px', opacity: shop.bgOn ? 1 : 0.4 }} />
                {!shop.bgOn && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569' }}>
                    いま 消しているよ
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                写真は 変えられないよ。困ったときは 先生に 伝えてね
              </div>
            </>
          )}

          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            写真は {BG_MAX_INPUT_MB}MBまで。小さくして ほぞんするよ（1人1枚・入れ替え不可）
          </div>
        </div>
      )}

    </div>
  );
};
