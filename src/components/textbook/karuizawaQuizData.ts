import type { TextbookQuiz } from './TextbookMode';

// 軽井沢まちクイズ（P5 Town Guide 用）。World Bento クイズの仕組みをそのまま流用。
// 各スポット3問（①ここで何ができる？ ②どこにある？ ③道案内語）。
// 出典：ClassPreparation の Town Guide 教材／仕様書_まちクイズ.md

interface SpotData {
  id: string;
  name: string;       // 表示名（絵文字＋日本語＋英語）
  canDo: string;      // You can ___ here. の正解（英語）
  location: string;   // 位置・目印（英語）
}

const SPOTS: SpotData[] = [
  { id: 'station', name: '🚉 軽井沢駅 (Karuizawa Station)', canDo: 'take a train', location: 'in the center of town' },
  { id: 'ginza', name: '🛍 旧軽井沢銀座 (Old Karuizawa Ginza)', canDo: 'buy souvenirs', location: 'near the station' },
  { id: 'kumoba', name: '🌊 雲場池 (Kumoba Pond)', canDo: 'see beautiful water', location: 'next to the forest' },
  { id: 'harunire', name: '🍽 ハルニレテラス (Harunire Terrace)', canDo: 'eat lunch by the river', location: 'near Hoshino' },
  { id: 'shiraito', name: '💧 白糸の滝 (Shiraito Falls)', canDo: 'see a big waterfall', location: 'in the mountains' },
  { id: 'paulo', name: "⛪ 聖パウロ教会 (St. Paul's Church)", canDo: 'see a famous church', location: 'in the old town' },
  { id: 'prince', name: '🛒 プリンスショッピングプラザ (Prince Shopping Plaza)', canDo: 'buy many things', location: 'next to the station' },
  { id: 'kazakoshi', name: '🏫 風越公園 (Kazakoshi Park)', canDo: 'play sports', location: 'near our school' },
];

// 各スポットの学習動画（Drive・リンクを知っていれば閲覧可）。「📺 動画を見る」から外部視聴。
// 画像はWikimedia Commonsの再利用可ライセンス（動画内にクレジット表示）。音声はAna/Guy/Jennyの3人ローテ。
const VIDEO_URLS: Record<string, string> = {
  station: 'https://drive.google.com/file/d/1cho-wEr6TFar6hDfFb3omj1RHnzCc_Bq/view',
  ginza: 'https://drive.google.com/file/d/1Q8WSjwLQGQtoJdoSHZfyClueqod08C-p/view',
  kumoba: 'https://drive.google.com/file/d/1eJ1BIfb2nB2MO_7Sh0UjHq7jPWx-tP4_/view',
  harunire: 'https://drive.google.com/file/d/1cMFiz_XQLdqPGH4nsdeQYk801otomhft/view',
  shiraito: 'https://drive.google.com/file/d/1l5QqKH7RHjcPVvHv9AthCf8GKzClAey3/view',
  paulo: 'https://drive.google.com/file/d/1qOkBP7fou8cLZSVNcxq1lvLZfxW7fYTE/view',
  prince: 'https://drive.google.com/file/d/1srjYyoToXFfz2vMSbqtO0MQfPq-NKwsy/view',
  kazakoshi: 'https://drive.google.com/file/d/1S2H4M5u3Sn967KmSfCP2DbqOYgLqMi8m/view',
};

// 道案内語の問題プール（スポットidの順にローテ配置）
const DIRECTION_QUESTIONS = [
  { question: '"Go straight" のいみは？', correct: 'まっすぐ進む', distractors: ['右に曲がる', '止まる'] },
  { question: '"Turn right" のいみは？', correct: '右に曲がる', distractors: ['左に曲がる', '戻る'] },
  { question: '"It\'s next to the bank." のいみは？', correct: '銀行のとなり', distractors: ['銀行の中', '銀行の上'] },
  { question: '道をきくとき、さいしょのひとことは？', correct: 'Excuse me.', distractors: ['Good bye.', 'Here you are.'] },
];

// 正解＋distractor2つを、正解位置をずらして3択にする
const make = (correct: string, distractors: string[], correctIndex: number) => {
  const opts = distractors.slice(0, 2);
  opts.splice(correctIndex, 0, correct);
  return { options: opts, correctIndex };
};

// 他スポットの値から、正解と違うものを2つ取る
const pickDistinct = (pool: string[], correct: string, ci: number): string[] => {
  const cands = [...new Set(pool.filter(v => v !== correct))];
  return [cands[ci % cands.length], cands[(ci + 3) % cands.length]];
};

export const KARUIZAWA_QUIZZES: TextbookQuiz[] = SPOTS.map((s, si) => {
  const canDos = SPOTS.map(x => x.canDo);
  const locations = SPOTS.map(x => x.location);

  // Q1 ここで何ができる？
  const q1 = make(s.canDo, pickDistinct(canDos, s.canDo, si), si % 3);
  // Q2 どこにある？
  const q2 = make(s.location, pickDistinct(locations, s.location, si + 1), (si + 1) % 3);
  // Q3 道案内語（4問をスポット順にローテ）
  const d = DIRECTION_QUESTIONS[si % DIRECTION_QUESTIONS.length];
  const q3 = make(d.correct, d.distractors, (si + 2) % 3);

  return {
    id: `kz-${s.id}`,
    grade: 5 as const,
    unitName: s.name,
    url: VIDEO_URLS[s.id],
    noBonus: true, // 3問のみ（ボーナス課題なし）
    keyPhrase: 'You can ◯◯ here.',
    keyPhraseJapanese: 'ここで◯◯できます。',
    questions: [
      { question: `${s.name} で できることは？ (What can you do here?)`, videoRef: '', type: 'choice' as const, options: q1.options, correctIndex: q1.correctIndex },
      { question: `${s.name} は どこにある？ (Where is it?)`, videoRef: '', type: 'choice' as const, options: q2.options, correctIndex: q2.correctIndex },
      { question: d.question, videoRef: '', type: 'choice' as const, options: q3.options, correctIndex: q3.correctIndex },
    ],
  };
});
