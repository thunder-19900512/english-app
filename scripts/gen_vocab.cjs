const fs = require('fs');

const emojis = {
"rice": "🍚", "rice ball": "🍙", "curry and rice": "🍛", "grilled eel": "🍱",
"grilled fish": "🐟", "bread": "🍞", "sandwich": "🥪", "pancake": "🥞",
"pizza": "🍕", "hamburger": "🍔", "hot dog": "🌭", "omelet": "🍳",
"French fries": "🍟", "fried chicken": "🍗", "spaghetti": "🍝", "sausage": "🌭",
"steak": "🥩", "salad": "🥗", "soup": "🥣", "pie": "🥧",
"fried noodles": "🍜", "ramen": "🍜", "soba": "🍜", "beef bowl": "🍲",
"sushi": "🍣", "tempura": "🍤", "coffee": "☕", "tea": "🍵",
"green tea": "🍵", "juice": "🧃", "soda": "🥤", "milk": "🥛",
"water": "💧", "mineral water": "🚰", "cake": "🍰", "donut": "🍩",
"parfait": "🍨", "pudding": "🍮", "ice cream": "🍦", "shaved ice": "🍧",
"chocolate": "🍫", "cream puff": "🧁", "popcorn": "🍿", "potato chips": "🥔",
"apple": "🍎", "banana": "🍌", "cherry": "🍒", "grapes": "🍇",
"kiwi fruit": "🥝", "lemon": "🍋", "melon": "🍈", "orange": "🍊",
"peach": "🍑", "pineapple": "🍍", "strawberry": "🍓", "watermelon": "🍉",
"bean": "🫘", "broccoli": "🥦", "cabbage": "🥬", "carrot": "🥕",
"corn": "🌽", "cucumber": "🥒", "eggplant": "🍆", "green pepper": "🫑",
"lettuce": "🥬", "mushroom": "🍄", "nut": "🥜", "onion": "🧅",
"potato": "🥔", "spinach": "🍃", "tomato": "🍅", "breakfast": "🍳",
"lunch": "🍱", "dinner": "🍽️", "meat": "🥩", "beef": "🐄",
"chicken": "🐔", "pork": "🐖", "bacon": "🥓", "ham": "🥩",
"cheese": "🧀", "egg": "🥚", "fish": "🐟", "salmon": "🍣",
"octopus": "🐙", "bitter": "😖", "sweet": "😋", "salty": "🧂",
"sour": "🍋", "spicy": "🌶️", "delicious": "😍", "soft": "☁️",
"hard": "🪨", "cold": "🧊", "hot": "🔥", "spell": "📝",
"like": "❤️", "listen": "👂", "want": "🥺", "play": "⚽",
"walk": "🚶", "run": "🏃", "dance": "💃", "jump": "🦘",
"catch": "⚾", "swim": "🏊", "fly": "🕊️", "sing": "🎤",
"cook": "🍳", "have": "👐", "go": "🚶", "turn": "🔄",
"see": "👀", "look": "👁️", "drink": "🚰", "eat": "🍽️",
"buy": "🛒", "speak": "🗣️", "live": "🏡", "make": "🛠️",
"wear": "👕", "talk": "💬", "watch": "📺", "read": "📖",
"help": "🤝", "practice": "🎹", "clean": "🧹", "enjoy": "😊",
"visit": "🧳", "ride": "🚲", "come": "👋", "get": "🎁",
"save": "🛟", "stop": "🛑", "study": "📚", "join": "🧑‍🤝‍🧑",
"work": "💼", "ate": "🍽️", "went": "🚶", "saw": "👀",
"had": "👐", "made": "🛠️", "enjoyed": "😊", "played": "⚽",
"watched": "📺"
};

