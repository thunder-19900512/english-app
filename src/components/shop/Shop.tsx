import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../hooks/useShop';
import { Button } from '../ui/Button';
import { ArrowLeft, Star } from 'lucide-react';
import { TITLES, THEMES, BG_PRICE, BG_UNLOCK_ID, BG_MAX_INPUT_MB, BG_MAX_STORED_KB, type ShopItem } from '../../data/shopItems';
import { supabase } from '../../lib/supabase';

type Tab = 'title' | 'theme' | 'bg';

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
  const { shop, balance, buy, equipTitle, equipTheme, setBackgroundImage, setBackgroundOn } = useShop();
  const [tab, setTab] = useState<Tab>('title');
  // きせかえの「おためし」。このページにいる間だけ見た目を変える（買わなくても試せる）。
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = previewTheme ?? (shop.equippedTheme || '');
    return () => { root.dataset.theme = shop.equippedTheme || ''; }; // ページを出たら元にもどす
  }, [previewTheme, shop.equippedTheme]);
  useEffect(() => { if (tab !== 'theme') setPreviewTheme(null); }, [tab]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const studentId = localStorage.getItem('studentId');

  const owned = (id: string) => shop.owned.includes(id);

  const handleBuy = (item: ShopItem) => {
    if (window.confirm(`「${item.name}」を ${item.price}P で かいますか？`)) buy(item);
  };

  const bgUnlocked = shop.owned.includes(BG_UNLOCK_ID);

  const handleUpload = async (file: File) => {
    if (!supabase || !studentId) return;
    // 大きすぎる写真はそもそも受け取らない（読み込みで固まるのを防ぐ）
    if (file.size > BG_MAX_INPUT_MB * 1024 * 1024) {
      setUploadMsg(`この写真は大きすぎるよ（${BG_MAX_INPUT_MB}MBまで）。ちがう写真をえらんでね`);
      setTimeout(() => setUploadMsg(''), 6000); return;
    }
    if (shop.bgImage) return; // すでに1枚もっている（入れかえはできない）
    if (!bgUnlocked && balance < BG_PRICE) { setUploadMsg(`ポイントが たりないよ！（${BG_PRICE}P ひつよう）`); setTimeout(() => setUploadMsg(''), 5000); return; }
    if (!window.confirm(
      (bgUnlocked ? 'この写真を はいけいにするよ。（ポイントは かからないよ）\n\n'
                  : `この写真を はいけいにすると ${BG_PRICE}P つかうよ。\n\n`)
      + '★ 登録できるのは 1まいだけ。あとから 写真を かえることは できません。\n'
      + '（つけたり けしたりは、いつでも 無料でできるよ）\n\n'
      + 'この写真で いい？')) return;
    setUploading(true); setUploadMsg('');
    try {
      const blob = await compressImage(file);
      const path = `${studentId}.jpg`; // 1人1枚。前の写真は上書きされる
      const { error } = await supabase.storage.from('backgrounds').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('backgrounds').getPublicUrl(path);
      const ok = setBackgroundImage(`${data.publicUrl}?t=${Date.now()}`);
      setUploadMsg(ok ? 'はいけいを かえたよ！🎉' : 'ポイントが たりなかった…');
    } catch (e) {
      setUploadMsg('アップロードできなかった…もう一回ためしてね');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(''), 5000);
    }
  };

  const ItemCard: React.FC<{ item: ShopItem; equipped: boolean; onEquip: () => void; onUnequip: () => void; onPreview?: () => void; previewing?: boolean }> =
    ({ item, equipped, onEquip, onUnequip, onPreview, previewing }) => {
      const has = owned(item.id);
      const canBuy = balance >= item.price;
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
              ⭐{item.price}
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

      {/* 残高 */}
      <div className="glass-card" style={{ padding: '1.2rem', textAlign: 'center', background: 'rgba(253, 203, 110, 0.15)', border: '2px solid var(--color-accent)' }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Star fill="var(--color-accent)" stroke="var(--color-accent)" size={28} /> いま つかえる：{balance.toLocaleString()}P
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {([['title', '🏅 称号'], ['theme', '🎨 きせかえ'], ['bg', '🖼️ はいけい']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '999px', border: '2px solid var(--color-primary)', cursor: 'pointer', fontWeight: 'bold',
              background: tab === v ? 'var(--color-primary)' : 'white', color: tab === v ? 'white' : 'var(--color-primary)' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'title' && (
        <div className="flex-col gap-md">
          <p style={{ textAlign: 'center', color: '#666', margin: 0, fontSize: '0.9rem' }}>つけると、なまえのよこに ひょうじされるよ！</p>
          {TITLES.map(t => (
            <ItemCard key={t.id} item={t} equipped={shop.equippedTitle === t.id}
              onEquip={() => equipTitle(t.id)} onUnequip={() => equipTitle(null)} />
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

      {tab === 'bg' && (
        <div className="glass-card flex-col gap-md" style={{ padding: '1.5rem', textAlign: 'center' }}>
          {!bgUnlocked ? (
            <>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>⭐ {BG_PRICE}P で はいけいを 手に入れる</div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                すきな写真を 1まい えらぶと、アプリのはいけいに なるよ。<br />
                買ったあとは、<b>つけたり けしたり いつでも 無料</b>。<br />
                <b style={{ color: '#c0392b' }}>★ 登録できるのは 1まいだけ。あとから かえられないよ。</b><br />
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>※ 自分だけに見えるよ。学校にふさわしい写真をえらぼう！</span>
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>✅ はいけい（もっているよ）</div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                つけたり けしたりは <b>いつでも 無料</b>。写真は この1まいだよ。
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
                {!shop.bgOn ? '✅ けしている' : '🚫 けす'}
              </Button>
            </div>
          )}

          {!shop.bgImage && (
            <Button onClick={() => fileRef.current?.click()} disabled={uploading || (!bgUnlocked && balance < BG_PRICE)}>
              {uploading ? 'アップロード中…' : bgUnlocked ? '📷 写真をえらぶ（無料）' : `📷 写真をえらぶ（${BG_PRICE}P）`}
            </Button>
          )}

          {!shop.bgImage && !bgUnlocked && balance < BG_PRICE && (
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>あと {BG_PRICE - balance}P たまったら 手に入れられるよ</div>
          )}

          {uploadMsg && <div style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{uploadMsg}</div>}

          {shop.bgImage && (
            <>
              <div style={{ position: 'relative' }}>
                <img src={shop.bgImage} alt="はいけい"
                  style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '12px', opacity: shop.bgOn ? 1 : 0.4 }} />
                {!shop.bgOn && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569' }}>
                    いま けしているよ
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                写真は かえられないよ。こまったときは 先生に つたえてね
              </div>
            </>
          )}

          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            写真は {BG_MAX_INPUT_MB}MBまで。小さくして ほぞんするよ（1人1まい・入れかえ不可）
          </div>
        </div>
      )}

    </div>
  );
};
