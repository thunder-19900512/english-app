// 小学生向けアプリの安全装置。
// AI英会話・おはなしづくりなど自動生成の文脈で、下ネタ・公序良俗に反する内容・
// 汚いスラング・極めてくだけた表現に反応しないためのフィルタ。

// AIへのプロンプトに必ず付ける安全ルール（英語で渡す）。
export const SAFETY_INSTRUCTION =
  "SAFETY RULES (highest priority): This app is for elementary school children. " +
  "Never produce or engage with sexual content, vulgarity, toilet/bathroom humor, violence, " +
  "insults, profanity, dirty slang, or very crude/rude expressions. " +
  "If the user says anything inappropriate, do NOT repeat it and do NOT play along. " +
  "Gently steer back to friendly, simple English practice (e.g. 'Let's keep it kind! What food do you like?'). " +
  "Always stay positive, kind, and age-appropriate.";

// 英語：明確に不適切な語（誤検知を避けるため単語境界でマッチ）
const EN_WORDS = [
  'fuck', 'fucking', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cock',
  'pussy', 'penis', 'vagina', 'boobs', 'tits', 'sex', 'sexy', 'porn', 'slut',
  'whore', 'cum', 'horny', 'nigger', 'fag', 'faggot', 'retard', 'damn', 'piss',
];

// 日本語：下ネタ・暴力・侮辱・極めてくだけた表現（部分一致）
const JA_TERMS = [
  'ちんちん', 'ちんこ', 'ちんぽ', 'まんこ', 'おっぱい', 'きんたま', 'ちくび',
  'うんち', 'うんこ', 'おしっこ', 'ちんち',
  'セックス', 'えっち', 'エッチ', 'すけべ', 'スケベ', 'やりまん', 'ぱいずり',
  '死ね', 'しね', 'ころす', '殺す', 'ぶっころ', '死ねよ',
  'きもい', 'キモい', 'うざい', 'ウザい', 'ばーか', 'くたばれ', 'クソ', 'くそ',
];

const EN_REGEX = new RegExp(`\\b(${EN_WORDS.join('|')})\\b`, 'i');

/** テキストに不適切な内容が含まれていれば true。 */
export const isInappropriate = (text: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (EN_REGEX.test(lower)) return true;
  return JA_TERMS.some((t) => text.includes(t));
};
