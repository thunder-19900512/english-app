// ポイントを使うときの合言葉（数字4けた）。なりすまし対策（2026-09-19）。
//
// きっかけ：名前をタップするだけで誰でもその子として入れるので、他の子のポイントを
// 勝手に「みんなの木」へ寄付された（子どもの声）。ログインは今のまま軽くして、
// 「使うとき」だけ本人しか知らない合言葉を入れる。
//
// 合言葉はSupabaseに「ハッシュ」でしか残らず、アプリからは読めない（spend_pins は select 不可）。
// 決める・確かめる・消すは、すべてDBの関数（set/check/reset_spend_pin）経由。
//   - 決められるのは、先生が「合言葉を決める時間」にしている間だけ、まだ無い子だけ
//     （あとから他の子が勝手に作る／上書きすることはできない）
//   - 5回まちがえると10分使えない
//   - 忘れた子は、先生の画面で消す → 次の「決める時間」にもう一度決める
//
// 先生の切り替え（app_settings_v1.spendMode）：
//   'locked' … ポイントを使えない（貯めるのはOK）。導入前のお知らせ期間
//   'setup'  … 合言葉を決める時間。まだの子には決める画面が出る。決めた子は使える
//   'open'   … ふだん。使うときに合言葉
import { supabase } from './supabase';
import { isTrialId } from './trial';

export type SpendMode = 'locked' | 'setup' | 'open';

const OK_MINUTES = 10; // 一度通ったら、この間は聞き直さない（木に何回か入れるときにしつこくない）
const okKey = (id: string) => `spendOk_${id}`;

export const spendExempt = (id: string | null) => !id || isTrialId(id);

export const hasSpendPin = async (id: string): Promise<boolean | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('spend_pin_status', { sid: id });
  return error ? null : !!data;
};

export const setSpendPin = async (id: string, pin: string): Promise<string> => {
  if (!supabase) return 'offline';
  const { data, error } = await supabase.rpc('set_spend_pin', { sid: id, pin });
  return error ? 'offline' : String(data);
};

export const checkSpendPin = async (id: string, pin: string): Promise<string> => {
  if (!supabase) return 'offline';
  const { data, error } = await supabase.rpc('check_spend_pin', { sid: id, pin });
  if (!error && data === 'ok') sessionStorage.setItem(okKey(id), String(Date.now()));
  return error ? 'offline' : String(data);
};

export const recentlyVerified = (id: string) =>
  Date.now() - Number(sessionStorage.getItem(okKey(id)) || 0) < OK_MINUTES * 60 * 1000;

export const forgetVerified = (id: string) => sessionStorage.removeItem(okKey(id));

// ── 画面のどこからでも「合言葉を聞いて」と頼めるようにする（SpendGate が受け取って出す）
type Asker = () => Promise<boolean>;
let asker: Asker | null = null;
export const registerSpendAsker = (fn: Asker | null) => { asker = fn; };

/** ポイントを使う直前に呼ぶ。true なら使ってよい */
export const ensureSpendAllowed = async (): Promise<boolean> => {
  const id = localStorage.getItem('studentId');
  if (spendExempt(id)) return true;
  if (!asker) return false;
  return asker();
};
