import type { TextbookQuiz } from './TextbookMode';

// World Bento 単元用のクイズ（教科書モードのクイズ仕組みを流用）。
// 動画は外部視聴。ここでは「その国の料理はどれ？」を絵（語）で選ぶ簡単な選択クイズだけを用意する。
// 料理名は Picture Dictionary「食べ物＋（世界の料理）」に合わせた事実ベース。

const COUNTRIES: { id: string; name: string; dishes: string[] }[] = [
  { id: 'usa', name: '🇺🇸 アメリカ (USA)', dishes: ['bagel', 'brownie', 'mac and cheese'] },
  { id: 'korea', name: '🇰🇷 韓国 (Korea)', dishes: ['kimchi', 'bibimbap', 'gimbap'] },
  { id: 'china', name: '🇨🇳 中国 (China)', dishes: ['dumpling', 'fried rice', 'steamed bun'] },
  { id: 'india', name: '🇮🇳 インド (India)', dishes: ['naan', 'samosa', 'biryani'] },
  { id: 'mexico', name: '🇲🇽 メキシコ (Mexico)', dishes: ['taco', 'burrito', 'guacamole'] },
  { id: 'brazil', name: '🇧🇷 ブラジル (Brazil)', dishes: ['feijoada', 'cheese bread', 'brigadeiro'] },
  { id: 'italy', name: '🇮🇹 イタリア (Italy)', dishes: ['lasagna', 'risotto', 'gelato'] },
  { id: 'egypt', name: '🇪🇬 エジプト (Egypt)', dishes: ['koshari', 'falafel', 'pita bread'] },
  { id: 'turkey', name: '🇹🇷 トルコ (Turkey)', dishes: ['kebab', 'baklava', 'pide'] },
  { id: 'thailand', name: '🇹🇭 タイ (Thailand)', dishes: ['pad thai', 'green curry', 'mango sticky rice'] },
  { id: 'france', name: '🇫🇷 フランス (France)', dishes: ['baguette', 'croissant', 'crepe'] },
  { id: 'nigeria', name: '🇳🇬 ナイジェリア (Nigeria)', dishes: ['jollof rice', 'suya', 'plantain'] },
  { id: 'philippines', name: '🇵🇭 フィリピン (Philippines)', dishes: ['adobo', 'lumpia', 'sinigang'] },
  { id: 'australia', name: '🇦🇺 オーストラリア (Australia)', dishes: ['meat pie', 'vegemite', 'lamington'] },
  { id: 'vietnam', name: '🇻🇳 ベトナム (Vietnam)', dishes: ['pho', 'banh mi', 'fish sauce'] },
  { id: 'uk', name: '🇬🇧 イギリス (UK)', dishes: ['fish and chips', 'scone', 'baked beans'] },
  { id: 'peru', name: '🇵🇪 ペルー (Peru)', dishes: ['ceviche', 'quinoa', 'lomo saltado'] },
];

// 各国の Dynamic Listening 動画（Google Drive・リンクを知っていれば閲覧可）。
// クイズの「📺 動画を見る」ボタンから外部視聴する（別室の子はこのリンクで視聴）。
const VIDEO_URLS: Record<string, string> = {
  usa: 'https://drive.google.com/file/d/1E8n0UQtSLuWZJ35nOirNmiAflJkqaQqW/view',
  korea: 'https://drive.google.com/file/d/1jdmyRk18ONRPVH7WIdLmp3XF4sxoE3R_/view',
  china: 'https://drive.google.com/file/d/1_A_oTo9j_CeXRX3m9bJakLiJTekAPSgA/view',
  india: 'https://drive.google.com/file/d/1MNE_e4Aopeb2V1WZwhYszUEXkUlUj0uI/view',
  mexico: 'https://drive.google.com/file/d/1W_VgyXK5vVB9LdK1-Kh7faSrAWWBG3GA/view',
  brazil: 'https://drive.google.com/file/d/1leW0-lL7CIHTtRSYaD0OdIO5sOLoTJRU/view',
  italy: 'https://drive.google.com/file/d/1nP-y99FfYuYVKBUAaEjATNhD67zngKtj/view',
  egypt: 'https://drive.google.com/file/d/1KdVGV-DA97Wv0zfRKiqFyRdDyrqWIeda/view',
  turkey: 'https://drive.google.com/file/d/1CtrFXFZqMxrVI_jbAHFKBw3x2odV_ON0/view',
  thailand: 'https://drive.google.com/file/d/1y8U2Kef-fbzQp8FaMtThgpBezbDV8m6v/view',
  france: 'https://drive.google.com/file/d/1yVRIurNTTxrv01cKU5IES3VkhNEsIGLz/view',
  nigeria: 'https://drive.google.com/file/d/1gQ9PP1HhwVhTOeyRHR5PfBKm276id7vU/view',
  philippines: 'https://drive.google.com/file/d/18arYMLPJE-qpAsNOLsaqFUaerK9rvSAo/view',
  australia: 'https://drive.google.com/file/d/16VdcF22fNKOciKG8liDeFzmPR8ljT435/view',
  vietnam: 'https://drive.google.com/file/d/1EUZElBBUzovlUG4w9a4ZzQIhR-U3VeoW/view',
  uk: 'https://drive.google.com/file/d/1L-gUHxGBczhBFqWxJGGd4UDV4eiG4eUU/view',
  // peru は動画なし
};

// 各国2問：その国の料理を、他国の料理2つの中から選ぶ（絵＝語で選ぶ簡単クイズ）
export const WORLD_BENTO_QUIZZES: TextbookQuiz[] = COUNTRIES.map((c, ci) => {
  const others = COUNTRIES.filter(x => x.id !== c.id);
  const questions = c.dishes.slice(0, 2).map((dish, qi) => {
    // 他国から重ならない distractor を2つ選ぶ（決定的に）
    const d1 = others[(ci + qi) % others.length].dishes[0];
    const d2 = others[(ci + qi + 5) % others.length].dishes[1];
    // 正解の位置を散らす（毎回「先頭が正解」にならないように）
    const correctIndex = (ci + qi) % 3;
    const options = [d1, d2];
    options.splice(correctIndex, 0, dish);
    return { question: `${c.name} の料理はどれ？`, videoRef: '', type: 'choice' as const, options, correctIndex };
  });
  return {
    id: `wb-quiz-${c.id}`,
    grade: 5 as const, // World Bentoは学年に依らないが型を満たすためのダミー
    unitName: c.name,
    url: VIDEO_URLS[c.id],
    keyPhrase: "I'd like ◯◯.",
    keyPhraseJapanese: '◯◯をください。',
    questions,
  };
});
