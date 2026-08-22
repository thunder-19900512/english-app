const fs = require('fs');
const path = require('path');

const rawData = `1	rice	ご飯	食べ物	I'd like ◯◯.	12
2	rice ball	おにぎり	食べ物	I'd like ◯◯.	12
3	curry and rice	カレーライス	食べ物	I'd like ◯◯.	12
4	grilled eel	うなぎの蒲焼	食べ物	I'd like ◯◯.	12
5	grilled fish	焼き魚	食べ物	I'd like ◯◯.	12
6	bread	パン	食べ物	I'd like ◯◯.	12
7	sandwich	サンドイッチ	食べ物	I'd like ◯◯.	12
8	pancake	パンケーキ	食べ物	I'd like ◯◯.	12
9	pizza	ピザ	食べ物	I'd like ◯◯.	12
10	hamburger	ハンバーガー	食べ物	I'd like ◯◯.	12
11	hot dog	ホットドッグ	食べ物	I'd like ◯◯.	12
12	omelet	オムレツ	食べ物	I'd like ◯◯.	12
13	French fries	フライドポテト	食べ物	I'd like ◯◯.	12
14	fried chicken	フライドチキン	食べ物	I'd like ◯◯.	12
15	spaghetti	スパゲッティ	食べ物	I'd like ◯◯.	12
16	sausage	ソーセージ	食べ物	I'd like ◯◯.	12
17	steak	ステーキ	食べ物	I'd like ◯◯.	12
18	salad	サラダ	食べ物	I'd like ◯◯.	12
19	soup	スープ	食べ物	I'd like ◯◯.	12
20	pie	パイ	食べ物	I'd like ◯◯.	12
21	fried noodles	焼きそば	食べ物	I'd like ◯◯.	12
22	ramen	ラーメン	食べ物	I'd like ◯◯.	12
23	soba	そば	食べ物	I'd like ◯◯.	12
24	beef bowl	牛丼	食べ物	I'd like ◯◯.	12
25	sushi	寿司	食べ物	I'd like ◯◯.	12
26	tempura	天ぷら	食べ物	I'd like ◯◯.	12
27	coffee	コーヒー	飲み物	I'd like ◯◯.	13
28	tea	お茶 / 紅茶	飲み物	I'd like ◯◯.	13
29	green tea	緑茶	飲み物	I'd like ◯◯.	13
30	juice	ジュース	飲み物	I'd like ◯◯.	13
31	soda	ソーダ / 炭酸飲料	飲み物	I'd like ◯◯.	13
32	milk	牛乳	飲み物	I'd like ◯◯.	13
33	water	水	飲み物	I'd like ◯◯.	13
34	mineral water	ミネラルウォーター	飲み物	I'd like ◯◯.	13
35	cake	ケーキ	デザート	I'd like ◯◯.	13
36	donut	ドーナツ	デザート	I'd like ◯◯.	13
37	parfait	パフェ	デザート	I'd like ◯◯.	13
38	pudding	プリン	デザート	I'd like ◯◯.	13
39	ice cream	アイスクリーム	デザート	I'd like ◯◯.	13
40	shaved ice	かき氷	デザート	I'd like ◯◯.	13
41	chocolate	チョコレート	デザート	I'd like ◯◯.	13
42	cream puff	シュークリーム	デザート	I'd like ◯◯.	13
43	popcorn	ポップコーン	デザート	I'd like ◯◯.	13
44	potato chips	ポテトチップス	デザート	I'd like ◯◯.	13
45	apple	りんご	果物・野菜	One ◯◯, please.	14
46	banana	バナナ	果物・野菜	One ◯◯, please.	14
47	cherry	さくらんぼ	果物・野菜	One ◯◯, please.	14
48	grapes	ぶどう	果物・野菜	One ◯◯, please.	14
49	kiwi fruit	キウイフルーツ	果物・野菜	One ◯◯, please.	14
50	lemon	レモン	果物・野菜	One ◯◯, please.	14
51	melon	メロン	果物・野菜	One ◯◯, please.	14
52	orange	オレンジ	果物・野菜	One ◯◯, please.	14
53	peach	もも	果物・野菜	One ◯◯, please.	14
54	pineapple	パイナップル	果物・野菜	One ◯◯, please.	14
55	strawberry	いちご	果物・野菜	One ◯◯, please.	14
56	watermelon	すいか	果物・野菜	One ◯◯, please.	14
57	bean	豆	果物・野菜	One ◯◯, please.	14
58	broccoli	ブロッコリー	果物・野菜	One ◯◯, please.	14
59	cabbage	キャベツ	果物・野菜	One ◯◯, please.	14
60	carrot	にんじん	果物・野菜	One ◯◯, please.	14
61	corn	とうもろこし	果物・野菜	One ◯◯, please.	14
62	cucumber	きゅうり	果物・野菜	One ◯◯, please.	14
63	eggplant	なす	果物・野菜	One ◯◯, please.	14
64	green pepper	ピーマン	果物・野菜	One ◯◯, please.	14
65	lettuce	レタス	果物・野菜	One ◯◯, please.	14
66	mushroom	きのこ	果物・野菜	One ◯◯, please.	14
67	nut	ナッツ	果物・野菜	One ◯◯, please.	14
68	onion	たまねぎ	果物・野菜	One ◯◯, please.	14
69	potato	じゃがいも	果物・野菜	One ◯◯, please.	14
70	spinach	ほうれんそう	果物・野菜	One ◯◯, please.	14
71	tomato	トマト	果物・野菜	One ◯◯, please.	14
72	breakfast	朝食	食事	Let's eat ◯◯.	14
73	lunch	昼食	食事	Let's eat ◯◯.	14
74	dinner	夕食	食事	Let's eat ◯◯.	14
75	meat	肉	食材	◯◯, please.	15
76	beef	牛肉	食材	◯◯, please.	15
77	chicken	鶏肉	食材	◯◯, please.	15
78	pork	豚肉	食材	◯◯, please.	15
79	bacon	ベーコン	食材	◯◯, please.	15
80	ham	ハム	食材	◯◯, please.	15
81	cheese	チーズ	食材	◯◯, please.	15
82	egg	卵	食材	◯◯, please.	15
83	fish	魚	食材	◯◯, please.	15
84	salmon	さけ	食材	◯◯, please.	15
85	octopus	たこ	食材	◯◯, please.	15
86	bitter	にがい	味など	It's ◯◯.	15
87	sweet	あまい	味など	It's ◯◯.	15
88	salty	しょっぱい	味など	It's ◯◯.	15
89	sour	すっぱい	味など	It's ◯◯.	15
90	spicy	からい	味など	It's ◯◯.	15
91	delicious	おいしい	味など	It's ◯◯.	15
92	soft	やわらかい	味など	It's ◯◯.	15
93	hard	かたい	味など	It's ◯◯.	15
94	cold	つめたい	味など	It's ◯◯.	15
95	hot	あつい / あたたかい	味など	It's ◯◯.	15
96	spell	つづる	動作など（5年）	I can ◯◯ well.	22
97	like	〜が好きだ	動作など（5年）	I can ◯◯ well.	22
98	listen	聞く	動作など（5年）	I can ◯◯ well.	22
99	want	欲しい	動作など（5年）	I can ◯◯ well.	22
100	play	遊ぶ	動作など（5年）	I can ◯◯ well.	22
101	walk	歩く	動作など（5年）	I can ◯◯ well.	22
102	run	走る	動作など（5年）	I can ◯◯ well.	22
103	dance	踊る	動作など（5年）	I can ◯◯ well.	22
104	jump	ジャンプする	動作など（5年）	I can ◯◯ well.	22
105	catch	捕る	動作など（5年）	I can ◯◯ well.	22
106	swim	泳ぐ	動作など（5年）	I can ◯◯ well.	22
107	fly	飛ぶ	動作など（5年）	I can ◯◯ well.	22
108	sing	歌う	動作など（5年）	I can ◯◯ well.	22
109	cook	料理する	動作など（5年）	I can ◯◯ well.	22
110	have	持っている	動作など（5年）	I can ◯◯ well.	22
111	go	行く	動作など（5年）	I can ◯◯ well.	22
112	turn	振り向く・回る	動作など（5年）	I can ◯◯ well.	22
113	see	見る	動作など（5年）	I can ◯◯ well.	22
114	look	見る	動作など（5年）	I can ◯◯ well.	22
115	drink	飲む	動作など（5年）	I can ◯◯ well.	22
116	eat	食べる	動作など（5年）	I can ◯◯ well.	22
117	buy	買う	動作など（5年）	I can ◯◯ well.	22
118	speak	話す	動作など（6年）	I want to ◯◯.	23
119	live	生きる・生活する	動作など（6年）	I want to ◯◯.	23
120	make	作る	動作など（6年）	I want to ◯◯.	23
121	wear	着る	動作など（6年）	I want to ◯◯.	23
122	talk	話す	動作など（6年）	I want to ◯◯.	23
123	watch	観る	動作など（6年）	I want to ◯◯.	23
124	read	読む	動作など（6年）	I want to ◯◯.	23
125	help	助ける	動作など（6年）	I want to ◯◯.	23
126	practice	練習する	動作など（6年）	I want to ◯◯.	23
127	clean	きれいにする	動作など（6年）	I want to ◯◯.	23
128	enjoy	楽しむ	動作など（6年）	I want to ◯◯.	23
129	visit	訪ねる	動作など（6年）	I want to ◯◯.	23
130	ride	乗る	動作など（6年）	I want to ◯◯.	23
131	come	来る	動作など（6年）	I want to ◯◯.	23
132	get	得る	動作など（6年）	I want to ◯◯.	23
133	save	救う	動作など（6年）	I want to ◯◯.	23
134	stop	止まる	動作など（6年）	I want to ◯◯.	23
135	study	勉強する	動作など（6年）	I want to ◯◯.	23
136	join	参加する	動作など（6年）	I want to ◯◯.	23
137	work	仕事する	動作など（6年）	I want to ◯◯.	23
138	ate	食べた	したこと	I ◯◯ 〜.	23
139	went	行った	したこと	I ◯◯ 〜.	23
140	saw	見た	したこと	I ◯◯ 〜.	23
141	had	持っていた	したこと	I ◯◯ 〜.	23
142	made	作った	したこと	I ◯◯ 〜.	23
143	enjoyed	楽しんだ	したこと	I ◯◯ 〜.	23
144	played	遊んだ	したこと	I ◯◯ 〜.	23
145	watched	観た	したこと	I ◯◯ 〜.	23
146	fine	大丈夫	気分	I'm ◯◯.	8
147	good	良い	気分	I'm ◯◯.	8
148	great	すばらしい	気分	I'm ◯◯.	8
149	happy	ハッピー	気分	I'm ◯◯.	8
150	sad	悲しい	気分	I'm ◯◯.	8
151	nervous	緊張している	気分	I'm ◯◯.	8
152	tired	疲れた	気分	I'm ◯◯.	8
153	sleepy	眠い	気分	I'm ◯◯.	8
154	busy	忙しい	気分	I'm ◯◯.	8
155	hungry	お腹がすいた	気分	I'm ◯◯.	8
156	thirsty	のどがかわいた	気分	I'm ◯◯.	8
157	one	1	数	I'm ◯◯ years old.	9
158	two	2	数	I'm ◯◯ years old.	9
159	three	3	数	I'm ◯◯ years old.	9
160	four	4	数	I'm ◯◯ years old.	9
161	five	5	数	I'm ◯◯ years old.	9
162	six	6	数	I'm ◯◯ years old.	9
163	seven	7	数	I'm ◯◯ years old.	9
164	eight	8	数	I'm ◯◯ years old.	9
165	nine	9	数	I'm ◯◯ years old.	9
166	ten	10	数	I'm ◯◯ years old.	9
167	eleven	11	数	I'm ◯◯ years old.	9
168	twelve	12	数	I'm ◯◯ years old.	9
169	thirteen	13	数	I'm ◯◯ years old.	9
170	fourteen	14	数	I'm ◯◯ years old.	9
171	fifteen	15	数	I'm ◯◯ years old.	9
172	sixteen	16	数	I'm ◯◯ years old.	9
173	seventeen	17	数	I'm ◯◯ years old.	9
174	eighteen	18	数	I'm ◯◯ years old.	9
175	nineteen	19	数	I'm ◯◯ years old.	9
176	twenty	20	数	I'm ◯◯ years old.	9
177	twenty-one	21	数	I'm ◯◯ years old.	9
178	twentytwo	22	数	I'm ◯◯ years old.	9
179	twenty-three	23	数	I'm ◯◯ years old.	9
180	twenty-four	24	数	I'm ◯◯ years old.	9
181	twenty-five	25	数	I'm ◯◯ years old.	9
182	twenty-six	26	数	I'm ◯◯ years old.	9
183	twenty-seven	27	数	I'm ◯◯ years old.	9
184	twenty-eight	28	数	I'm ◯◯ years old.	9
185	twenty-nine	29	数	I'm ◯◯ years old.	9
186	thirty	30	数	I'm ◯◯ years old.	9
187	forty	40	数	I'm ◯◯ years old.	9
188	fifty	50	数	I'm ◯◯ years old.	9
189	sixty	60	数	I'm ◯◯ years old.	9
190	seventy	70	数	I'm ◯◯ years old.	9
191	eighty	80	数	I'm ◯◯ years old.	9
192	ninety	90	数	I'm ◯◯ years old.	9
193	one hundred	100	数	I'm ◯◯ years old.	9
194	zero	0	数	I'm ◯◯ years old.	9
195	color	色	色	I like ◯◯.	10
196	white	白	色	I like ◯◯.	10
197	red	赤	色	I like ◯◯.	10
198	orange	オレンジ	色	I like ◯◯.	10
199	yellow	黄色	色	I like ◯◯.	10
200	green	緑	色	I like ◯◯.	10
201	blue	青	色	I like ◯◯.	10
202	black	黒	色	I like ◯◯.	10
203	brown	茶色	色	I like ◯◯.	10
204	purple	紫	色	I like ◯◯.	10
205	pink	ピンク	色	I like ◯◯.	10
206	light blue	水色	色	I like ◯◯.	10
207	yellow green	黄緑	色	I like ◯◯.	10
208	gold	金	色	I like ◯◯.	10
209	silver	銀	色	I like ◯◯.	10
210	shape	形	形	I like ◯◯.	10
211	circle	丸	形	I like ◯◯.	10
212	cross	十字架	形	I like ◯◯.	10
213	diamond	ダイヤモンド	形	I like ◯◯.	10
214	heart	ハート	形	I like ◯◯.	10
215	rectangle	長方形	形	I like ◯◯.	10
216	square	四角	形	I like ◯◯.	10
217	star	星	形	I like ◯◯.	10
218	triangle	三角形	形	I like ◯◯.	10
219	January	1月	月	My birthday is in ◯◯.	18
220	February	2月	月	My birthday is in ◯◯.	18
221	March	3月	月	My birthday is in ◯◯.	18
222	April	4月	月	My birthday is in ◯◯.	18
223	May	5月	月	My birthday is in ◯◯.	18
224	June	6月	月	My birthday is in ◯◯.	18
225	July	7月	月	My birthday is in ◯◯.	18
226	August	8月	月	My birthday is in ◯◯.	18
227	september	9月	月	My birthday is in ◯◯.	18
228	October	10月	月	My birthday is in ◯◯.	18
229	november	11月	月	My birthday is in ◯◯.	18
230	december	12月	月	My birthday is in ◯◯.	18
231	Sunday	日曜日	曜日	It's ◯◯.	19
232	Monday	月曜日	曜日	It's ◯◯.	19
233	Tuesday	火曜日	曜日	It's ◯◯.	19
234	Wednesday	水曜日	曜日	It's ◯◯.	19
235	Thursday	木曜日	曜日	It's ◯◯.	19
236	Friday	金曜日	曜日	It's ◯◯.	19
237	Saturday	土曜日	曜日	It's ◯◯.	19
238	spring	春	季節	I like ◯◯.	19
239	summer	夏	季節	I like ◯◯.	19
240	autumn	秋	季節	I like ◯◯.	19
241	winter	冬	季節	I like ◯◯.	19
242	sunny	晴れ	天気	It's a ◯◯ day.	19
243	cloudy	曇り	天気	It's a ◯◯ day.	19
244	windy	強風	天気	It's a ◯◯ day.	19
245	rainy	雨	天気	It's a ◯◯ day.	19
246	snowy	雪の降る	天気	It's a ◯◯ day.	19
247	cold	寒い	天気	It's a ◯◯ day.	19
248	walm	暖かい	天気	It's a ◯◯ day.	19
249	hot	熱い	天気	It's a ◯◯ day.	19
250	humid	じめじめした	天気	It's a ◯◯ day.	19`;

