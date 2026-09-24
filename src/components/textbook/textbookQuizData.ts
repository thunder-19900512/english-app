import type { TextbookQuiz } from './TextbookMode';

// 教科書（東京書籍 NEW HORIZON Elementary 令和6年度版）の Listen and Think アニメに
// ひもづくクイズ。★各Unitは「動画1→動画2→…」の順に1本1問（台本 Textbook_Scripts.md と対応）。
// 問題文の答えは必ず動画の中に出てくるものだけにする（台本に無いことは聞かない）。
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
        question: 'サキとルーカスが自己紹介。ルーカスが「ぼくの友だち」と紹介した子はだれ？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Daichi', 'Saki', 'Sophia'],
        correctIndex: 0
      },
      {
        question: '新しいクラスメイトのソフィアは、どこの国から来た？',
        videoRef: '動画2',
        type: 'choice',
        options: ['America', 'Australia', 'Canada'],
        correctIndex: 1
      },
      {
        question: 'ソフィアが「おいしくてヘルシー」と言った食べ物は？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Curry and rice', 'Beef bowl', 'Crocodile steak'],
        correctIndex: 2
      },
      {
        question: 'ダイチの名前を英語で書くとき、正しいつづりは？',
        videoRef: '動画4',
        type: 'choice',
        options: ['D-A-I-C-H-I', 'D-A-I-T-I', 'D-A-I-C-H-Y'],
        correctIndex: 0
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
        question: 'ソフィアの誕生日パーティーはいつ？',
        videoRef: '動画1',
        type: 'choice',
        options: ['June 19th', 'May 5th', 'May 15th'],
        correctIndex: 1
      },
      {
        question: 'ルーカスが誕生日にほしいと言ったものは？',
        videoRef: '動画2',
        type: 'choice',
        options: ['A cool pencil case', 'A rugby ball', 'A new tablet'],
        correctIndex: 2
      },
      {
        question: 'ソフィアのお母さんが作ったステーキは、何の肉？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Beef', 'Crocodile', 'Chicken'],
        correctIndex: 0
      },
      {
        question: 'ケーキのろうそく（candles）は何本あった？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Ten', 'Eleven', 'Twelve'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'g5-u3',
    grade: 5,
    unitName: 'Unit 3: Can you play dodgeball?',
    url: 'https://sw21.tsho.jp/06pk/e/5/3so-01/',
    keyPhrase: 'Can you play the piano?',
    keyPhraseJapanese: 'あなたはピアノを弾くことができますか？',
    questions: [
      {
        question: '子どもたちが楽しんでいたスポーツは？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Soccer', 'Tennis', 'Dodgeball'],
        correctIndex: 2
      },
      {
        question: '"Can you catch this?" と聞かれて、なんと答えた？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Yes, I can.', 'No, I can\'t.', 'I don\'t know.'],
        correctIndex: 0
      },
      {
        question: 'リコーダーはふけないけど、ひける楽器は？',
        videoRef: '動画3',
        type: 'choice',
        options: ['The guitar', 'The piano', 'The drums'],
        correctIndex: 1
      },
      {
        question: '廊下を走ったルーカスとダイチに、先生はなんと言った？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Be quiet!', 'Sit down!', 'Don\'t run!'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'g5-u4',
    grade: 5,
    unitName: 'Unit 4: Who is this?',
    url: 'https://sw21.tsho.jp/06pk/e/5/4so-01/',
    keyPhrase: 'She can play tennis very well.',
    keyPhraseJapanese: '彼女はとても上手にテニスができます。',
    questions: [
      {
        question: 'アルバムに写っていたジェシカが得意なスポーツは？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Tennis', 'Soccer', 'Rugby'],
        correctIndex: 0
      },
      {
        question: 'オーストラリアの動物園で抱っこ（hold）できる動物は？',
        videoRef: '動画2',
        type: 'choice',
        options: ['A kangaroo', 'A koala', 'A crocodile'],
        correctIndex: 1
      },
      {
        question: '「Go, Carlos!」のカルロスの職業は？',
        videoRef: '動画3',
        type: 'choice',
        options: ['A teacher', 'A doctor', 'A soccer player'],
        correctIndex: 2
      },
      {
        question: '「シュークリーム」は英語でなんと言う？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Cream puffs', 'Shoe cream', 'Sweet bread'],
        correctIndex: 0
      }
    ]
  },
  {
    id: 'g5-u5',
    grade: 5,
    unitName: 'Unit 5: Let\'s go to the zoo.',
    url: 'https://sw21.tsho.jp/06pk/e/5/5so-01/',
    keyPhrase: 'Where is the post office?',
    keyPhraseJapanese: '郵便局はどこですか？',
    questions: [
      {
        question: 'ソフィアが電話で話していた相手はだれ？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Dad', 'Jessica', 'Mom'],
        correctIndex: 1
      },
      {
        question: '郵便局まで、何ブロック（blocks）まっすぐ進む？',
        videoRef: '動画2',
        type: 'choice',
        options: ['One block', 'Three blocks', 'Two blocks'],
        correctIndex: 2
      },
      {
        question: '動物園の看板のそば（by the sign）にいたのは？',
        videoRef: '動画3',
        type: 'choice',
        options: ['A white cat', 'A black cat', 'A dog'],
        correctIndex: 0
      }
    ]
  },
  {
    id: 'g5-u6',
    grade: 5,
    unitName: 'Unit 6: At a restaurant.',
    url: 'https://sw21.tsho.jp/06pk/e/5/6so-01/',
    keyPhrase: 'What would you like?',
    keyPhraseJapanese: '何になさいますか？（何を注文しますか？）',
    questions: [
      {
        question: 'レストランでソフィアがほしいと言ったものは？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Fried noodles', 'Curry and rice', 'A beef bowl'],
        correctIndex: 2
      },
      {
        question: 'おばあちゃん（Grandma）が注文した飲み物は？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Orange juice', 'Green tea', 'Water'],
        correctIndex: 0
      },
      {
        question: 'オリバーの焼きそば（fried noodles）の味は？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Too sweet', 'A little spicy', 'Very salty'],
        correctIndex: 1
      },
      {
        question: '1セット（one set）の値段はいくら？',
        videoRef: '動画4',
        type: 'choice',
        options: ['890 yen', '1,080 yen', '980 yen'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'g5-u7',
    grade: 5,
    unitName: 'Unit 7: Welcome to Japan!',
    url: 'https://sw21.tsho.jp/06pk/e/5/7so-01/',
    keyPhrase: 'Why do you want to go there?',
    keyPhraseJapanese: 'なぜそこに行きたいのですか？',
    questions: [
      {
        question: '弘前（Hirosaki）で春に見られるお祭りは？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Cherry Blossom Festival', 'Snow Festival', 'Fire Festival'],
        correctIndex: 0
      },
      {
        question: 'サキが行きたいと言った場所は？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Hokkaido', 'Oze National Park', 'Kyoto'],
        correctIndex: 1
      },
      {
        question: 'ルーカスが行きたい北海道の豊似湖（Lake Toyoni）は、どんな形？',
        videoRef: '動画3',
        type: 'choice',
        options: ['A star', 'A circle', 'A heart'],
        correctIndex: 2
      },
      {
        question: 'ソフィアが白川郷（Shirakawa Village）で食べたいものは？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Hida Beef', 'Crocodile steak', 'Sushi'],
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
        question: '熱を出した子に、お母さんがわたしたものは？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Water', 'Medicine', 'Ice cream'],
        correctIndex: 1
      },
      {
        question: '「お父さんはヒーロー！」と言った理由は？',
        videoRef: '動画2',
        type: 'choice',
        options: ['料理が上手だから', '走るのが速いから', 'サッカーで決勝ゴール（winning goal）を決めたから'],
        correctIndex: 2
      },
      {
        question: 'ベーカー先生のヒーロー、角野栄子（Kadono Eiko）さんの職業は？',
        videoRef: '動画3',
        type: 'choice',
        options: ['A writer', 'A singer', 'A doctor'],
        correctIndex: 0
      },
      {
        question: 'ソフィアのヒーローはだれ？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Her father', 'Her mother', 'Her teacher'],
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
        question: 'ケニアの友だちからナディアがもらったものは？',
        videoRef: '動画1',
        type: 'choice',
        options: ['A hat', 'A bag', 'A sweatshirt'],
        correctIndex: 2
      },
      {
        question: 'ナディアが話せる言語は？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Swahili and English', 'French and English', 'Japanese and English'],
        correctIndex: 0
      },
      {
        question: 'ナディアの誕生日はいつ？',
        videoRef: '動画3',
        type: 'choice',
        options: ['October 30th', 'October 13th', 'September 13th'],
        correctIndex: 1
      },
      {
        question: 'ナディアの家はどこの近く？',
        videoRef: '動画4',
        type: 'choice',
        options: ['By the station', 'By the park', 'By the library'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'g6-u2',
    grade: 6,
    unitName: 'Unit 2: My Daily Schedule',
    url: 'https://sw21.tsho.jp/06pk/e/6/2so-01/',
    keyPhrase: 'What time do you get up?',
    keyPhraseJapanese: 'あなたは何時に起きますか？',
    questions: [
      {
        question: '日本が午後3時のとき、ブラジルは何時？',
        videoRef: '動画1',
        type: 'choice',
        options: ['3:00 in the morning', '3:00 in the afternoon', '9:00 in the morning'],
        correctIndex: 0
      },
      {
        question: 'フィンランドのヘルミ（Helmi）が起きる時間は？',
        videoRef: '動画2',
        type: 'choice',
        options: ['5 a.m.', '6 a.m.', '7 a.m.'],
        correctIndex: 1
      },
      {
        question: 'ニュージーランドのサミュエルの学校で、10:30にあるのは？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Lunch', 'Music class', 'Morning tea'],
        correctIndex: 2
      },
      {
        question: 'ケニアのダニエルは、何を通って学校へ歩いて行く？',
        videoRef: '動画4',
        type: 'choice',
        options: ['The savanna', 'The forest', 'The beach'],
        correctIndex: 0
      }
    ]
  },
  {
    id: 'g6-u3',
    grade: 6,
    unitName: 'Unit 3: My Weekend',
    url: 'https://sw21.tsho.jp/06pk/e/6/3so-01/',
    keyPhrase: 'How was your weekend?',
    keyPhraseJapanese: '週末はどうでしたか？',
    questions: [
      {
        question: 'エマ（Emma）はどこの国から来た？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Sweden', 'Switzerland', 'Spain'],
        correctIndex: 1
      },
      {
        question: 'サキが週末に食べたのは、どこの国の料理？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Italian food', 'Indian food', 'Swiss food'],
        correctIndex: 2
      },
      {
        question: 'ソフィアがスタジアムで見た試合は？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Rugby', 'Soccer', 'Baseball'],
        correctIndex: 0
      },
      {
        question: 'オールブラックス（All Blacks）が試合前におどるダンスは？',
        videoRef: '動画4',
        type: 'choice',
        options: ['The Samba', 'The Haka', 'The Tango'],
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
        question: 'オーストラリアにある大きな茶色い岩（世界遺産）の名前は？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Fuji', 'Everest', 'Uluru'],
        correctIndex: 2
      },
      {
        question: 'ダイチが行きたい国は？',
        videoRef: '動画2',
        type: 'choice',
        options: ['America', 'Vietnam', 'Brazil'],
        correctIndex: 0
      },
      {
        question: 'ナディアがベトナムで買いたいものは？',
        videoRef: '動画3',
        type: 'choice',
        options: ['A kimono', 'An ao dai', 'A hat'],
        correctIndex: 1
      },
      {
        question: '熱帯雨林（rainforest）でめずらしい動植物が見られると紹介された国は？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Australia', 'Kenya', 'Brazil'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'g6-u5',
    grade: 6,
    unitName: 'Unit 5: Where is it from?',
    url: 'https://sw21.tsho.jp/06pk/e/6/5so-01/',
    keyPhrase: 'This sweater is from New Zealand.',
    keyPhraseJapanese: 'このセーターはニュージーランドから来ました（産です）。',
    questions: [
      {
        question: 'ソフィアのセーターは、どこの国のウール（wool）？',
        videoRef: '動画1',
        type: 'choice',
        options: ['New Zealand', 'Australia', 'England'],
        correctIndex: 0
      },
      {
        question: 'ニュージーランドは、地図のどの地域にある？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Asia', 'Oceania', 'Europe'],
        correctIndex: 1
      },
      {
        question: 'タコ（octopus）はどこの国から来た？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Norway', 'Hokkaido', 'Morocco'],
        correctIndex: 2
      },
      {
        question: 'ソフィアがお父さん（Dad）に電話で伝えたことは？',
        videoRef: '動画4',
        type: 'choice',
        options: ['次の休みにオーストラリアへ帰る', '日本で友だちができた', '動物園に行く'],
        correctIndex: 0
      }
    ]
  },
  {
    id: 'g6-u6',
    grade: 6,
    unitName: 'Unit 6: Save the animals.',
    url: 'https://sw21.tsho.jp/06pk/e/6/6so-01/',
    keyPhrase: 'What do sea turtles eat?',
    keyPhraseJapanese: 'ウミガメは何を食べますか？',
    questions: [
      {
        question: 'ウミガメがまちがえて食べてしまうことがあるものは？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Seaweed', 'Plastic bags', 'Small fish'],
        correctIndex: 1
      },
      {
        question: 'SDGsの14番のテーマは？',
        videoRef: '動画2',
        type: 'choice',
        options: ['Zero Hunger（飢餓をゼロに）', 'Quality Education（質の高い教育）', 'Life Below Water（海の豊かさ）'],
        correctIndex: 2
      },
      {
        question: 'トラを救うために始められる「4R」に入らないものは？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Repeat', 'Refuse', 'Reuse'],
        correctIndex: 0
      },
      {
        question: 'ルーカスのお父さんをほしがっているのは？',
        videoRef: '動画4',
        type: 'choice',
        options: ['日本の野球チーム', 'ヨーロッパのサッカーチーム', 'アメリカの会社'],
        correctIndex: 1
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
        question: 'ヘルミの一番の思い出「Japan Day」でしたことは？',
        videoRef: '動画1',
        type: 'choice',
        options: ['京都に行った', '運動会をした', '日本食を食べて、ダンスを楽しんだ'],
        correctIndex: 2
      },
      {
        question: 'ダニエルが英語を勉強する理由は？',
        videoRef: '動画2',
        type: 'choice',
        options: ['パイロットになりたいから', '先生になりたいから', '日本に住みたいから'],
        correctIndex: 0
      },
      {
        question: 'ソフィアの一番の思い出、修学旅行（school trip）で行った場所は？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Nikko', 'Kyoto', 'Tokyo'],
        correctIndex: 1
      },
      {
        question: 'ルーカスの秘密（secret）は？',
        videoRef: '動画4',
        type: 'choice',
        options: ['転校生が来る', '誕生日が明日', 'みんなと同じ中学校に行けない'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'g6-u8',
    grade: 6,
    unitName: 'Unit 8: My Future, My Dream',
    url: 'https://sw21.tsho.jp/06pk/e/6/8so-01/',
    keyPhrase: 'I want to be a programmer.',
    keyPhraseJapanese: '私はプログラマーになりたいです。',
    questions: [
      {
        question: '学校祭（school festival）を楽しみたいと言った理由は？',
        videoRef: '動画1',
        type: 'choice',
        options: ['ダンスが好きだから', '料理が好きだから', '英語が好きだから'],
        correctIndex: 0
      },
      {
        question: '中学校で入りたいと言ったクラブは？',
        videoRef: '動画2',
        type: 'choice',
        options: ['The cooking club', 'The English club', 'The dance team'],
        correctIndex: 1
      },
      {
        question: '卒業式で先生が送ったメッセージは？',
        videoRef: '動画3',
        type: 'choice',
        options: ['"Study hard!"', '"Never give up!"', '"Enjoy communication!"'],
        correctIndex: 2
      },
      {
        question: '最後にルーカスが日本語で言った言葉は？',
        videoRef: '動画4',
        type: 'choice',
        options: ['Arigato', 'Sayonara', 'Konnichiwa'],
        correctIndex: 0
      }
    ]
  }
];
