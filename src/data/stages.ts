export interface StageData {
  id: number;
  title: string;
  description: string;
  badgeName: string;
  colorClass: string;
  items: string[];
  explanation?: string;
  practiceItems?: string[];
  // 連続子音や、音を単体で再生できない（例単語の肉声を使う）ステージでは
  // 「音だけをきこう」練習コーナーを出さない。代わりに単語カードで対象を色分け強調する。
  hideListenPractice?: boolean;
  labItems?: { base: string, added: string, result: string, description: string }[];
  blendItems?: { word: string, phonemes: string[] }[];
  alienWords?: string[];
  stories?: string[];
}

export const stages: StageData[] = [
  {
    id: 1,
    title: 'アルファベットの音',
    description: '基本のアルファベットの音をおぼえよう！',
    badgeName: 'ブロンズ・シード',
    colorClass: 'stage-color-1',
    items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    alienWords: ['bif', 'mup', 'zat'],
  },
  {
    id: 2,
    title: '3文字の単語',
    description: '子音・母音・子音をつなげてよもう！',
    badgeName: 'シルバー・スプラウト',
    colorClass: 'stage-color-2',
    items: ['cat', 'dog', 'pig', 'bed', 'sun', 'hat', 'bat', 'map', 'pin', 'lip', 'box', 'fox', 'cup', 'bug', 'net', 'red'],
    blendItems: [
      { word: 'cat', phonemes: ['k', 'a', 't'] },
      { word: 'dog', phonemes: ['d', 'o', 'g'] },
      { word: 'pig', phonemes: ['p', 'i', 'g'] },
      { word: 'bed', phonemes: ['b', 'e', 'd'] },
      { word: 'sun', phonemes: ['s', 'u', 'n'] }
    ],
    alienWords: ['zop', 'lat', 'mab', 'ren', 'gug'],
    stories: [
      'The cat is on the bed.',
      'A bug is in the cup.',
      'The pig has a map.',
      'The dog has a red hat.'
    ]
  },
  {
    id: 3,
    title: '2文字で1つの音',
    description: '2つの文字がくっつくと、新しい音になるよ！',
    badgeName: 'ゴールデン・リーフ',
    colorClass: 'stage-color-3',
    practiceItems: ['sh', 'ch', 'th', 'ph', 'wh', 'ck', 'ng'],
    items: ['ship', 'shop', 'fish', 'dish', 'chop', 'chin', 'thin', 'math', 'phone', 'whale', 'duck', 'ring'],
    blendItems: [
      { word: 'ship', phonemes: ['sh', 'i', 'p'] },
      { word: 'fish', phonemes: ['f', 'i', 'sh'] },
      { word: 'chin', phonemes: ['ch', 'i', 'n'] },
      { word: 'math', phonemes: ['m', 'a', 'th'] },
      { word: 'duck', phonemes: ['d', 'u', 'k'] }
    ],
    alienWords: ['shup', 'chog', 'thip', 'whet', 'fick'],
    stories: [
      'The fish is in the shop.',
      'A duck is on the ship.',
      'I see a ring and a dish.'
    ]
  },
  {
    id: 4,
    title: 'マジック E',
    description: '最後にeがつくと、前の母音がアルファベット読みになるよ！',
    badgeName: 'プラチナ・フラワー',
    colorClass: 'stage-color-4',
    explanation: '「マジックE」のルール: 単語の最後に e があると、その e は発音せず、前の母音が「アルファベットの名前」と同じ読み方（エイ、イー、アイ、オウ、ユー）に変身します！',
    practiceItems: ['a_e', 'e_e', 'i_e', 'o_e', 'u_e'],
    hideListenPractice: true,
    items: ['cake', 'make', 'take', 'bike', 'like', 'kite', 'nose', 'rose', 'cute', 'mute'],
    labItems: [
      { base: 'cap', added: 'e', result: 'cape', description: '「キャップ」が「ケイプ」に変身！' },
      { base: 'kit', added: 'e', result: 'kite', description: '「キット」が「カイト」に変身！' },
      { base: 'cub', added: 'e', result: 'cube', description: '「カブ」が「キューブ」に変身！' },
      { base: 'pin', added: 'e', result: 'pine', description: '「ピン」が「パイン」に変身！' }
    ],
    blendItems: [
      { word: 'cake', phonemes: ['k', 'ey', 'k'] },
      { word: 'bike', phonemes: ['b', 'ay', 'k'] },
      { word: 'nose', phonemes: ['n', 'ow', 'z'] },
      { word: 'cute', phonemes: ['k', 'y', 'oo', 't'] }
    ],
    alienWords: ['vane', 'fite', 'moke', 'zute', 'bape'],
    stories: [
      'I like the cute rose.',
      'Take the bike and make a cake.',
      'His nose is on the kite.'
    ]
  },
  {
    id: 5,
    title: '母音のペア',
    description: '2つの母音がならぶと、どうなるかな？',
    badgeName: 'フォニックス・クラウン',
    colorClass: 'stage-color-5',
    practiceItems: ['ai', 'ea', 'ee', 'oa'],
    items: ['rain', 'train', 'tree', 'see', 'boat', 'coat', 'meat', 'seat'],
    blendItems: [
      { word: 'rain', phonemes: ['r', 'ay', 'n'] },
      { word: 'tree', phonemes: ['t', 'r', 'iy'] },
      { word: 'boat', phonemes: ['b', 'ow', 't'] },
      { word: 'meat', phonemes: ['m', 'iy', 't'] }
    ],
    alienWords: ['zaip', 'meeb', 'foat', 'steab', 'traif'],
    stories: [
      'I see a tree in the rain.',
      'The meat is on the boat.',
      'Take a seat on the train.'
    ]
  },
  {
    id: 6,
    title: '混ざり合った音',
    description: '2つ以上の文字が混ざり合った音をおぼえよう！',
    badgeName: 'ブレンド・マスター',
    colorClass: 'stage-color-6',
    practiceItems: ['ar', 'or', 'ir', 'air', 'ear', 'wor'],
    // 上のグラフェム(ar/or/ir/air/ear/wor)と1対1で対応する例単語にそろえる
    items: ['park', 'short', 'girl', 'chair', 'ear', 'work'],
    blendItems: [
      { word: 'park', phonemes: ['p', 'ar', 'k'] },
      { word: 'girl', phonemes: ['g', 'ir', 'l'] },
      { word: 'short', phonemes: ['sh', 'or', 't'] },
      { word: 'chair', phonemes: ['ch', 'air'] }
    ],
    alienWords: ['darf', 'lorn', 'mirt', 'slear', 'worf'],
    stories: [
      'The girl is in the park.',
      'I see a short bird on the chair.',
      'My work is by the car.'
    ]
  },
  {
    id: 7,
    title: '母音のチーム その2',
    description: '母音チームのなかまをもっとおぼえよう！',
    badgeName: 'ボーカル・スター',
    colorClass: 'stage-color-7',
    explanation: '母音が2つ組むと、1番目の母音を「名前読み」して、2番目は読まないことが多いよ。ai・ay は「エイ」、ee・ey は「イー」、ie は「アイ」、ow は「オウ」、ue・ui は「ウー」！',
    practiceItems: ['ay', 'ey', 'ie', 'ow', 'ue', 'ui'],
    hideListenPractice: true,
    items: ['play', 'key', 'pie', 'tie', 'snow', 'yellow', 'blue', 'suit', 'juice', 'fruit'],
    stories: [
      'I see a blue tie.',
      'The fruit is in the snow.',
      'Play with the yellow key.'
    ]
  },
  {
    id: 8,
    title: '2文字の母音',
    description: '2つの文字で新しい母音をつくろう！',
    badgeName: 'バウエル・ジェム',
    colorClass: 'stage-color-8',
    explanation: 'oo は「ウー」、ou・ow は「アウ」、oi・oy は「オイ」、au・aw は「オー」。同じ音でも、つづりがちがうことがあるよ！',
    practiceItems: ['oo', 'ou', 'oi', 'oy', 'au', 'aw'],
    hideListenPractice: true,
    items: ['zoo', 'moon', 'book', 'mouth', 'house', 'cloud', 'coin', 'toy', 'boy', 'draw', 'saw'],
    stories: [
      'The boy has a toy.',
      'I see the moon and a cloud.',
      'Draw a house at the zoo.'
    ]
  },
  {
    id: 9,
    title: '連続子音 ブレンド①',
    description: '子音がならんでも、それぞれの音をのこしてはやく読もう！',
    badgeName: 'ブレンド・ナイト',
    colorClass: 'stage-color-9',
    explanation: '連続子音は、2つの子音の音をどちらも残したまま、はやくつなげて読むよ。「s+m=スム」「b+l=ブル」のように！',
    practiceItems: ['sm', 'sn', 'sk', 'sp', 'st', 'sw', 'bl', 'pl', 'cl', 'gl', 'fl', 'sl'],
    hideListenPractice: true,
    items: ['smile', 'snake', 'sky', 'spoon', 'star', 'swim', 'black', 'plane', 'clock', 'glass', 'flower', 'sleep'],
    stories: [
      'I see a snake in the sky.',
      'The star is black.',
      'Swim and smile!'
    ]
  },
  {
    id: 10,
    title: '連続子音 ブレンド②',
    description: '3つの子音がならぶブレンドにも挑戦！',
    badgeName: 'ブレンド・マスター・プロ',
    colorClass: 'stage-color-10',
    explanation: 'br・fr・cr・gr・dr・tr のなかまや、thr・spr・str のように3つならぶ音もあるよ。全部の音をはやくつなげて読もう！',
    practiceItems: ['br', 'fr', 'cr', 'gr', 'dr', 'tr', 'thr', 'spr', 'str'],
    hideListenPractice: true,
    items: ['brush', 'frog', 'crab', 'grape', 'drum', 'truck', 'three', 'spring', 'strawberry', 'dragon', 'crown'],
    stories: [
      'The frog is on the tree.',
      'I see three grapes.',
      'A dragon has a crown.'
    ]
  },
];
