import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../hooks/useShop';
import { Button } from '../ui/Button';
import { ArrowLeft, Star } from 'lucide-react';
import { TITLES, THEMES, type ShopItem } from '../../data/shopItems';
import { supabase } from '../../lib/supabase';

type Tab = 'title' | 'theme' | 'bg';

// 画像をcanvasで最大1600px・JPEG品質0.8に圧縮してBlobにする
const compressImage = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    const max = 1600;
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
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.8);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load failed')); };
  img.src = url;
});

export const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { shop, balance, totalPoints, buy, equipTitle, equipTheme, setBgImage } = useShop();
  const [tab, setTab] = useState<Tab>('title');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const studentId = localStorage.getItem('studentId');

  const owned = (id: string) => shop.owned.includes(id);

  const handleBuy = (item: ShopItem) => {
    if (window.confirm(`「${item.name}」を ${item.price}P で かいますか？`)) buy(item);
  };

  const handleUpload = async (file: File) => {
    if (!supabase || !studentId) return;
    setUploading(true); setUploadMsg('');
    try {
      const blob = await compressImage(file);
      const path = `${studentId}.jpg`;
      const { error } = await supabase.storage.from('backgrounds').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('backgrounds').getPublicUrl(path);
      setBgImage(`${data.publicUrl}?t=${Date.now()}`); // キャッシュ回避
      setUploadMsg('はいけいを かえたよ！🎉');
    } catch (e) {
      setUploadMsg('アップロードできなかった…もう一回ためしてね');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(''), 5000);
    }
  };

  const ItemCard: React.FC<{ item: ShopItem; equipped: boolean; onEquip: () => void; onUnequip: () => void }> =
    ({ item, equipped, onEquip, onUnequip }) => {
      const has = owned(item.id);
      const canBuy = balance >= item.price;
      return (
        <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', border: equipped ? '2px solid var(--color-success)' : '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2.4rem' }}>{item.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.name} {equipped && <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>（つけてる）</span>}</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.desc}</div>
          </div>
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
          <Star fill="var(--color-accent)" stroke="var(--color-accent)" size={28} /> つかえるポイント：{balance}P
        </div>
        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.3rem' }}>
          ためたポイント（{totalPoints}P）は へらないよ。記録は そのまま安全！
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
          <p style={{ textAlign: 'center', color: '#666', margin: 0, fontSize: '0.9rem' }}>つけると、画面のいろが かわるよ！</p>
          {THEMES.map(t => (
            <ItemCard key={t.id} item={t} equipped={shop.equippedTheme === t.id}
              onEquip={() => equipTheme(t.id)} onUnequip={() => equipTheme(null)} />
          ))}
        </div>
      )}

      {tab === 'bg' && (
        <div className="glass-card flex-col gap-md" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
            すきな写真を えらぶと、アプリのはいけいに なるよ。<br />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>※ 自分だけに見えるよ。学校にふさわしい写真にしよう！</span>
          </p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.currentTarget.value = ''; }} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'アップロード中…' : '📷 写真をえらぶ'}
          </Button>
          {shop.bgImage && (
            <Button variant="outline" onClick={() => setBgImage(null)}>はいけいを もとにもどす</Button>
          )}
          {uploadMsg && <div style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{uploadMsg}</div>}
          {shop.bgImage && (
            <img src={shop.bgImage} alt="はいけい" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '12px' }} />
          )}
        </div>
      )}
    </div>
  );
};