// Existing emojis to reuse if match
const oldEmojis = {
  "rice": "🍚", "rice ball": "🍙", "curry and rice": "🍛", "grilled eel": "🍱", "grilled fish": "🐟", "bread": "🍞", "sandwich": "🥪", "pancake": "🥞", "pizza": "🍕", "hamburger": "🍔", "hot dog": "🌭", "omelet": "🍳", "French fries": "🍟", "fried chicken": "🍗", "spaghetti": "🍝", "sausage": "🌭", "steak": "🥩", "salad": "🥗", "soup": "🥣", "pie": "🥧", "fried noodles": "🍜", "ramen": "🍜", "soba": "🍜", "beef bowl": "🍲", "sushi": "🍣", "tempura": "🍤",
  "coffee": "☕", "tea": "🍵", "green tea": "🍵", "juice": "🧃", "soda": "🥤", "milk": "🥛", "water": "💧", "mineral water": "🚰", "cake": "🍰", "donut": "🍩", "parfait": "🍨", "pudding": "🍮", "ice cream": "🍦", "shaved ice": "🍧", "chocolate": "🍫", "cream puff": "🧁", "popcorn": "🍿", "potato chips": "🥔", "apple": "🍎", "banana": "🍌", "cherry": "🍒", "grapes": "🍇", "kiwi fruit": "🥝", "lemon": "🍋", "melon": "🍈", "orange": "🍊", "peach": "🍑", "pineapple": "🍍", "strawberry": "🍓", "watermelon": "🍉",
  "bean": "🫘", "broccoli": "🥦", "cabbage": "🥬", "carrot": "🥕", "corn": "🌽", "cucumber": "🥒", "eggplant": "🍆", "green pepper": "🫑", "lettuce": "🥬", "mushroom": "🍄", "nut": "🥜", "onion": "🧅", "potato": "🥔", "spinach": "🍃", "tomato": "🍅", "breakfast": "🍳", "lunch": "🍱", "dinner": "🍽️", "meat": "🥩", "beef": "🐄", "chicken": "🐔", "pork": "🐖", "bacon": "🥓", "ham": "🥩", "cheese": "🧀", "egg": "🥚", "fish": "🐟", "salmon": "🍣", "octopus": "🐙",
  "bitter": "😖", "sweet": "😋", "salty": "🧂", "sour": "🍋", "spicy": "🌶️", "delicious": "😍", "soft": "☁️", "hard": "🪨", "cold": "🧊", "hot": "🔥",
  "spell": "📝", "like": "❤️", "listen": "👂", "want": "🥺", "play": "⚽", "walk": "🚶", "run": "🏃", "dance": "💃", "jump": "🦘", "catch": "⚾", "swim": "🏊", "fly": "🕊️", "sing": "🎤", "cook": "🍳", "have": "👐", "go": "🚶", "turn": "🔄", "see": "👀", "look": "👁️", "drink": "🚰", "eat": "🍽️", "buy": "🛒",
  "speak": "🗣️", "live": "🏡", "make": "🛠️", "wear": "👕", "talk": "💬", "watch": "📺", "read": "📖", "help": "🤝", "practice": "🎹", "clean": "🧹", "enjoy": "😊", "visit": "🧳", "ride": "🚲", "come": "👋", "get": "🎁", "save": "🛟", "stop": "🛑", "study": "📚", "join": "🧑‍🤝‍🧑", "work": "💼", "ate": "🍽️", "went": "🚶", "saw": "👀", "had": "👐", "made": "🛠️", "enjoyed": "😊", "played": "⚽", "watched": "📺"
};

