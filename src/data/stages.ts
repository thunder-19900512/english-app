export interface StageData {
  id: number;
  title: string;
  description: string;
  badgeName: string;
  colorClass: string;
  items: string[];
  explanation?: string;
  practiceItems?: string[];
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
    alienWords: ['zop', 'lat', 'mib', 'ren', 'gug'],
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
    items: ['ship', 'shop', 'fish', 'dish', 'star', 'stop', 'chop', 'chin', 'thin', 'math', 'phone', 'whale', 'duck', 'ring', 'queen'],
    blendItems: [
      { word: 'ship', phonemes: ['sh', 'i', 'p'] },
      { word: 'fish', phonemes: ['f', 'i', 'sh'] },
      { word: 'chin', phonemes: ['ch', 'i', 'n'] },
      { word: 'math', phonemes: ['m', 'a', 'th'] },
      { word: 'duck', phonemes: ['d', 'u', 'k'] }
    ],
    alienWords: ['shup', 'chog', 'thip', 'whet', 'fack'],
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
    items: ['smile', 'snack', 'black', 'clock', 'spoon', 'stop', 'park', 'short', 'girl', 'chair', 'work'],
    blendItems: [
      { word: 'park', phonemes: ['p', 'ar', 'k'] },
      { word: 'girl', phonemes: ['g', 'er', 'l'] },
      { word: 'short', phonemes: ['sh', 'or', 't'] },
      { word: 'chair', phonemes: ['ch', 'air'] }
    ],
    alienWords: ['darf', 'lorn', 'mirt', 'slear', 'worf'],
    stories: [
      'The girl is in the park.',
      'I see a short clock on the chair.',
      'A black dog has a snack.'
    ]
  },
];
