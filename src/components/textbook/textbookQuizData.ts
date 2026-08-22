import type { TextbookQuiz } from './TextbookMode';

export const DEFAULT_QUIZZES: TextbookQuiz[] = [
  // ===== Grade 5 =====
  {
    id: 'g5-u1',
    grade: 5,
    unitName: 'Unit 1: Hello, friends!',
    url: 'https://sw21.tsho.jp/06pk/e/5/1so-01/',
    keyPhrase: 'What subject do you like?',
    keyPhraseJapanese: '何の教科が好きですか？',
    questions: [
      {
        question: '新しく来たクラスメイト、ソフィアはどこの国から来た？',
        videoRef: '動画2',
        type: 'choice',
        options: ['America', 'Australia', 'Japan'],
        correctIndex: 1
      },
      {
        question: 'ソフィアが好きな教科（subject）は何？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Music', 'Math', 'P.E.'],
        correctIndex: 2
      },
      {
        question: 'ソフィアが「美味しいしヘルシーだよ」と紹介したオーストラリアの食べ物は？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'Crocodile steak'
      }
    ]
  },
  {
    id: 'g5-u2',
    grade: 5,
    unitName: 'Unit 2: Happy birthday!',
    url: 'https://sw21.tsho.jp/06pk/e/5/2so-01/',
    keyPhrase: 'When is your birthday?',
    keyPhraseJapanese: 'あなたの誕生日はいつですか？',
    questions: [
      {
        question: 'ルーカス（Lucas）が誕生日にほしいと言っていたものは？',
        videoRef: '動画2',
        type: 'choice',
        options: ['A new tablet', 'A cool pencil case', 'A rugby ball'],
        correctIndex: 0
      },
      {
        question: 'みんながソフィアの誕生日にプレゼントしたものは何？',
        videoRef: '動画2',
        type: 'typing',
        correctAnswer: 'rugby sticker'
      },
      {
        question: 'ソフィアのお母さんが作ってくれた美味しいステーキは、何のお肉？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Crocodile', 'Chicken', 'Beef'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'g5-u3',
    grade: 5,
    unitName: 'Unit 3: What do you have on Monday?',
    url: 'https://sw21.tsho.jp/06pk/e/5/3so-01/',
    keyPhrase: 'Can you play the piano?',
    keyPhraseJapanese: 'あなたはピアノを弾くことができますか？',
    questions: [
      {
        question: '子どもたちが楽しんでいる遊び（スポーツ）は何だった？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Tennis', 'Dodgeball', 'Soccer'],
        correctIndex: 1
      },
      {
        question: 'リコーダー（recorder）を上手に吹けるか聞かれて、「できない」と答えた人はピアノ（piano）を弾くことはできる？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Yes, I can.', 'No, I can’t.'],
        correctIndex: 0
      },
      {
        question: '廊下を走っていたルーカスとダイチに先生は何と言って注意した？',
        videoRef: '動画4',
        type: 'typing',
        correctAnswer: 'Don\'t run'
      }
    ]
  },
  {
    id: 'g5-u4',
    grade: 5,
    unitName: 'Unit 4: He can bake bread well.',
    url: 'https://sw21.tsho.jp/06pk/e/5/4so-01/',
    keyPhrase: 'She can play tennis very well.',
    keyPhraseJapanese: '彼女はとても上手にテニスができます。',
    questions: [
      {
        question: 'アルバムに写っていたジェシカ（Jessica）が得意なスポーツは何？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Tennis', 'Soccer', 'Basketball'],
        correctIndex: 0
      },
      {
        question: 'オーストラリアの動物園で抱っこ（hold）できる動物は何？',
        videoRef: '動画2',
        type: 'typing',
        correctAnswer: 'koala'
      },
      {
        question: '「シュークリーム」は英語で何と言う？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Shoe cream', 'Cream puffs', 'Sweet bread'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'g5-u5',
    grade: 5,
    unitName: 'Unit 5: Where is the post office?',
    url: 'https://sw21.tsho.jp/06pk/e/5/5so-01/',
    keyPhrase: 'Where is the post office?',
    keyPhraseJapanese: '郵便局はどこですか？',
    questions: [
      {
        question: '郵便局へ行くには、何ブロック（blocks）まっすぐ進めばいい？',
        videoRef: '動画2',
        type: 'choice',
        options: ['One block', 'Two blocks', 'Three blocks'],
        correctIndex: 1
      },
      {
        question: '動物園の看板の近くにいた動物は何？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Dogs', 'Cats', 'Birds'],
        correctIndex: 1
      },
      {
        question: 'ソフィアが電話で話していた相手は誰？',
        videoRef: '動画4',
        type: 'typing',
        correctAnswer: 'Dad'
      }
    ]
  },
  {
    id: 'g5-u6',
    grade: 5,
    unitName: 'Unit 6: What would you like?',
    url: 'https://sw21.tsho.jp/06pk/e/5/6so-01/',
    keyPhrase: 'What would you like?',
    keyPhraseJapanese: '何になさいますか？（何を注文しますか？）',
    questions: [
      {
        question: 'ソフィアがレストランで注文したものは何？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Beef bowl', 'Fried noodles', 'Curry and rice'],
        correctIndex: 0
      },
      {
        question: 'おばあちゃん（Grandma）が飲み物に注文したのは何？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Green tea', 'Orange juice', 'Water'],
        correctIndex: 1
      },
      {
        question: 'オリバー（Oliver）が食べた焼きそば（fried noodles）の味はどうだった？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Very sweet', 'A little spicy', 'Too salty'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'g5-u7',
    grade: 5,
    unitName: 'Unit 7: Welcome to Japan.',
    url: 'https://sw21.tsho.jp/06pk/e/5/7so-01/',
    keyPhrase: 'Why do you want to go there?',
    keyPhraseJapanese: 'なぜそこに行きたいのですか？',
    questions: [
      {
        question: '弘前（Hirosaki）で春に見られるお祭りは何？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Snow Festival', 'Cherry Blossom Festival', 'Summer Festival'],
        correctIndex: 1
      },
      {
        question: 'ルーカスが行きたいと言っていた北海道の「豊似湖（Lake Toyoni）」はどんな形をしている？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'heart'
      },
      {
        question: 'ソフィアが白川郷（Shirakawa Village）で食べたいと言っていたものは何？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Hida Beef', 'Sushi', 'Ramen'],
        correctIndex: 0
      }
    ]
  },
  {
    id: 'g5-u8',
    grade: 5,
    unitName: 'Unit 8: Who is your hero?',
    url: 'https://sw21.tsho.jp/06pk/e/5/8so-01/',
    keyPhrase: 'Who is your hero?',
    keyPhraseJapanese: 'あなたのヒーローは誰ですか？',
    questions: [
      {
        question: '熱を出した子どもに、お母さんが渡したもの（medicine）は何？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Water', 'Medicine', 'Food'],
        correctIndex: 1
      },
      {
        question: 'ベーカー先生（Ms. Baker）のヒーローは角野栄子さんですが、彼女の職業は何？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'writer'
      },
      {
        question: 'ソフィアのヒーローは誰？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Father', 'Mother', 'Brother'],
        correctIndex: 1
      }
    ]
  },
  
  // ===== Grade 6 =====
  {
    id: 'g6-u1',
    grade: 6,
    unitName: 'Unit 1: This is me!',
    url: 'https://sw21.tsho.jp/06pk/e/6/1so-01/',
    keyPhrase: 'I can speak Swahili and English.',
    keyPhraseJapanese: '私はスワヒリ語と英語を話せます。',
    questions: [
      {
        question: '新しく来たクラスメイトのナディア（Nadia）はどこの国の出身？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Kenya', 'Australia', 'America'],
        correctIndex: 0
      },
      {
        question: 'ナディアの宝物（treasure）は何？',
        videoRef: '動画3',
        type: 'choice',
        options: ['A dog', 'A sweatshirt', 'A cricket ball'],
        correctIndex: 1
      },
      {
        question: 'ナディアの家は何の建物の近く（by the ~）にある？',
        videoRef: '動画4',
        type: 'typing',
        correctAnswer: 'library'
      }
    ]
  },
  {
    id: 'g6-u2',
    grade: 6,
    unitName: 'Unit 2: How is your school life?',
    url: 'https://sw21.tsho.jp/06pk/e/6/2so-01/',
    keyPhrase: 'What time do you get up?',
    keyPhraseJapanese: 'あなたは何時に起きますか？',
    questions: [
      {
        question: 'ヘルミ（Helmi）がいつも起きる時間は何時？',
        videoRef: '動画2',
        type: 'choice',
        options: ['5:30 a.m.', '6:00 a.m.', '7:00 a.m.'],
        correctIndex: 1
      },
      {
        question: 'ニュージーランドのサミュエル（Samuel）の学校で、10:30にあるおやつの時間は何と呼ばれている？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'morning tea'
      },
      {
        question: 'ケニアのダニエル（Daniel）は、何を通って学校まで歩いて行く？',
        videoRef: '動画4',
        type: 'choice',
        options: ['The forest', 'The savanna', 'The mountains'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'g6-u3',
    grade: 6,
    unitName: 'Unit 3: My Summer Vacation',
    url: 'https://sw21.tsho.jp/06pk/e/6/3so-01/',
    keyPhrase: 'How was your weekend?',
    keyPhraseJapanese: '週末はどうでしたか？',
    questions: [
      {
        question: 'サキ（Saki）がインターナショナルパーティーで食べたのはどこの国の料理？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Swiss food', 'Mexican food', 'Italian food'],
        correctIndex: 0
      },
      {
        question: 'ソフィアがスタジアムで楽しんだ試合は何のスポーツ？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'rugby'
      },
      {
        question: 'ニュージーランドの代表チーム「オールブラックス（All Blacks）」が試合前に踊るユニークなダンスの名前は？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Samba', 'Haka', 'Flamenco'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'g6-u4',
    grade: 6,
    unitName: 'Unit 4: Let\'s see the world.',
    url: 'https://sw21.tsho.jp/06pk/e/6/4so-01/',
    keyPhrase: 'You can see many unique animals.',
    keyPhraseJapanese: '多くのユニークな動物を見ることができます。',
    questions: [
      {
        question: 'オーストラリアにある世界遺産の大きくて茶色い岩（Ayers Rock）の名前は？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Uluru', 'Grand Canyon', 'Mt. Everest'],
        correctIndex: 0
      },
      {
        question: 'ナディア（Nadia）が行きたい国、ベトナムの伝統的なドレスの名前は何？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'ao dai'
      },
      {
        question: '熱帯雨林（rainforest）でたくさんの植物や動物が見られると紹介された国はどこ？',
        videoRef: '動画4',
        type: 'choice',
        options: ['America', 'Australia', 'Brazil'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'g6-u5',
    grade: 6,
    unitName: 'Unit 5: We live in a global village.',
    url: 'https://sw21.tsho.jp/06pk/e/6/5so-01/',
    keyPhrase: 'This sweater is from New Zealand.',
    keyPhraseJapanese: 'このセーターはニュージーランドから来ました（産です）。',
    questions: [
      {
        question: 'ソフィアのお父さんへのプレゼントにぴったりだと言っていた帽子とセーターは、どこの国のウール（wool）でできている？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Australia', 'New Zealand', 'Japan'],
        correctIndex: 1
      },
      {
        question: 'タコ（octopus）はどこの国から来ていると紹介された？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Morocco', 'Norway', 'Hokkaido'],
        correctIndex: 0
      },
      {
        question: '週末のピクニックで食べたいと提案されたサンドイッチの名前は？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'BLT'
      }
    ]
  },
  {
    id: 'g6-u6',
    grade: 6,
    unitName: 'Unit 6: Let\'s think about our food.',
    url: 'https://sw21.tsho.jp/06pk/e/6/6so-01/',
    keyPhrase: 'What do sea turtles eat?',
    keyPhraseJapanese: 'ウミガメは何を食べますか？',
    questions: [
      {
        question: 'ウミガメ（Sea turtles）が間違えて食べてしまうことがある海のゴミは何？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Plastic bags', 'Glass bottles', 'Paper cups'],
        correctIndex: 0
      },
      {
        question: 'マイバッグを使うことで、何を減らすことができる？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Water', 'Plastic', 'Food loss'],
        correctIndex: 1
      },
      {
        question: '使わなくなった服を必要としている人にあげるなど、物を再利用することを何と言う？（英語で）',
        videoRef: '動画4',
        type: 'typing',
        correctAnswer: 'reuse'
      }
    ]
  },
  {
    id: 'g6-u7',
    grade: 6,
    unitName: 'Unit 7: My Best Memory',
    url: 'https://sw21.tsho.jp/06pk/e/6/7so-01/',
    keyPhrase: 'My best memory is the school trip.',
    keyPhraseJapanese: '私の最高の思い出は修学旅行です。',
    questions: [
      {
        question: '小学校での最高の思い出（best memory）について話している時、修学旅行は英語で何と言う？',
        videoRef: '動画1',
        type: 'choice',
        options: ['The sports day', 'The school trip', 'The chorus contest'],
        correctIndex: 1
      },
      {
        question: '日光（Nikko）に行った時の思い出として、猿（monkeys）はどこにいたと言っていた？',
        videoRef: '動画2',
        type: 'choice',
        options: ['In the zoo', 'On the roof', 'In the river'],
        correctIndex: 1
      },
      {
        question: '中学校に入ったら入りたい部活（club）として、美術部は何と言う？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'art club'
      }
    ]
  },
  {
    id: 'g6-u8',
    grade: 6,
    unitName: 'Unit 8: Future Dreams',
    url: 'https://sw21.tsho.jp/06pk/e/6/8so-01/',
    keyPhrase: 'I want to be a programmer.',
    keyPhraseJapanese: '私はプログラマーになりたいです。',
    questions: [
      {
        question: 'ダイチ（Daichi）の将来の夢（なりたい職業）は何？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Teacher', 'Programmer', 'Doctor'],
        correctIndex: 1
      },
      {
        question: 'ナディア（Nadia）が将来なりたいものは何？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Vet (獣医)', 'Nurse (看護師)', 'Singer (歌手)'],
        correctIndex: 0
      },
      {
        question: 'ルーカス（Lucas）が将来住みたい国はどこ？',
        videoRef: '動画3',
        type: 'typing',
        correctAnswer: 'Japan'
      }
    ]
  }
];