// Fallback logic for new words
const getEmoji = (word) => {
  if (oldEmojis[word]) return oldEmojis[word];
  
  const m = {
    "fine": "👌", "good": "👍", "great": "🌟", "happy": "😄", "sad": "😢", "nervous": "😰", "tired": "😫", "sleepy": "😴", "busy": "🏃", "hungry": "🤤", "thirsty": "🥵",
    "one": "1️⃣", "two": "2️⃣", "three": "3️⃣", "four": "4️⃣", "five": "5️⃣", "six": "6️⃣", "seven": "7️⃣", "eight": "8️⃣", "nine": "9️⃣", "ten": "🔟",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17", "eighteen": "18", "nineteen": "19", "twenty": "20",
    "twenty-one": "21", "twentytwo": "22", "twenty-three": "23", "twenty-four": "24", "twenty-five": "25", "twenty-six": "26", "twenty-seven": "27", "twenty-eight": "28", "twenty-nine": "29",
    "thirty": "30", "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90", "one hundred": "💯", "zero": "0️⃣",
    "color": "🎨", "white": "⚪", "red": "🔴", "orange": "🟠", "yellow": "🟡", "green": "🟢", "blue": "🔵", "black": "⚫", "brown": "🟤", "purple": "🟣", "pink": "🌸", "light blue": "💧", "yellow green": "🍈", "gold": "🟡", "silver": "⚪",
    "shape": "🔷", "circle": "⭕", "cross": "➕", "diamond": "♦️", "heart": "❤️", "rectangle": "▭", "square": "⬜", "star": "⭐", "triangle": "🔺",
    "January": "1️⃣", "February": "2️⃣", "March": "3️⃣", "April": "4️⃣", "May": "5️⃣", "June": "6️⃣", "July": "7️⃣", "August": "8️⃣", "september": "9️⃣", "October": "🔟", "november": "11", "december": "12",
    "Sunday": "☀️", "Monday": "🌙", "Tuesday": "🔥", "Wednesday": "💧", "Thursday": "🌲", "Friday": "💰", "Saturday": "⛰️",
    "spring": "🌸", "summer": "🍉", "autumn": "🍁", "winter": "⛄",
    "sunny": "☀️", "cloudy": "☁️", "windy": "🌬️", "rainy": "🌧️", "snowy": "❄️", "cold": "🥶", "walm": "☺️", "hot": "🥵", "humid": "💦"
  };
  return m[word] || "✨";
};

const lines = rawData.trim().split('\\n');
const result = [];
for (const line of lines) {
  const parts = line.split('\\t');
  if (parts.length < 6) continue;
  const [id, english, japanese, category, keyPhrase, page] = parts;
  const emoji = getEmoji(english);
  result.push("  { id: 'v" + id + "', english: '" + english + "', japanese: '" + japanese + "', category: '" + category + "', page: " + page + ", emoji: '" + emoji + "', keyPhrase: \\"" + keyPhrase + "\\" }");
}

const out = "export interface Vocabulary {\\n" +
  "  id: string;\\n" +
  "  english: string;\\n" +
  "  japanese: string;\\n" +
  "  category: string;\\n" +
  "  page: number;\\n" +
  "  emoji: string;\\n" +
  "  keyPhrase: string;\\n" +
  "}\\n\\n" +
  "export const vocabulary: Vocabulary[] = [\\n" +
  result.join(',\\n') +
  "\\n];\\n";

fs.writeFileSync(path.join(__dirname, '../src/data/vocabulary.ts'), out);
console.log('Vocabulary generated with', result.length, 'items.');
