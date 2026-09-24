// 「今日のミッション」ボーナス。
//
// 先生が配信したミッションの画面でクリアすると、ポイントが増える。
// ねらいは「今日はここをやってほしい」に子どもを自然に集めること。
//
// 仕組み：
//   - useAppSettings が受け取ったミッション一覧を、この端末に控えておく（下の saveMissionCache）
//   - addPoints は、いま見ている画面がミッションの行き先と一致するかを見て倍率をかける
//   - 加点そのものは今までどおり addPoints の逓減ルールに乗る（連打で稼げないのは変わらない）

export const MISSION_MULTIPLIER = 1.5;

const CACHE_KEY = 'todayMissions_cache';

export interface CachedMission { label: string; route: string }

export const saveMissionCache = (missions: CachedMission[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(missions || []));
  } catch { /* 保存できなくてもボーナスが付かないだけ */ }
};

export const loadMissionCache = (): CachedMission[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
};

/** URLを「パス」と「クエリ」に分けて、比較しやすい形にする */
const parse = (url: string) => {
  const clean = url.replace(/^#/, '');
  const [path, query] = clean.split('?');
  let decoded = path;
  try { decoded = decodeURIComponent(path); } catch { /* そのまま使う */ }
  return { path: decoded.replace(/\/+$/, ''), params: new URLSearchParams(query || '') };
};

/**
 * いまの画面が、そのミッションの中かどうか。
 * ミッションより深い画面（例：ミッション=辞書「町」、いま=町の言葉さがし）も「中」とみなす。
 */
export const isOnMission = (currentUrl: string, missionRoute: string): boolean => {
  const cur = parse(currentUrl);
  const mis = parse(missionRoute);
  if (cur.path !== mis.path && !cur.path.startsWith(mis.path + '/')) return false;
  // ミッション側で指定されているクエリ（?set=karuizawa 等）は、いまの画面にも同じ値で要る
  for (const [k, v] of mis.params) {
    if (cur.params.get(k) !== v) return false;
  }
  return true;
};

/** いまの画面に当てはまるミッションを返す（無ければ null） */
export const currentMission = (currentUrl = window.location.hash): CachedMission | null =>
  loadMissionCache().find(m => m.route && isOnMission(currentUrl, m.route)) || null;
