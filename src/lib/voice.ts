// 発音の読み上げ（Web Speech API）で、端末・発話ごとに声が変わって
// たまに「かすれた男性声」になるのを防ぐため、クリアな英語ボイスを優先順で1つに固定する。

// 優先したいクリアなボイス（だいたい女性。Chrome/Mac/Edge/iOSで使われる名前）
const PREFERRED = [
  'Google US English',
  'Samantha',            // macOS / iOS の定番クリア女性
  'Microsoft Aria',
  'Microsoft Jenny',
  'Microsoft Zira',
  'Google UK English Female',
  'Karen', 'Moira', 'Tessa', 'Serena', // 各国英語のクリア女性
];

// macOSのノベルティ/低品質ボイス（かすれ・効果音系）は避ける
const DENY = ['Fred', 'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Deranged', 'Hysterical', 'Jester', 'Organ', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox', 'Junior', 'Ralph', 'Eddy', 'Reed', 'Rocko', 'Flo', 'Grandpa', 'Grandma', 'Sandy', 'Shelley', 'Superstar'];

let cached: SpeechSynthesisVoice | null = null;

export const getPreferredVoice = (): SpeechSynthesisVoice | null => {
  if (cached) return cached;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  for (const name of PREFERRED) {
    const v = voices.find(x => x.name.includes(name));
    if (v) { cached = v; return v; }
  }
  const isEnUS = (v: SpeechSynthesisVoice) => /en[-_]us/i.test(v.lang);
  const allowed = (v: SpeechSynthesisVoice) => !DENY.some(d => v.name.includes(d));
  const enUS = voices.find(v => isEnUS(v) && allowed(v));
  if (enUS) { cached = enUS; return enUS; }
  const anyEn = voices.find(v => v.lang.toLowerCase().startsWith('en') && allowed(v));
  if (anyEn) { cached = anyEn; return anyEn; }
  cached = voices.find(isEnUS) || null;
  return cached;
};

// 起動時にボイスを読み込み（非同期で揃うブラウザがあるので voiceschanged で更新）
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => { cached = null; getPreferredVoice(); };
  } catch { /* noop */ }
}
