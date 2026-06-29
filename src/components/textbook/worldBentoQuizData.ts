import type { TextbookQuiz } from './TextbookMode';

// World Bento 単元用クイズ（教科書モードのクイズ仕組みを流用）。
// 出典：ClassPreparation/World_Bento_Materials のワークシート/Dynamic Listening 動画に忠実。
// 各国4問（首都・言語・あいさつ・お弁当の食材）。動画は外部視聴（VIDEO_URLS）。
// ※USAは教材（ワークシート）に無いため未収録。

interface CountryData {
  id: string;
  name: string;      // 表示名（国旗＋日本語＋英語）
  capital: string;   // 首都（日本語）
  language: string;  // 言語（日本語）
  greeting: string;  // あいさつ
  bento: string[];   // お弁当に入っている食材（英語・動画の "It has ..." に忠実）
}

const COUNTRIES: CountryData[] = [
  { id: 'korea', name: '🇰🇷 韓国 (Korea)', capital: 'ソウル', language: '韓国語', greeting: 'Annyeonghaseyo', bento: ['rice', 'egg', 'meat', 'cabbage'] },
  { id: 'china', name: '🇨🇳 中国 (China)', capital: '北京（ペキン）', language: '中国語', greeting: 'Ni hao', bento: ['bread', 'meat', 'cabbage'] },
  { id: 'india', name: '🇮🇳 インド (India)', capital: 'ニューデリー', language: 'ヒンディー語など', greeting: 'Namaste', bento: ['rice', 'beans', 'onion', 'tomato'] },
  { id: 'mexico', name: '🇲🇽 メキシコ (Mexico)', capital: 'メキシコシティ', language: 'スペイン語', greeting: 'Hola', bento: ['corn', 'beans', 'meat', 'tomato'] },
  { id: 'brazil', name: '🇧🇷 ブラジル (Brazil)', capital: 'ブラジリア', language: 'ポルトガル語', greeting: 'Ola', bento: ['rice', 'beans', 'meat', 'potato'] },
  { id: 'italy', name: '🇮🇹 イタリア (Italy)', capital: 'ローマ', language: 'イタリア語', greeting: 'Ciao', bento: ['pasta', 'tomato', 'cheese'] },
  { id: 'egypt', name: '🇪🇬 エジプト (Egypt)', capital: 'カイロ', language: 'アラビア語', greeting: 'Marhaban', bento: ['rice', 'onion', 'tomato', 'beans'] },
  { id: 'turkey', name: '🇹🇷 トルコ (Turkey)', capital: 'アンカラ', language: 'トルコ語', greeting: 'Merhaba', bento: ['bread', 'tomato', 'cucumber', 'grapes'] },
  { id: 'thailand', name: '🇹🇭 タイ (Thailand)', capital: 'バンコク', language: 'タイ語', greeting: 'Sawasdee', bento: ['rice', 'meat', 'egg', 'basil'] },
  { id: 'france', name: '🇫🇷 フランス (France)', capital: 'パリ', language: 'フランス語', greeting: 'Bonjour', bento: ['bread', 'meat', 'cheese', 'grapes'] },
  { id: 'nigeria', name: '🇳🇬 ナイジェリア (Nigeria)', capital: 'アブジャ', language: '英語', greeting: 'Hello', bento: ['rice', 'tomato', 'onion', 'meat'] },
  { id: 'philippines', name: '🇵🇭 フィリピン (Philippines)', capital: 'マニラ', language: 'タガログ語・英語', greeting: 'Kumusta', bento: ['rice', 'meat', 'egg', 'onion'] },
  { id: 'australia', name: '🇦🇺 オーストラリア (Australia)', capital: 'キャンベラ', language: '英語', greeting: "G'day", bento: ['bread', 'banana', 'strawberry', 'nuts'] },
  { id: 'vietnam', name: '🇻🇳 ベトナム (Vietnam)', capital: 'ハノイ', language: 'ベトナム語', greeting: 'Xin chao', bento: ['bread', 'meat', 'carrot', 'cucumber'] },
  { id: 'uk', name: '🇬🇧 イギリス (UK)', capital: 'ロンドン', language: '英語', greeting: 'Hello', bento: ['bread', 'potato', 'apple', 'cheese'] },
  { id: 'peru', name: '🇵🇪 ペルー (Peru)', capital: 'リマ', language: 'スペイン語', greeting: 'Hola', bento: ['potato', 'corn', 'meat', 'cheese'] },
];

// 各国の Dynamic Listening 動画（Drive・リンクを知っていれば閲覧可）。「📺 動画を見る」から外部視聴。
const VIDEO_URLS: Record<string, string> = {
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

// 食材の全プール（distractor用）
const ALL_INGREDIENTS = ['rice', 'egg', 'meat', 'cabbage', 'bread', 'beans', 'onion', 'tomato', 'corn', 'potato', 'pasta', 'cheese', 'cucumber', 'grapes', 'basil', 'banana', 'strawberry', 'nuts', 'carrot', 'apple'];

// 正解＋distractor2つを、正解位置をずらして3択にする
const make = (correct: string, distractors: string[], correctIndex: number) => {
  const opts = distractors.slice(0, 2);
  opts.splice(correctIndex, 0, correct);
  return { options: opts, correctIndex };
};

// 他国の値から、正解と違うものを2つ取る（重複言語/あいさつにも対応）
const pickDistinct = (pool: string[], correct: string, ci: number): string[] => {
  const cands = [...new Set(pool.filter(v => v !== correct))];
  return [cands[ci % cands.length], cands[(ci + 3) % cands.length]];
};

export const WORLD_BENTO_QUIZZES: TextbookQuiz[] = COUNTRIES.map((c, ci) => {
  const capitals = COUNTRIES.map(x => x.capital);
  const languages = COUNTRIES.map(x => x.language);
  const greetings = COUNTRIES.map(x => x.greeting);

  // Q1 首都
  const q1 = make(c.capital, pickDistinct(capitals, c.capital, ci), ci % 3);
  // Q2 言語
  const q2 = make(c.language, pickDistinct(languages, c.language, ci + 1), (ci + 1) % 3);
  // Q3 あいさつ
  const q3 = make(c.greeting, pickDistinct(greetings, c.greeting, ci + 2), (ci + 2) % 3);
  // Q4 食材（このお弁当に入っているもの。distractorは入っていない食材）
  const notIn = ALL_INGREDIENTS.filter(i => !c.bento.includes(i));
  const q4 = make(c.bento[0], [notIn[ci % notIn.length], notIn[(ci + 7) % notIn.length]], (ci + 3) % 3);

  return {
    id: `wb-quiz-${c.id}`,
    grade: 5 as const,
    unitName: c.name,
    url: VIDEO_URLS[c.id],
    noBonus: true, // World Bentoは4問のみ（ボーナス課題なし）
    keyPhrase: "I'd like ◯◯.",
    keyPhraseJapanese: '◯◯をください。',
    questions: [
      { question: `${c.name} の首都はどこ？`, videoRef: '', type: 'choice' as const, options: q1.options, correctIndex: q1.correctIndex },
      { question: `${c.name} で話されている言語は？`, videoRef: '', type: 'choice' as const, options: q2.options, correctIndex: q2.correctIndex },
      { question: `${c.name} のあいさつは？`, videoRef: '', type: 'choice' as const, options: q3.options, correctIndex: q3.correctIndex },
      { question: `${c.name} のお弁当に入っているのは？`, videoRef: '', type: 'choice' as const, options: q4.options, correctIndex: q4.correctIndex },
    ],
  };
});
