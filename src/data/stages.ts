export interface StageData {
  id: number;
  title: string;
  description: string;
  badgeName: string;
  colorClass: string;
  items: string[];
  explanation?: string;
  practiceItems?: string[];
}

export const stages: StageData[] = [
  {
    id: 1,
    title: 'アルファベットの音',
    description: '基本のアルファベットの音をおぼえよう！',
    badgeName: 'ブロンズ・シード',
    colorClass: 'stage-color-1',
    items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  },
  {
    id: 2,
    title: '3文字の単語',
    description: '子音・母音・子音をつなげてよもう！',
    badgeName: 'シルバー・スプラウト',
    colorClass: 'stage-color-2',
    items: ['cat', 'dog', 'pig', 'bed', 'sun', 'hat', 'bat', 'map', 'pin', 'lip', 'box', 'fox', 'cup', 'bug', 'net', 'red'],
  },
  {
    id: 3,
    title: '2文字で1つの音',
    description: '2つの文字がくっつくと、新しい音になるよ！',
    badgeName: 'ゴールデン・リーフ',
    colorClass: 'stage-color-3',
    practiceItems: ['sh', 'ch', 'th', 'ph', 'wh', 'ck', 'ng'],
    items: ['ship', 'shop', 'fish', 'dish', 'star', 'stop', 'chop', 'chin', 'thin', 'math', 'phone', 'whale', 'duck', 'ring', 'queen'],
  },
  {
    id: 4,
    title: 'マジック E',
    description: '最後にeがつくと、前の母音がアルファベット読みになるよ！',
    badgeName: 'プラチナ・フラワー',
    colorClass: 'stage-color-4',
    explanation: '「マジックE」のルール: 単語の最後に e があると、その e は発音せず、前の母音が「アルファベットの名前」と同じ読み方（エイ、イー、アイ、オウ、ユー）に変身します！',
    items: ['cake', 'make', 'take', 'bike', 'like', 'kite', 'nose', 'rose', 'cute', 'mute'],
  },
  {
    id: 5,
    title: '母音のペア',
    description: '2つの母音がならぶと、どうなるかな？',
    badgeName: 'フォニックス・クラウン',
    colorClass: 'stage-color-5',
    practiceItems: ['ai', 'ea', 'ee', 'oa'],
    items: ['rain', 'train', 'tree', 'see', 'boat', 'coat', 'meat', 'seat'],
  },
  {
    id: 6,
    title: '混ざり合った音',
    description: '2つ以上の文字が混ざり合った音をおぼえよう！',
    badgeName: 'ブレンド・マスター',
    colorClass: 'stage-color-6',
    practiceItems: ['ar', 'or', 'ir', 'air', 'ear', 'wor'],
    items: ['smile', 'snack', 'black', 'clock', 'spoon', 'stop', 'park', 'short', 'girl', 'chair', 'work'],
  },
];
