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
    keyPhrase: "I'd like ◯◯.",
    keyPhraseJapanese: '◯◯をください。',
    questions,
  };
});
