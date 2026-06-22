// ダイアログ・トレーナーの会話データ。
// en の中の {…} は「差し替えスロット」。中身は例で、子は自分のことに変えてOK。
// 教科書（東京書籍）の各Unitのキー表現に紐づけている。

export interface DialogueLine {
  speaker: 'A' | 'B';
  en: string;
  ja: string;
}

export interface Dialogue {
  id: string;
  grade: 5 | 6;
  unitName: string;
  targetPhrase: string;
  lines: DialogueLine[];
}

export const DIALOGUES: Dialogue[] = [
  // ===== 5年生 =====
  {
    id: 'g5-u1', grade: 5, unitName: 'Unit 1: Hello, friends!', targetPhrase: 'What subject do you like?',
    lines: [
      { speaker: 'A', en: 'What subject do you like?', ja: '何の教科が好き？' },
      { speaker: 'B', en: 'I like {P.E.}.', ja: '【体育】が好き。' },
      { speaker: 'A', en: 'Nice! I like {music}, too.', ja: 'いいね！ぼくは【音楽】が好き。' },
    ],
  },
  {
    id: 'g5-u2', grade: 5, unitName: 'Unit 2: Happy birthday!', targetPhrase: 'When is your birthday?',
    lines: [
      { speaker: 'A', en: 'When is your birthday?', ja: '誕生日はいつ？' },
      { speaker: 'B', en: 'My birthday is {May 5th}.', ja: '【5月5日】だよ。' },
      { speaker: 'A', en: 'Happy birthday! What do you want?', ja: 'おめでとう！何がほしい？' },
      { speaker: 'B', en: 'I want {a new ball}.', ja: '【新しいボール】がほしい。' },
    ],
  },
  {
    id: 'g5-u3', grade: 5, unitName: 'Unit 3: What do you have on Monday?', targetPhrase: 'Can you play the piano?',
    lines: [
      { speaker: 'A', en: 'Can you play the piano?', ja: 'ピアノ弾ける？' },
      { speaker: 'B', en: '{Yes, I can.}', ja: '【うん、できるよ。】' },
      { speaker: 'A', en: 'Can you {swim}?', ja: '【泳ぐ】のはできる？' },
      { speaker: 'B', en: 'Yes, I can!', ja: 'うん、できる！' },
    ],
  },
  {
    id: 'g5-u4', grade: 5, unitName: 'Unit 4: He can bake bread well.', targetPhrase: 'She can play tennis very well.',
    lines: [
      { speaker: 'A', en: 'This is my friend, {Ken}.', ja: '友だちの【ケン】だよ。' },
      { speaker: 'B', en: 'What can {he} do?', ja: '【彼】は何ができるの？' },
      { speaker: 'A', en: '{He} can play tennis very well.', ja: '【彼】はテニスがすごく上手。' },
      { speaker: 'B', en: 'Wow, great!', ja: 'わー、すごい！' },
    ],
  },
  {
    id: 'g5-u5', grade: 5, unitName: 'Unit 5: Where is the post office?', targetPhrase: 'Where is the post office?',
    lines: [
      { speaker: 'A', en: 'Excuse me. Where is the {post office}?', ja: 'すみません、【郵便局】はどこ？' },
      { speaker: 'B', en: 'Go straight and turn {right}.', ja: 'まっすぐ行って【右】へ。' },
      { speaker: 'A', en: 'Thank you!', ja: 'ありがとう！' },
    ],
  },
  {
    id: 'g5-u6', grade: 5, unitName: 'Unit 6: What would you like?', targetPhrase: 'What would you like?',
    lines: [
      { speaker: 'A', en: 'What would you like?', ja: '何にする？' },
      { speaker: 'B', en: "I'd like {a hamburger}.", ja: '【ハンバーガー】をください。' },
      { speaker: 'A', en: 'Anything to drink?', ja: '飲み物は？' },
      { speaker: 'B', en: '{Orange juice}, please.', ja: '【オレンジジュース】を。' },
    ],
  },
  {
    id: 'g5-u7', grade: 5, unitName: 'Unit 7: Welcome to Japan.', targetPhrase: 'Why do you want to go there?',
    lines: [
      { speaker: 'A', en: 'Where do you want to go?', ja: 'どこに行きたい？' },
      { speaker: 'B', en: 'I want to go to {Okinawa}.', ja: '【沖縄】に行きたい。' },
      { speaker: 'A', en: 'Why do you want to go there?', ja: 'なんで？' },
      { speaker: 'B', en: 'I want to {see the sea}.', ja: '【海が見たい】から。' },
    ],
  },
  {
    id: 'g5-u8', grade: 5, unitName: 'Unit 8: Who is your hero?', targetPhrase: 'Who is your hero?',
    lines: [
      { speaker: 'A', en: 'Who is your hero?', ja: 'ヒーローは誰？' },
      { speaker: 'B', en: 'My hero is my {mother}.', ja: '【お母さん】だよ。' },
      { speaker: 'A', en: 'Why?', ja: 'どうして？' },
      { speaker: 'B', en: '{She} is {kind}.', ja: '【やさしい】から。' },
    ],
  },

  // ===== 6年生 =====
  {
    id: 'g6-u1', grade: 6, unitName: 'Unit 1: This is me!', targetPhrase: 'I can speak Swahili and English.',
    lines: [
      { speaker: 'A', en: "Hi, I'm {Sora}. Nice to meet you.", ja: '【そら】だよ、よろしく。' },
      { speaker: 'B', en: 'Nice to meet you, too. What can you do?', ja: 'よろしく。何ができる？' },
      { speaker: 'A', en: 'I can speak {Japanese} and {English}.', ja: '【日本語】と【英語】が話せる。' },
    ],
  },
  {
    id: 'g6-u2', grade: 6, unitName: 'Unit 2: How is your school life?', targetPhrase: 'What time do you get up?',
    lines: [
      { speaker: 'A', en: 'What time do you get up?', ja: '何時に起きる？' },
      { speaker: 'B', en: 'I get up at {6:30}.', ja: '【6時半】に起きる。' },
      { speaker: 'A', en: 'What time do you go to bed?', ja: '何時に寝る？' },
      { speaker: 'B', en: 'I go to bed at {9:30}.', ja: '【9時半】に寝る。' },
    ],
  },
  {
    id: 'g6-u3', grade: 6, unitName: 'Unit 3: My Summer Vacation', targetPhrase: 'How was your weekend?',
    lines: [
      { speaker: 'A', en: 'How was your weekend?', ja: '週末どうだった？' },
      { speaker: 'B', en: 'It was {fun}. I {played soccer}.', ja: '【楽しかった】。【サッカーした】。' },
      { speaker: 'A', en: 'Sounds nice!', ja: 'いいね！' },
    ],
  },
  {
    id: 'g6-u4', grade: 6, unitName: 'Unit 4: Let\'s see the world.', targetPhrase: 'You can see many unique animals.',
    lines: [
      { speaker: 'A', en: 'Where should we go?', ja: 'どこ行く？' },
      { speaker: 'B', en: "Let's go to {Australia}.", ja: '【オーストラリア】に行こう。' },
      { speaker: 'A', en: 'Why?', ja: 'なんで？' },
      { speaker: 'B', en: 'You can see many {unique animals}.', ja: '【めずらしい動物】がたくさん見られる。' },
    ],
  },
  {
    id: 'g6-u5', grade: 6, unitName: 'Unit 5: We live in a global village.', targetPhrase: 'This sweater is from New Zealand.',
    lines: [
      { speaker: 'A', en: 'Nice {sweater}! Where is it from?', ja: 'いい【セーター】！どこ産？' },
      { speaker: 'B', en: 'This {sweater} is from {New Zealand}.', ja: '【ニュージーランド】産だよ。' },
      { speaker: 'A', en: "Wow, that's far!", ja: '遠いね！' },
    ],
  },
  {
    id: 'g6-u6', grade: 6, unitName: 'Unit 6: Let\'s think about our food.', targetPhrase: 'What do sea turtles eat?',
    lines: [
      { speaker: 'A', en: '{Sea turtles} are in danger.', ja: '【ウミガメ】が危ない。' },
      { speaker: 'B', en: 'They live in {the sea}.', ja: '【海】に住んでいる。' },
      { speaker: 'A', en: 'We must reduce {plastic bags}.', ja: '【レジ袋】を減らさなきゃ。' },
    ],
  },
  {
    id: 'g6-u7', grade: 6, unitName: 'Unit 7: My Best Memory', targetPhrase: 'My best memory is the school trip.',
    lines: [
      { speaker: 'A', en: 'What is your best memory?', ja: '一番の思い出は？' },
      { speaker: 'B', en: 'My best memory is {the school trip}.', ja: '【修学旅行】。' },
      { speaker: 'A', en: 'What did you do?', ja: '何をした？' },
      { speaker: 'B', en: 'I {saw a big castle}.', ja: '【大きなお城を見た】。' },
    ],
  },
  {
    id: 'g6-u8', grade: 6, unitName: 'Unit 8: Future Dreams', targetPhrase: 'I want to be a programmer.',
    lines: [
      { speaker: 'A', en: 'What do you want to be?', ja: '将来何になりたい？' },
      { speaker: 'B', en: 'I want to be {a vet}.', ja: '【獣医】になりたい。' },
      { speaker: 'A', en: 'Why?', ja: 'どうして？' },
      { speaker: 'B', en: 'I like {animals}.', ja: '【動物】が好きだから。' },
    ],
  },
];
