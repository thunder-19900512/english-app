import { useCallback, useEffect, useState } from 'react';
import { pushToSupabase } from '../lib/sync';
import { usePoints } from './usePoints';
import { showToast } from '../components/ui/Toast';
import { BG_PRICE, BG_UNLOCK_ID } from '../data/shopItems';
import type { ShopItem } from '../data/shopItems';

// ショップ状態。points（累計・単調増加）からは絶対に引かず、使った額を
// spent/donated（これも単調増加）で持つ。残高 = points − spent − donated。
export interface ShopState {
  spent: number;
  donated: number;
  owned: string[];
  equippedTitle: string | null;
  equippedTheme: string | null;
  equippedFrame: string | null;   // 名前のわく色（ログイン画面）
  bgImage: string | null;   // 持っている背景写真（1枚だけ。けしても消えない）
  bgOn: boolean;            // いま背景を使っているか（つけ外しは無料）
  bgSetAt: number;          // 写真を登録した時刻。先生のリセットより古ければ消える
  bgClearedAt: number;      // 先生がリセットした時刻（DB側から降ってくる）
}

const EMPTY: ShopState = { spent: 0, donated: 0, owned: [], equippedTitle: null, equippedTheme: null, equippedFrame: null, bgImage: null, bgOn: false, bgSetAt: 0, bgClearedAt: 0 };

const keyFor = (id: string) => `shop_${id}`;

export const readShop = (studentId: string): ShopState => {
  const str = localStorage.getItem(keyFor(studentId));
  if (!str) return { ...EMPTY };
  try {
    const raw = JSON.parse(str);
    const shop: ShopState = { ...EMPTY, ...raw };
    // 以前の仕様（買う＝つける）で背景を持っていた子は、
    // 「買ってある・ついている」状態として引き継ぐ（払い直しをさせない）。
    if (shop.bgImage) {
      if (raw.bgOn === undefined) shop.bgOn = true;
      if (!shop.owned.includes(BG_UNLOCK_ID)) shop.owned = [...shop.owned, BG_UNLOCK_ID];
    }
    return shop;
  } catch { return { ...EMPTY }; }
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
    if (bal < item.price) { showToast('ポイントが 足りないよ！', 'fail'); return false; }
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

  const equipFrame = useCallback((id: string | null) => {
    if (!studentId) return;
    const next = { ...readShop(studentId), equippedFrame: id };
    writeShop(studentId, next); setShop(next);
  }, [studentId]);

  const equipTheme = useCallback((id: string | null) => {
    if (!studentId) return;
    const next = { ...readShop(studentId), equippedTheme: id };
    writeShop(studentId, next); setShop(next);
  }, [studentId]);

  // 写真を登録する。登録できるのは1回だけ（あとから入れ替えはできない）。
  // このとき BG_PRICE を消費する。
  const setBackgroundImage = useCallback((url: string): boolean => {
    if (!studentId) return false;
    const cur = readShop(studentId);
    if (cur.bgImage) { showToast('背景の写真は 1枚だけだよ', 'fail'); return false; }
    // すでに買っている（＝先生に消してもらった後の登録し直し）なら、もう払わない
    const unlocked = cur.owned.includes(BG_UNLOCK_ID);
    if (!unlocked) {
      const bal = totalPoints - cur.spent - cur.donated;
      if (bal < BG_PRICE) { showToast('ポイントが 足りないよ！', 'fail'); return false; }
    }
    const next: ShopState = {
      ...cur,
      spent: unlocked ? cur.spent : cur.spent + BG_PRICE,
      owned: unlocked ? cur.owned : [...cur.owned, BG_UNLOCK_ID],
      bgImage: url,
      bgOn: true,
      bgSetAt: Date.now(),
    };
    writeShop(studentId, next); setShop(next);
    showToast(unlocked ? '🖼️ 背景を 登録したよ！' : `🖼️ 背景を 手に入れた！（−${BG_PRICE}P）`, 'points');
    return true;
  }, [studentId, totalPoints]);

  // 背景の「つける／けす」。何回でも無料（写真は持ったまま）。
  const setBackgroundOn = useCallback((on: boolean) => {
    if (!studentId) return;
    const next = { ...readShop(studentId), bgOn: on };
    writeShop(studentId, next); setShop(next);
    showToast(on ? '🖼️ 背景を つけたよ' : '🖼️ 背景を けしたよ', 'success');
  }, [studentId]);

  // 写真を消す。子どもの画面からは呼ばない（1枚しか登録できない仕様のため）。
  // 先生が「ふさわしくない写真」をリセットしたときに、同期側から使う。
  const clearBackground = useCallback(() => {
    if (!studentId) return;
    const next = { ...readShop(studentId), bgImage: null, bgOn: false, bgSetAt: 0, bgClearedAt: 0 };
    writeShop(studentId, next); setShop(next);
  }, [studentId]);

  const donate = useCallback((amount: number): boolean => {
    if (!studentId || amount <= 0) return false;
    const cur = readShop(studentId);
    const bal = totalPoints - cur.spent - cur.donated;
    if (bal < amount) { showToast('ポイントが 足りないよ！', 'fail'); return false; }
    const next = { ...cur, donated: cur.donated + amount };
    writeShop(studentId, next); setShop(next);
    showToast(`🌳 みんなの木に ${amount}P あげた！`, 'points');
    return true;
  }, [studentId, totalPoints]);

  return { shop, balance, totalPoints, buy, equipTitle, equipTheme, equipFrame, setBackgroundImage, setBackgroundOn, clearBackground, donate };
};
