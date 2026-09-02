// 英検レベルの申告（AI英会話の歯ごたえを、その子の実力に合わせて変える）
//
// 考えかた：
//   - レベルは「AIの英語の難しさ」と「クリアの条件」の両方を動かす。
//     上のレベルほど、AIは長く自然に話し、こちらにも文・理由・質問返しを求める。
//   - 高いレベルを申告しても、ラクにはならず「きびしくなる」。
//     だから申告を盛っても得しない（＝自己申告で運用できる）。
//   - 既存の「🔥上級モード」は残す。レベル＝土台の難易度、上級＝さらに一段きびしく、の二段構え。
//
// 対応する英検の目安（日本英語検定協会の「各級の目安」より）：
//   5級=中学初級 / 4級=中学中級 / 3級=中学卒業 / 準2級=高校中級 / 2級=高校卒業

export interface EikenLevel {
  id: string;
  label: string;       // 選択ボタンの表示
  hintJa: string;      // 子ども向けの一言
  color: string;
  /** AIへの指示（英語）。話す側の英語と、こちらに求める答えかたの両方を決める */
  spec: string;
  /** ゴール到達の追加条件（英語）。上のレベルほど条件が増える */
  goalSuffix: string;
  /** AIの1返信あたりの英文の本数（表示フォーマット用） */
  sentences: string;
  /** クリア時のポイント倍率（きびしい条件をクリアした分だけ上乗せ） */
  multiplier: number;
}

export const EIKEN_LEVELS: EikenLevel[] = [
  {
    id: 'none',
    label: '英検はまだ / わからない',
    hintJa: 'AIがあなたの英語を見て、ちょうどよく合わせてくれるよ。',
    color: '#64748b',
    spec:
      'ADAPT to the user\'s level: estimate their English ability from their messages. ' +
      'If they write very short/simple text, make mistakes, or use Japanese, reply with VERY short and VERY simple English. ' +
      'If they write well, you may use slightly longer and more natural English.',
    goalSuffix: '',
    sentences: 'exactly ONE short English sentence',
    multiplier: 1,
  },
  {
    id: 'g5',
    label: '英検5級',
    hintJa: '中学1年生くらい。かんたんな英語でゆっくり話すよ。',
    color: '#10b981',
    spec:
      'The user is at EIKEN Grade 5 level (beginner, roughly first-year junior high school). ' +
      'YOUR ENGLISH: one short sentence of about 5-8 very common words. Present tense only (be-verb, simple verbs, can). No idioms. ' +
      'WHAT YOU ACCEPT: single words and short phrases are fine. Praise any attempt. ' +
      'If the user writes Japanese, accept it, then show them the English sentence they could have said.',
    goalSuffix: '',
    sentences: 'exactly ONE short English sentence',
    multiplier: 1,
  },
  {
    id: 'g4',
    label: '英検4級',
    hintJa: '中学2年生くらい。過去形や未来のことも出てくるよ。',
    color: '#3b82f6',
    spec:
      'The user is at EIKEN Grade 4 level (roughly second-year junior high school). ' +
      'YOUR ENGLISH: one or two sentences, up to about 12 words each. You may use past tense, future (will / be going to), ' +
      'comparatives, and connectors (and, but, so, because). ' +
      'WHAT YOU EXPECT: the user should answer in a FULL SENTENCE with a subject and a verb. ' +
      'If they answer with a single word, ask them kindly to say it as a whole sentence. ' +
      'If the user writes Japanese, ask them to try it in English.',
    goalSuffix:
      ' The goal also requires the user to answer in complete sentences (not single words) at least twice.',
    sentences: 'ONE or TWO short English sentences',
    multiplier: 1.1,
  },
  {
    id: 'g3',
    label: '英検3級',
    hintJa: '中学卒業くらい。理由まで聞かれるし、こちらから質問も必要。',
    color: '#8b5cf6',
    spec:
      'The user is at EIKEN Grade 3 level (roughly junior high school graduate). ' +
      'YOUR ENGLISH: two natural sentences. You may use the present perfect, the passive, infinitives and "that" clauses. ' +
      'End most turns with a follow-up question. ' +
      'WHAT YOU EXPECT: complete sentences. Ask "Why?" or "Tell me more." when an answer is thin. ' +
      'Do not accept Japanese: kindly ask the user to say it in English.',
    goalSuffix:
      ' The goal ALSO requires ALL of these: (1) the user answers in complete sentences, ' +
      '(2) the user gives a REASON at least once (because / so that ...), and ' +
      '(3) the user asks YOU at least one question. Do not grant the goal until all three have happened.',
    sentences: 'TWO natural English sentences',
    multiplier: 1.25,
  },
  {
    id: 'p2',
    label: '英検準2級',
    hintJa: '高校中級くらい。意見＋理由＋例まで求められるよ。',
    color: '#f59e0b',
    spec:
      'The user is at EIKEN Grade Pre-2 level (roughly intermediate high school). ' +
      'YOUR ENGLISH: two or three natural sentences at normal speed for a fluent speaker. ' +
      'Do not simplify your vocabulary much. You may move the topic toward everyday social themes ' +
      '(school life, the town, the environment, travel, part-time work). ' +
      'WHAT YOU EXPECT: answers of two or more sentences, with a reason and a concrete example. ' +
      'Push back ONCE with "Why do you think so?" or "Can you give me an example?" before you are satisfied. ' +
      'Do not accept Japanese.',
    goalSuffix:
      ' The goal ALSO requires ALL of these: (1) the user speaks in two or more sentences per turn at least twice, ' +
      '(2) the user gives a reason AND a concrete example, and ' +
      '(3) the user asks YOU at least one question. Do not grant the goal until all three have happened.',
    sentences: 'TWO or THREE natural English sentences',
    multiplier: 1.4,
  },
  {
    id: 'g2',
    label: '英検2級',
    hintJa: '高校卒業くらい。反論もされるので、言い返せたらクリア。',
    color: '#ef4444',
    spec:
      'The user is at EIKEN Grade 2 level (roughly high school graduate). ' +
      'YOUR ENGLISH: about three natural sentences, in ordinary adult register. Do NOT simplify your vocabulary. ' +
      'You may discuss abstract and social topics (education, technology, the environment, local community, the future of work). ' +
      'WHAT YOU EXPECT: an opinion supported by a reason and an example. ' +
      'CHALLENGE the user once: offer a polite counter-argument ("Some people would say the opposite, because ...") ' +
      'and ask how they would respond. Do not accept Japanese.',
    goalSuffix:
      ' The goal ALSO requires ALL of these: (1) the user states an OPINION with a reason and an example, ' +
      '(2) the user responds to your counter-argument with a further point of their own, and ' +
      '(3) the user asks YOU at least one question. Do not grant the goal until all three have happened.',
    sentences: 'about THREE natural English sentences',
    multiplier: 1.6,
  },
];

export const findEiken = (id: string | null | undefined): EikenLevel =>
  EIKEN_LEVELS.find(l => l.id === id) || EIKEN_LEVELS[0];

/** 申告レベルの保存先（端末＋Supabaseの students.eiken_level に同期） */
export const eikenKey = (studentId: string) => `eiken_${studentId}`;

export const loadEiken = (studentId: string | null): string => {
  if (!studentId) return 'none';
  return localStorage.getItem(eikenKey(studentId)) || 'none';
};

export const saveEiken = (studentId: string | null, levelId: string) => {
  if (!studentId) return;
  localStorage.setItem(eikenKey(studentId), levelId);
};
