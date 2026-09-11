// お試しアカウント（本物の子どもではないログイン）の扱いを1か所にまとめる。
//
//   00 = Test（スタッフ用）… PINが要る。全体ロックの対象外（ロック中もデモが見せられる）
//   99 = おためし（おうちの人・見学の方用）… PIN不要。全体ロックの対象になる。
//        記録はこの端末だけに置き、Supabaseには送らない（名簿にもランキングにも出ない）
//
// どちらもポイントはたまらない。クリア時に「子どもたちには ＋◯ポイント たまります」と見せる。

export const STAFF_TEST_ID = '00';
export const GUEST_ID = '99';
export const GUEST_NAME = 'おためし';

export const isTrialId = (id: string | null | undefined) => id === STAFF_TEST_ID || id === GUEST_ID;
export const isGuestId = (id: string | null | undefined) => id === GUEST_ID;

export const currentIsTrial = () => isTrialId(localStorage.getItem('studentId'));

/** おためし（99）の端末内の記録を消して、毎回まっさらな状態から見られるようにする */
export const resetGuestData = () => {
  const suffix = `_${GUEST_ID}`;
  Object.keys(localStorage)
    .filter(k => k.endsWith(suffix))
    .forEach(k => localStorage.removeItem(k));
};
