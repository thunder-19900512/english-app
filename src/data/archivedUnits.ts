// 終わった単元の「アーカイブ棚」。
//
// ★また使いたくなったら、ここの行を消す（またはコメントアウトする）だけで復活します。
//   中身（問題・ダイアログ・AIのシナリオ）は消していないので、戻したその日から使えます。
//
//   例）自己紹介をまた使いたい
//       ARCHIVED_UNITS の 'intro-workshop' の行を消す → それだけで元どおり
//
// 何がどこに眠っているか：
//   自己紹介（789 English Workshop）
//     - AI英会話のUnit          … AIAssistant.tsx の FREETALK_UNITS 'intro-workshop'
//     - ダイアログ               … dialogueData.ts の 'intro-workshop'
//   World Bento（世界の弁当・お店屋さん）
//     - クイズ                   … worldBentoQuizData.ts（/textbook?set=worldbento）
//     - お店屋さんのAI英会話     … AIAssistant.tsx の SCENARIOS.bentoShop
//     - ダイアログ               … dialogueData.ts の 'wb-shop'
//     - スタッフ画面のミッション … TeacherDashboard.tsx の MISSION_PRESETS

/** アーカイブ中（＝子どもの画面に出さない）単元のID */
export const ARCHIVED_UNITS: string[] = [
  'intro-workshop', // 自己紹介（789 English Workshop）— 2026年9月アーカイブ。また使う可能性あり
  'wb-shop',        // World Bento お店屋さん（ダイアログ）
  'worldbento',     // World Bento クイズ・お店屋さんAI英会話
];

export const isArchived = (id: string): boolean => ARCHIVED_UNITS.includes(id);
