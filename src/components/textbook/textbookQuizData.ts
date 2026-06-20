import type { TextbookQuiz } from './TextbookMode';

export const DEFAULT_QUIZZES: TextbookQuiz[] = [
  // ===== Grade 5 =====
  {
    id: 'g5-u1-auto',
    grade: 5,
    unitName: 'Unit 1: Hello, friends!',
    url: 'https://sw21.tsho.jp/06pk/e/5/1so-01/',
    keyPhrase: 'Nice to meet you.',
    keyPhraseJapanese: 'はじめまして。よろしくね。',
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
    id: 'g5-u2-auto',
    grade: 5,
    unitName: 'Unit 2: Happy birthday!',
    url: 'https://sw21.tsho.jp/06pk/e/5/2so-01/',
    keyPhrase: 'When is your birthday?',
    keyPhraseJapanese: 'あなたの誕生日はいつ？',
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
  // ===== Grade 6 =====
  {
    id: 'g6-u4-auto',
    grade: 6,
    unitName: 'Unit 4: Let\'s see the world.',
    url: 'https://sw21.tsho.jp/06pk/e/6/4so-01/',
    keyPhrase: 'I want to go to America.',
    keyPhraseJapanese: '私はアメリカに行きたいな。',
    questions: [
      {
        question: 'Sophia が紹介した国はどこ？',
        videoRef: '動画1',
        type: 'choice',
        options: ['America', 'Australia', 'Vietnam'],
        correctIndex: 1
      },
      {
        question: 'Daichi が行きたい国はどこ？（英語で入力してね）',
        videoRef: '動画2',
        type: 'typing',
        correctAnswer: 'America'
      },
      {
        question: 'オーストラリアにある大きな茶色い岩の名前は？',
        videoRef: '動画1',
        type: 'choice',
        options: ['Golden Gate Bridge', 'Computer History Museum', 'Uluru'],
        correctIndex: 2
      },
      {
        question: 'ベトナムの伝統的な服「アオザイ」を買いたいのはだれ？',
        videoRef: '動画3',
        type: 'choice',
        options: ['Sophia', 'Daichi', 'Nadia'],
        correctIndex: 2
      }
    ]
  }
];
