import { useCallback, useEffect, useState } from 'react';
import { pushToSupabase } from '../lib/sync';
import { usePoints } from './usePoints';
import { showToast } from '../components/ui/Toast';
import { BG_PRICE } from '../data/shopItems';
import type { ShopItem } from '../data/shopItems';

// ショップ状態。points（累計・単調増加）からは絶対に引かず、使った額を
// spent/donated（これも単調増加）で持つ。残高 = points − spent − donated。
export interface ShopState {
  spent: number;
  donated: number;
  owned: string[];
  equippedTitle: string | null;
  equippedTheme: string | null;
  bgImage: string | null;
}

const EMPTY: ShopState = { spent: 0, donated: 0, owned: [], equippedTitle: null, equippedTheme: null, bgImage: null };

const keyFor = (id: string) => `shop_${id}`;

export const readShop = (studentId: string): ShopState => {
  const str = localStorage.getItem(keyFor(studentId));
  if (!str) return { ...EMPTY };
  try { return { ...EMPTY, ...JSON.parse(str) }; } catch { return { ...EMPTY }; }
};

const writeShop = (studentId: string, shop: ShopState) => {
  localStorage.setItem(keyFor(studentId), JSON.stringify(shop));
  window.dispatchEvent(new Event('shopUpdated'));
  pushToSupabase(studentId);
};

export const useShop = () => {
  const studentId = localStorage.getItem('studentId');
  const { totalPoints } = usePoints();
  const [shop, setShop] = useState<ShopState>(() => (studentId ? readShop(studentId) : { ...EMPTY }));

  useEffect(() => {
    const refresh = () => { if (studentId) setShop(readShop(studentId)); };
    window.addEventListener('shopUpdated', refresh);
    // pull等でlocalStorageが更新されたときのために、pointsUpdatedでも軽く再読込
    window.addEventListener('pointsUpdated', refresh);
    return () => {
      window.removeEventListener('shopUpdated', refresh);
      window.removeEventListener('pointsUpdated', refresh);
    };
  }, [studentId]);

  const balance = Math.max(0, totalPoints - shop.spent - shop.donated);

  const buy = useCallback((item: ShopItem): boolean => {
    if (!studentId) return false;
    const cur = readShop(studentId);
    if (cur.owned.includes(item.id)) return false; // 二重購入防止
    const bal = totalPoints - cur.spent - cur.donated;
    if (bal < item.price) { showToast('ポイントが たりないよ！', 'fail'); return false; }
    const next: ShopState = { ...cur, spent: cur.spent + item.price, owned: [...cur.owned, item.id] };
    writeShop(studentId, next);
    setShop(next);
    showToast(`🎉 「${item.name}」を 手に入れた！`, 'points');
    return true;
  }, [studentId, totalPoints]);

  const equipTitle = useCallback((id: string | null) => {
    if (!studentId) return;
    const next = { ...readShop(studentId), equippedTitle: id };
    writeShop(studentId, next); setShop(next);
  }, [studentId]);

  const equipTheme = useCallback((id: string | null) => {
    if (!studentId) return;
    const next = { ...readShop(studentId), equippedTheme: id };
    writeShop(studentId, next); setShop(next);
  }, [studentId]);

  // 背景を「つける」＝BG_PRICE を消費（つけるたびにかかる）。残高不足なら失敗。
  const buyBackground = useCallback((url: string): boolean => {
    if (!studentId) return false;
    const cur = readShop(studentId);
    const bal = totalPoints - cur.spent - cur.donated;
    if (bal < BG_PRICE) { showToast('ポイントが たりないよ！', 'fail'); return false; }
    const next = { ...cur, spent: cur.spent + BG_PRICE, bgImage: url };
    writeShop(studentId, next); setShop(next);
    showToast(`🖼️ はいけいを かえた！（−${BG_PRICE}P）`, 'points');
    return true;
  }, [studentId, totalPoints]);

  // 背景を「はずす」＝無料。再度つけるときはまた BG_PRICE がかかる。
  const clearBackground = useCallback(() => {
    if (!studentId) return;
    const next = { ...readShop(studentId), bgImage: null };
    writeShop(studentId, next); setShop(next);
  }, [studentId]);

  const donate = useCallback((amount: number): boolean => {
    if (!studentId || amount <= 0) return false;
    const cur = readShop(studentId);
    const bal = totalPoints - cur.spent - cur.donated;
    if (bal < amount) { showToast('ポイントが たりないよ！', 'fail'); return false; }
    const next = { ...cur, donated: cur.donated + amount };
    writeShop(studentId, next); setShop(next);
    showToast(`🌳 みんなの木に ${amount}P あげた！`, 'points');
    return true;
  }, [studentId, totalPoints]);

  return { shop, balance, totalPoints, buy, equipTitle, equipTheme, buyBackground, clearBackground, donate };
};
