// ミッションだけロックの「サインの合言葉」。
//
// 制作物にサインをしたあと、スタッフが子どもの端末で合言葉を入れると、
// その端末は30分だけミッションロックが外れる（✍️ のミッションも、みんなの町など ほかの画面も使える）。
//
// - 合言葉は DB の staff_secret（k='sign_pin'。アプリからは読めない）に置き、check_sign_pin で照合する
// - スタッフ画面のPINとは別。スタッフPINは子どもの前で入れない（見られて広まると、スタッフ画面に入られる）
// - あけた記録はこの端末の localStorage だけ。授業を回すための鍵で、守りの仕組みではない
import { supabase } from './supabase';

export const SIGN_FREE_MINUTES = 30;

const key = () => `signUnlockUntil_${localStorage.getItem('studentId')}`;

/** この端末が、いま合言葉であいているか */
export const isSignUnlocked = (): boolean => {
  try { return Date.now() < Number(localStorage.getItem(key()) || 0); } catch { return false; }
};

/** 合言葉が合っていれば、この端末を30分あける。あいたら true */
export const unlockWithSignPin = async (pin: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('check_sign_pin', { pin });
  if (error || data !== true) return false;
  try { localStorage.setItem(key(), String(Date.now() + SIGN_FREE_MINUTES * 60 * 1000)); } catch { return false; }
  return true;
};
