// Picture Dictionary の「広く浅く」より「1つの単元を深く」を得にする仕組み。
//
// 背景：加点は活動キーごとに逓減（20→10→5…）するが、辞書はキーに単元名が入るので、
// 単元を変えれば毎回「1回目＝20P」だった。結果、1コマで20単元を1回ずつ回すのが最適解になり、
// 先生の願い（1つの単元をいろいろなモードで深める）と逆になっていた（2026-09-11の授業で顕在化）。
//
// 方針（2つを掛け合わせる。ほかの倍率とまとめて上限2倍）：
//   深めボーナス … 同じ単元で、すでに別のモードをクリア済みなら上乗せ
//                   （1モード済み ×1.25、2モード以上済み ×1.5）
//   広げすぎ逓減 … 今日はじめて触る単元が3つ目は4分の3、4つ目以降は半分
//                   （1日2単元までは満額。翌日はリセット）
//
// 伝え方（2026-09-16）：「ポイントが減る」と書いたら子どもから猛反発が来た（「最悪」「やりたくなくなる」）。
// 罰として宣告するのではなく、①先に「今日あと何単元が満点か」を見せる ②減ったときは
// 「深めるほうが大きい」という次の一手として伝える。数字も 0.5/0.25 → 0.75/0.5 にゆるめた。

export interface DictKey { mode: string; cat: string }

/** 活動キーから 単元名とモードを取り出す。辞書のキーでなければ null */
export const parseDictKey = (key: string): DictKey | null => {
  let m = key.match(/^dictionary_(.+)_wordsearch$/);
  if (m) return { mode: 'wordsearch', cat: m[1] };
  m = key.match(/^dict_(learn_listen|practice_hard|practice|typing|voice|qa)_(.+)$/);
  if (m) return { mode: m[1], cat: m[2] };
  return null;
};

const dayKey = (studentId: string) => `dictDay_${studentId}`;
// 「今日」はこの端末の日付で数える。
// ※ 以前は toISOString（世界標準時）だったので、日本の朝9時まで前の日のままだった。
//    子どもの声「次の日になっても『今日ぶんは終わり』のまま」（2026-09-20）の原因。
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 今日すでに（加点つきで）触った単元。日付が変わっていれば空 */
const todaysCats = (studentId: string): string[] => {
  try {
    const d = JSON.parse(localStorage.getItem(dayKey(studentId)) || 'null');
    return d && d.date === today() && Array.isArray(d.cats) ? d.cats : [];
  } catch { return []; }
};

const rememberCat = (studentId: string, cat: string) => {
  const cats = todaysCats(studentId);
  if (!cats.includes(cat)) cats.push(cat);
  localStorage.setItem(dayKey(studentId), JSON.stringify({ date: today(), cats }));
};

export interface DictPolicy {
  multiplier: number;
  /** 子どもに見せる一言（無ければ通常表示） */
  note: string | null;
}

/**
 * 辞書の活動キーに対する倍率を返す。辞書以外は 1。
 * clearCounts は「このクリアを数える前」のものを渡す。
 */
/** 今日あと何単元まで満額か（辞書トップの案内用）。0なら「深めるとお得」の段階 */
export const fullPointCatsLeft = (studentId: string | null): number => {
  if (!studentId) return 2;
  return Math.max(0, 2 - todaysCats(studentId).length);
};

export const dictPolicy = (studentId: string, key: string, clearCounts: Record<string, number>): DictPolicy => {
  const dk = parseDictKey(key);
  if (!dk) return { multiplier: 1, note: null };

  // 深め：同じ単元で、他のモードを何種類クリア済みか
  const others = Object.entries(clearCounts)
    .filter(([k, v]) => (v || 0) > 0 && k !== key)
    .map(([k]) => parseDictKey(k))
    .filter((p): p is DictKey => !!p && p.cat === dk.cat)
    .map(p => p.mode);
  const depth = new Set(others).size;
  const depthMul = depth >= 2 ? 1.5 : depth === 1 ? 1.25 : 1;

  // 広げすぎ：今日はじめて触る単元が何個目か
  const cats = todaysCats(studentId);
  const isNewToday = !cats.includes(dk.cat);
  const nth = isNewToday ? cats.length + 1 : 0;   // 0＝今日すでに触っている単元
  const breadthMul = nth >= 4 ? 0.5 : nth === 3 ? 0.75 : 1;
  rememberCat(studentId, dk.cat);

  let note: string | null = null;
  if (breadthMul < 1) note = `今日は ${nth}つの単元に ちょうせんしたね！ ここからは 同じ単元を べつのモードで やるほうが 大きいよ（さいだい ×1.5）`;
  else if (depthMul > 1) note = `🔎 深めボーナス ×${depthMul}！ 同じ単元を ${depth}モード クリア済み`;

  return { multiplier: depthMul * breadthMul, note };
};