const rawData = `rice	ご飯	食べ物	12
rice ball	おにぎり	食べ物	12
curry and rice	カレーライス	食べ物	12
grilled eel	うなぎの蒲焼	食べ物	12
grilled fish	焼き魚	食べ物	12
bread	パン	食べ物	12
sandwich	サンドイッチ	食べ物	12
pancake	パンケーキ	食べ物	12
pizza	ピザ	食べ物	12
hamburger	ハンバーガー	食べ物	12
hot dog	ホットドッグ	食べ物	12
omelet	オムレツ	食べ物	12
French fries	フライドポテト	食べ物	12
fried chicken	フライドチキン	食べ物	12
spaghetti	スパゲッティ	食べ物	12
sausage	ソーセージ	食べ物	12
steak	ステーキ	食べ物	12
salad	サラダ	食べ物	12
soup	スープ	食べ物	12
pie	パイ	食べ物	12
fried noodles	焼きそば	食べ物	12
ramen	ラーメン	食べ物	12
soba	そば	食べ物	12
beef bowl	牛丼	食べ物	12
sushi	寿司	食べ物	12
tempura	天ぷら	食べ物	12
coffee	コーヒー	飲み物	13
tea	お茶 / 紅茶	飲み物	13
green tea	緑茶	飲み物	13
juice	ジュース	飲み物	13
soda	ソーダ / 炭酸飲料	飲み物	13
milk	牛乳	飲み物	13
water	水	飲み物	13
mineral water	ミネラルウォーター	飲み物	13
cake	ケーキ	デザート	13
donut	ドーナツ	デザート	13
parfait	パフェ	デザート	13
pudding	プリン	デザート	13
ice cream	アイスクリーム	デザート	13
shaved ice	かき氷	デザート	13
chocolate	チョコレート	デザート	13
cream puff	シュークリーム	デザート	13
popcorn	ポップコーン	デザート	13
potato chips	ポテトチップス	デザート	13
apple	りんご	果物・野菜	14
banana	バナナ	果物・野菜	14
cherry	さくらんぼ	果物・野菜	14
grapes	ぶどう	果物・野菜	14
kiwi fruit	キウイフルーツ	果物・野菜	14
lemon	レモン	果物・野菜	14
melon	メロン	果物・野菜	14
orange	オレンジ	果物・野菜	14
peach	もも	果物・野菜	14
pineapple	パイナップル	果物・野菜	14
strawberry	いちご	果物・野菜	14
watermelon	すいか	果物・野菜	14
bean	豆	果物・野菜	14
broccoli	ブロッコリー	果物・野菜	14
cabbage	キャベツ	果物・野菜	14
carrot	にんじん	果物・野菜	14
corn	とうもろこし	果物・野菜	14
cucumber	きゅうり	果物・野菜	14
eggplant	なす	果物・野菜	14
green pepper	ピーマン	果物・野菜	14
lettuce	レタス	果物・野菜	14
mushroom	きのこ	果物・野菜	14
nut	ナッツ	果物・野菜	14
onion	たまねぎ	果物・野菜	14
potato	じゃがいも	果物・野菜	14
spinach	ほうれんそう	果物・野菜	14
tomato	トマト	果物・野菜	14
breakfast	朝食	食事	14
lunch	昼食	食事	14
dinner	夕食	食事	14
meat	肉	食材	15
beef	牛肉	食材	15
chicken	鶏肉	食材	15
pork	豚肉	食材	15
bacon	ベーコン	食材	15
ham	ハム	食材	15
cheese	チーズ	食材	15
egg	卵	食材	15
fish	魚	食材	15
salmon	さけ	食材	15
octopus	たこ	食材	15
bitter	にがい	味など	15
sweet	あまい	味など	15
salty	しょっぱい	味など	15
sour	すっぱい	味など	15
spicy	からい	味など	15
delicious	おいしい	味など	15
soft	やわらかい	味など	15
hard	かたい	味など	15
cold	つめたい	味など	15
hot	あつい / あたたかい	味など	15
spell	つづる	動作など（5年）	22
like	〜が好きだ	動作など（5年）	22
listen	聞く	動作など（5年）	22
want	欲しい	動作など（5年）	22
play	遊ぶ	動作など（5年）	22
walk	歩く	動作など（5年）	22
run	走る	動作など（5年）	22
dance	踊る	動作など（5年）	22
jump	ジャンプする	動作など（5年）	22
catch	捕る	動作など（5年）	22
swim	泳ぐ	動作など（5年）	22
fly	飛ぶ	動作など（5年）	22
sing	歌う	動作など（5年）	22
cook	料理する	動作など（5年）	22
have	持っている	動作など（5年）	22
go	行く	動作など（5年）	22
turn	振り向く・回る	動作など（5年）	22
see	見る	動作など（5年）	22
look	見る	動作など（5年）	22
drink	飲む	動作など（5年）	22
eat	食べる	動作など（5年）	22
buy	買う	動作など（5年）	22
speak	話す	動作など（6年）	23
live	生きる・生活する	動作など（6年）	23
make	作る	動作など（6年）	23
wear	着る	動作など（6年）	23
talk	話す	動作など（6年）	23
watch	観る	動作など（6年）	23
read	読む	動作など（6年）	23
help	助ける	動作など（6年）	23
practice	練習する	動作など（6年）	23
clean	きれいにする	動作など（6年）	23
enjoy	楽しむ	動作など（6年）	23
visit	訪ねる	動作など（6年）	23
ride	乗る	動作など（6年）	23
come	来る	動作など（6年）	23
get	得る	動作など（6年）	23
save	救う	動作など（6年）	23
stop	止まる	動作など（6年）	23
study	勉強する	動作など（6年）	23
join	参加する	動作など（6年）	23
work	仕事する	動作など（6年）	23
ate	食べた	したこと	23
went	行った	したこと	23
saw	見た	したこと	23
had	持っていた	したこと	23
made	作った	したこと	23
enjoyed	楽しんだ	したこと	23
played	遊んだ	したこと	23
watched	観た	したこと	23`;

let idCounter = 1;
const vocabularyList = rawData.trim().split('\\n').map(line => {
  const [english, japanese, category, page] = line.split('\\t');
  return {
    id: 'v' + idCounter++,
    english,
    japanese,
    category,
    page: parseInt(page),
    emoji: emojis[english] || "🌟"
  };
});

const tsCode = "export interface Vocabulary {\\n  id: string;\\n  english: string;\\n  japanese: string;\\n  category: string;\\n  page: number;\\n  emoji: string;\\n}\\n\\nexport const vocabulary: Vocabulary[] = " + JSON.stringify(vocabularyList, null, 2) + ";\\n";

fs.writeFileSync('src/data/vocabulary.ts', tsCode);
console.log('src/data/vocabulary.ts created!');
