// ごほうびショップのカタログ。学習の注意を奪わない低刺激なごほうび。
export interface ShopItem { id: string; emoji: string; name: string; desc: string; price: number; }

export const TITLES: ShopItem[] = [
  { id: 't-phonics', emoji: '🔤', name: 'フォニックスの旅人', desc: '音のぼうけんに出た証', price: 100 },
  { id: 't-talk', emoji: '🗣️', name: 'トーキング・スター', desc: '会話をがんばる人', price: 150 },
  { id: 't-bento', emoji: '🍱', name: 'ベントーマスター', desc: '世界の料理博士', price: 150 },
  { id: 't-word', emoji: '📚', name: 'たんごハンター', desc: '単語をあつめる人', price: 200 },
  { id: 't-mic', emoji: '🎤', name: '発音キング', desc: '発音チェックの達人', price: 300 },
  { id: 't-trophy', emoji: '🏆', name: 'レジェンド', desc: 'つよい。', price: 500 },
  { id: 't-star', emoji: '🌟', name: 'スーパースター', desc: 'かがやいている', price: 800 },
  { id: 't-dragon', emoji: '🐉', name: 'ドラゴンマスター', desc: '最高位のあかし', price: 1500 },
];

export const THEMES: ShopItem[] = [
  { id: 'th-sakura', emoji: '🌸', name: 'さくらテーマ', desc: 'ピンクの画面', price: 250 },
  { id: 'th-umi', emoji: '🌊', name: 'うみテーマ', desc: '青い画面', price: 250 },
  { id: 'th-mori', emoji: '🌲', name: 'もりテーマ', desc: '緑の画面', price: 250 },
  { id: 'th-yozora', emoji: '🌌', name: 'よぞらテーマ', desc: '夜空のダーク画面', price: 400 },
  { id: 'th-gold', emoji: '👑', name: 'ゴールドテーマ', desc: '金ぴか。えらい。', price: 800 },
];

// カタログからidで引く（表示や称号絵文字の解決に使う）
export const findTitle = (id: string | null | undefined) => TITLES.find(t => t.id === id) || null;
export const findTheme = (id: string | null | undefined) => THEMES.find(t => t.id === id) || null;

// クラスの木：TREE_STEP ポイントごとに1段階成長（最大10段階）
export const TREE_STAGES = ['🌱', '🌿', '🪴', '🌳', '🌳✨', '🌸🌳', '🌸🌳✨', '🍎🌳', '🍎🌳✨', '🏆🌳'];
export const TREE_STEP = 500;
