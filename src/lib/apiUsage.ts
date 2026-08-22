// Gemini / Azure の「1日あたりの呼び出し回数」を端末ごとに記録し、上限（キャップ）で止める。
// 先生がダッシュボードで上限を設定でき、Supabase経由で全端末に同期される（localStorageにミラー）。
// 子どもたちが本格的に使い始めたので、APIの使いすぎ＝想定外の課金を防ぐための安全装置。
export type ApiType = 'gemini' | 'azure';

// 先生が未設定のときに使う、無難なデフォルト上限（端末ごと・1日あたり）。
export const DEFAULT_CAP: Record<ApiType, number> = { gemini: 50, azure: 80 };

const today = () => new Date().toISOString().slice(0, 10);

// 上限を保存（先生ダッシュボードからの設定をミラーする）。
export const setCap = (type: ApiType, cap: number) => {
  localStorage.setItem(`apiCap_${type}`, String(cap));
};

// 上限を取得。未設定ならデフォルト。0以下は「無制限」を表す。
export const getCap = (type: ApiType): number => {
  const raw = localStorage.getItem(`apiCap_${type}`);
  if (raw === null) return DEFAULT_CAP[type];
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_CAP[type];
};

// 今日の使用回数。
export const getUsage = (type: ApiType): number =>
  Number(localStorage.getItem(`apiUse_${type}_${today()}`)) || 0;

// 1回ぶん使ったと記録して、新しい合計を返す。
export const incUsage = (type: ApiType): number => {
  const n = getUsage(type) + 1;
  localStorage.setItem(`apiUse_${type}_${today()}`, String(n));
  return n;
};

// 上限に達していたら true（無制限のときは常に false）。
export const isOverCap = (type: ApiType): boolean => {
  const cap = getCap(type);
  if (cap <= 0) return false;
  return getUsage(type) >= cap;
};

// あと何回使えるか（無制限なら null）。
export const remaining = (type: ApiType): number | null => {
  const cap = getCap(type);
  if (cap <= 0) return null;
  return Math.max(0, cap - getUsage(type));
};
