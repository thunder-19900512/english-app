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
  note?: string; // 文法のワンポイント（任意）
  relatedCategories?: string[]; // 関連するPicture Dictionaryの単元（任意）
  aiRoute?: string; // 練習後に飛べるAI英会話へのリンク（任意。例 /ai?shop=simple）
  aiLabel?: string; // 上のリンクのボタン表示
}

export const DIALOGUES: Dialogue[] = [
  {
    // English Workshop（789年生主催）向けの自己紹介練習。児童＝B。
    // {…}は自分の名前・ニックネーム・好きなものに変える。→ 練習後にAI英会話や友だちと本番。
    id: 'intro-workshop', grade: 5, unitName: '👋 自己紹介（English Workshop）', targetPhrase: "I'm ___. Call me ___. I like ___.",
    lines: [
      { speaker: 'A', en: 'Hi! Nice to meet you! What\'s your name?', ja: 'こんにちは！はじめまして！お名前は？' },
      { speaker: 'B', en: "Hi! I'm {Yuji}.", ja: '【ゆうじ】です。' },
      { speaker: 'B', en: 'Call me {Yu-chan}.', ja: '【ゆうちゃん】と呼んでね。' },
      { speaker: 'A', en: 'Nice to meet you, {Yu-chan}! What do you like?', ja: 'よろしく、【ゆうちゃん】！何が好き？' },
      { speaker: 'B', en: 'I like {soccer}.', ja: '【サッカー】が好きです。' },
      { speaker: 'A', en: 'Me too! Let\'s have fun!', ja: 'ぼくも！楽しもう！' },
    ],
    note: 'あなたはB！ {…}を自分のことに変えよう。プラス1情報は好きな色・食べ物・スポーツなど何でもOK。れい："I like blue." / "I like pizza." / "I like baseball." れんしゅうしたら、AIや友だちと本番だ！',
    aiRoute: '/ai?unit=intro-workshop', aiLabel: 'AIと自己紹介の練習をする',
  },
  // ===== 5年生 =====
  {
    id: 'g5-u1', grade: 5, unitName: 'Unit 1: Hello, friends!', targetPhrase: 'What subject do you like?',
    lines: [
      { speaker: 'A', en: 'What subject do you like?', ja: '何の教科が好き？' },
      { speaker: 'B', en: 'I like {P.E.}.', ja: '【体育】が好き。' },
      { speaker: 'A', en: 'Oh, nice! I like {science}.', ja: 'いいね！ぼくは【理科】が好き。' },
    ],
    note: '相手と同じ教科が好きなときは "I like science, too."（〜も）と "too" をつけよう！ちがう教科のときは "too" はつけないよ。',
    relatedCategories: ['教科'],
  },
  {
    id: 'g5-u2', grade: 5, unitName: 'Unit 2: Happy birthday!', targetPhrase: 'When is your birthday?',
    lines: [
      { speaker: 'A', en: 'When is your birthday?', ja: '誕生日はいつ？' },
      { speaker: 'B', en: 'My birthday is {May 5th}.', ja: '【5月5日】だよ。' },
      { speaker: 'A', en: 'Happy birthday! What do you want?', ja: 'おめでとう！何がほしい？' },
      { speaker: 'B', en: 'I want {a new ball}.', ja: '【新しいボール】がほしい。' },
    ],
    relatedCategories: ['月'],
  },
  {
    id: 'g5-u3', grade: 5, unitName: 'Unit 3: What do you have on Monday?', targetPhrase: 'Can you play the piano?',
    lines: [
      { speaker: 'A', en: 'Can you play the piano?', ja: 'ピアノ弾ける？' },
      { speaker: 'B', en: '{Yes, I can.}', ja: '【うん、できるよ。】' },
      { speaker: 'A', en: 'Can you {swim}?', ja: '【泳ぐ】のはできる？' },
      { speaker: 'B', en: 'Yes, I can!', ja: 'うん、できる！' },
    ],
    relatedCategories: ['動作など（5年）'],
  },
  {
    id: 'g5-u4', grade: 5, unitName: 'Unit 4: He can bake bread well.', targetPhrase: 'She can play tennis very well.',
    lines: [
      { speaker: 'A', en: 'This is my friend, {Ken}.', ja: '友だちの【ケン】だよ。' },
      { speaker: 'B', en: 'What can {he} do?', ja: '【彼】は何ができるの？' },
      { speaker: 'A', en: '{He} can play tennis very well.', ja: '【彼】はテニスがすごく上手。' },
      { speaker: 'B', en: 'Wow, great!', ja: 'わー、すごい！' },
    ],
    relatedCategories: ['動作など（5年）'],
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
    relatedCategories: ['食べ物', '飲み物'],
  },
  {
    // World Bento「お店屋さん」練習用。児童＝店員(B)の所作を練習 → AI英会話(お客さん)や
    // クラスメイトダイアログへ。{…}は自分のお店のメニュー・値段に変えてOK。
    id: 'wb-shop', grade: 5, unitName: 'World Bento お店屋さん（店員）', targetPhrase: 'How much is it all together?',
    lines: [
      { speaker: 'A', en: 'Hello! What do you have?', ja: 'こんにちは！なにが ありますか？' },
      { speaker: 'B', en: 'We have {curry}, {rice}, and {juice}.', ja: '【カレー・ごはん・ジュース】が あります。' },
      { speaker: 'A', en: "I'd like a {curry}, please.", ja: '【カレー】を ください。' },
      { speaker: 'B', en: 'Sure! Here you are.', ja: 'いいですよ！ どうぞ。' },
      { speaker: 'A', en: 'How much is it?', ja: 'いくら ですか？' },
      { speaker: 'B', en: "It's {300} yen.", ja: '【300】円 です。' },
      { speaker: 'A', en: 'How much is it all together?', ja: 'ぜんぶで いくら ですか？' },
      { speaker: 'B', en: "It's {500} yen in total.", ja: 'ごうけい【500】円 です。' },
      { speaker: 'A', en: 'Great! Here you are. Goodbye!', ja: 'ありがとう！ さようなら！' },
      { speaker: 'B', en: 'Thank you! Bye!', ja: 'ありがとう！ またね！' },
    ],
    note: 'あなたは店員さん(B)！ {…}は自分のお店のメニュー・値段に変えよう。チャレンジ：お客さんが "What\'s in it?"（なにが入ってる？）や "Is it spicy?"（からい？）と聞いてきたら、"It\'s {rice} and {meat}." や "It\'s yummy!" と答えてみよう。れんしゅうしたら、AIのお客さんや友だちと本番だ！',
    relatedCategories: ['食べ物＋（世界の料理）'],
    aiRoute: '/ai?shop=simple', aiLabel: 'AIのお客さんと練習する（お店屋さん）',
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
    relatedCategories: ['人', '性格'],
  },

  // ===== 6年生 =====
  {
    id: 'g6-u1', grade: 6, unitName: 'Unit 1: This is me!', targetPhrase: 'I can speak Swahili and English.',
    lines: [
      { speaker: 'A', en: "Hi, I'm {Sora}. Nice to meet you.", ja: '【そら】だよ、よろしく。' },
      { speaker: 'B', en: 'Nice to meet you, too. What can you do?', ja: 'よろしく。何ができる？' },
      { speaker: 'A', en: 'I can speak {Japanese} and {English}.', ja: '【日本語】と【英語】が話せる。' },
    ],
    relatedCategories: ['動作など（6年）'],
  },
  {
    id: 'g6-u2', grade: 6, unitName: 'Unit 2: How is your school life?', targetPhrase: 'What time do you get up?',
    lines: [
      { speaker: 'A', en: 'What time do you get up?', ja: '何時に起きる？' },
      { speaker: 'B', en: 'I get up at {6:30}.', ja: '【6時半】に起きる。' },
      { speaker: 'A', en: 'What time do you go to bed?', ja: '何時に寝る？' },
      { speaker: 'B', en: 'I go to bed at {9:30}.', ja: '【9時半】に寝る。' },
    ],
    relatedCategories: ['一日の生活'],
  },
  {
    id: 'g6-u3', grade: 6, unitName: 'Unit 3: My Summer Vacation', targetPhrase: 'How was your weekend?',
    lines: [
      { speaker: 'A', en: 'How was your weekend?', ja: '週末どうだった？' },
      { speaker: 'B', en: 'It was {fun}. I {played soccer}.', ja: '【楽しかった】。【サッカーした】。' },
      { speaker: 'A', en: 'Sounds nice!', ja: 'いいね！' },
    ],
    relatedCategories: ['したこと', '気分'],
  },
  {
    id: 'g6-u4', grade: 6, unitName: 'Unit 4: Let\'s see the world.', targetPhrase: 'You can see many unique animals.',
    lines: [
      { speaker: 'A', en: 'Where should we go?', ja: 'どこ行く？' },
      { speaker: 'B', en: "Let's go to {Australia}.", ja: '【オーストラリア】に行こう。' },
      { speaker: 'A', en: 'Why?', ja: 'なんで？' },
      { speaker: 'B', en: 'You can see many {unique animals}.', ja: '【めずらしい動物】がたくさん見られる。' },
    ],
    relatedCategories: ['動物'],
  },
  {
    id: 'g6-u5', grade: 6, unitName: 'Unit 5: We live in a global village.', targetPhrase: 'This sweater is from New Zealand.',
    lines: [
      { speaker: 'A', en: 'Nice {sweater}! Where is it from?', ja: 'いい【セーター】！どこ産？' },
      { speaker: 'B', en: 'This {sweater} is from {New Zealand}.', ja: '【ニュージーランド】産だよ。' },
      { speaker: 'A', en: "Wow, that's far!", ja: '遠いね！' },
    ],
    relatedCategories: ['衣類'],
  },
  {
    id: 'g6-u6', grade: 6, unitName: 'Unit 6: Let\'s think about our food.', targetPhrase: 'What do sea turtles eat?',
    lines: [
      { speaker: 'A', en: '{Sea turtles} are in danger.', ja: '【ウミガメ】が危ない。' },
      { speaker: 'B', en: 'They live in {the sea}.', ja: '【海】に住んでいる。' },
      { speaker: 'A', en: 'We must reduce {plastic bags}.', ja: '【レジ袋】を減らさなきゃ。' },
    ],
    relatedCategories: ['海の生き物'],
  },
  {
    id: 'g6-u7', grade: 6, unitName: 'Unit 7: My Best Memory', targetPhrase: 'My best memory is the school trip.',
    lines: [
      { speaker: 'A', en: 'What is your best memory?', ja: '一番の思い出は？' },
      { speaker: 'B', en: 'My best memory is {the school trip}.', ja: '【修学旅行】。' },
      { speaker: 'A', en: 'What did you do?', ja: '何をした？' },
      { speaker: 'B', en: 'I {saw a big castle}.', ja: '【大きなお城を見た】。' },
    ],
    relatedCategories: ['したこと'],
  },
  {
    id: 'g6-u8', grade: 6, unitName: 'Unit 8: Future Dreams', targetPhrase: 'I want to be a programmer.',
    lines: [
      { speaker: 'A', en: 'What do you want to be?', ja: '将来何になりたい？' },
      { speaker: 'B', en: 'I want to be {a vet}.', ja: '【獣医】になりたい。' },
      { speaker: 'A', en: 'Why?', ja: 'どうして？' },
      { speaker: 'B', en: 'I like {animals}.', ja: '【動物】が好きだから。' },
    ],
    relatedCategories: ['職業'],
  },
];
