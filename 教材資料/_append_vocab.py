# -*- coding: utf-8 -*-
# 写真(PictureDictionary)から抜き出した単語を vocabulary.ts に追記する。
import os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOCAB = os.path.join(BASE, 'src/data/vocabulary.ts')

# (category, page, keyPhrase, [(english, japanese, emoji), ...])
DATA = [
 ('スポーツ', 11, "I like ◯◯.", [
   ('baseball','野球','⚾'),('soccer','サッカー','⚽'),('basketball','バスケットボール','🏀'),
   ('tennis','テニス','🎾'),('volleyball','バレーボール','🏐'),('dodgeball','ドッジボール','🤾'),
   ('table tennis','卓球','🏓'),('judo','柔道','🥋'),('kendo','剣道','🤺'),('badminton','バドミントン','🏸'),
   ('cricket','クリケット','🏏'),('rugby','ラグビー','🏉'),('sumo','すもう','🤼'),('swimming','水泳','🏊'),
   ('gymnastics','体操','🤸'),('track and field','陸上','🏃'),('skateboarding','スケートボード','🛹'),('skiing','スキー','⛷️'),
 ]),
 ('動物', 16, "I like ◯◯.", [
   ('bear','くま','🐻'),('elephant','ぞう','🐘'),('tiger','とら','🐯'),('lion','ライオン','🦁'),
   ('horse','うま','🐴'),('monkey','さる','🐵'),('zebra','しまうま','🦓'),('camel','らくだ','🐫'),
   ('giraffe','きりん','🦒'),('gorilla','ゴリラ','🦍'),('deer','しか','🦌'),('orangutan','オランウータン','🦧'),
   ('panda','パンダ','🐼'),('koala','コアラ','🐨'),('fox','きつね','🦊'),('rabbit','うさぎ','🐰'),
   ('mouse','ねずみ','🐭'),('dog','いぬ','🐶'),('cat','ねこ','🐱'),('frog','かえる','🐸'),
   ('bird','とり','🐦'),('crocodile','ワニ','🐊'),('snake','へび','🐍'),
 ]),
 ('自然', 16, "I like ◯◯.", [
   ('river','川','🏞️'),('desert','さばく','🏜️'),('savanna','サバンナ','🦒'),('forest','森','🌳'),
   ('rainforest','熱帯雨林','🌴'),('sea','海','🌊'),('lake','湖','🏞️'),('mountain','山','⛰️'),
 ]),
 ('海の生き物', 17, "I like ◯◯.", [
   ('whale','クジラ','🐋'),('shark','サメ','🦈'),('dolphin','イルカ','🐬'),('penguin','ペンギン','🐧'),
   ('crab','カニ','🦀'),('jellyfish','クラゲ','🪼'),('sea turtle','ウミガメ','🐢'),('fish','さかな','🐟'),
 ]),
 ('虫', 17, "I like ◯◯.", [
   ('grasshopper','バッタ','🦗'),('ant','アリ','🐜'),('beetle','カブトムシ','🪲'),('stag beetle','クワガタ','🪲'),
   ('butterfly','チョウ','🦋'),('mantis','カマキリ','🦗'),('spider','クモ','🕷️'),('dragonfly','トンボ','🪰'),
 ]),
 ('性格', 20, "He is ◯◯.", [
   ('active','活発な','🤸'),('shy','はずかしがりの','😳'),('smart','かしこい','🤓'),('brave','ゆうかんな','🦸'),
   ('strong','つよい','💪'),('friendly','フレンドリーな','🤝'),('funny','おもしろい','😄'),('kind','やさしい','💗'),
 ]),
 ('人', 20, "This is ◯◯.", [
   ('man','男の人','👨'),('woman','女の人','👩'),('baby','赤ちゃん','👶'),('boy','男の子','👦'),
   ('girl','女の子','👧'),('child','子ども','🧒'),('friend','友だち','👫'),('classmate','クラスメイト','🧑‍🤝‍🧑'),
 ]),
 ('家族', 21, "This is my ◯◯.", [
   ('grandfather','おじいさん','👴'),('grandmother','おばあさん','👵'),('father','お父さん','👨'),('mother','お母さん','👩'),
   ('parents','両親','👪'),('grandparents','祖父母','👴'),('brother','兄弟','👦'),('sister','姉妹','👧'),
   ('cousin','いとこ','🧒'),('uncle','おじ','👨'),('aunt','おば','👩'),
 ]),
 ('一日の生活', 24, "I ◯◯.", [
   ('get up','起きる','⏰'),('comb my hair','髪をとかす','💇'),('take out the garbage','ゴミを出す','🗑️'),
   ('get the newspaper','新聞を取る','📰'),('have breakfast','朝食を食べる','🍳'),('brush my teeth','歯をみがく','🪥'),
   ('go to school','学校へ行く','🏫'),('study English','英語を勉強する','📖'),('have lunch','昼食を食べる','🍱'),
   ('go home','家に帰る','🏠'),('do my homework','宿題をする','📝'),('have dinner','夕食を食べる','🍽️'),
   ('wash the dishes','皿を洗う','🍽️'),('watch TV','テレビを見る','📺'),('take a bath','お風呂に入る','🛁'),('go to bed','寝る','🛏️'),
 ]),
 ('衣類', 25, "This is my ◯◯.", [
   ('shirt','シャツ','👔'),('T-shirt','Tシャツ','👕'),('sweatshirt','トレーナー','👚'),('sweater','セーター','🧥'),
   ('uniform','制服','👔'),('pants','ズボン','👖'),('jeans','ジーンズ','👖'),('cap','ぼうし','🧢'),
   ('hat','ぼうし','👒'),('gloves','手ぶくろ','🧤'),('socks','くつ下','🧦'),('shoes','くつ','👟'),
 ]),
 ('からだ', 25, "This is my ◯◯.", [
   ('hair','かみの毛','💇'),('head','頭','🧠'),('face','顔','😊'),('shoulder','かた','🙆'),('hand','手','✋'),
   ('arm','うで','💪'),('knee','ひざ','🦵'),('eye','目','👁️'),('ear','耳','👂'),('nose','鼻','👃'),
   ('mouth','口','👄'),('teeth','歯','🦷'),('neck','首','🧣'),('leg','足','🦵'),('toe','つま先','🦶'),
 ]),
 ('学校', 28, "I like the ◯◯.", [
   ('classroom','教室','🏫'),('computer room','コンピュータ室','💻'),('entrance','げんかん','🚪'),('gym','体育館','🤸'),
   ('library','図書室','📚'),('music room','音楽室','🎵'),('playground','校庭','🏃'),("school nurse's office",'保健室','🏥'),
   ('restroom','トイレ','🚻'),('swimming pool','プール','🏊'),("teachers' office",'職員室','🧑‍🏫'),("school principal's office",'校長室','🧑‍💼'),
 ]),
 ('文房具', 29, "I want a new ◯◯.", [
   ('crayon','クレヨン','🖍️'),('marker','マーカー','🖊️'),('pen','ペン','🖊️'),('pencil','えんぴつ','✏️'),
   ('pencil case','筆箱','🎒'),('eraser','消しゴム','🧽'),('ruler','じょうぎ','📏'),('glue','のり','🩹'),
   ('scissors','はさみ','✂️'),('stapler','ホチキス','📎'),('notebook','ノート','📓'),('pencil sharpener','えんぴつけずり','✏️'),
 ]),
 ('楽器', 29, "I can play the ◯◯.", [
   ('recorder','リコーダー','🎶'),('harmonica','ハーモニカ','🎶'),('triangle','トライアングル','📐'),('piano','ピアノ','🎹'),
   ('guitar','ギター','🎸'),('violin','バイオリン','🎻'),('drum','ドラム','🥁'),('xylophone','もっきん','🎵'),('keyboard harmonica','けんばんハーモニカ','🎹'),
 ]),
 ('身の回りのもの', 30, "I want a new ◯◯.", [
   ('bag','かばん','👜'),('bat','バット','🏏'),('glove','グローブ','🥎'),('racket','ラケット','🎾'),
   ('soccer shoes','サッカーシューズ','👟'),('umbrella','かさ','☂️'),('glass','コップ','🥛'),('mug','マグカップ','☕'),
   ('textbook','教科書','📖'),('comic book','まんが','📚'),('dictionary','辞書','📕'),('present','プレゼント','🎁'),
   ('treasure','たから物','💎'),('sticker','シール','⭐'),('ticket','チケット','🎫'),('watch','うで時計','⌚'),
   ('TV','テレビ','📺'),('computer','コンピュータ','💻'),('smartphone','スマートフォン','📱'),('tablet','タブレット','📲'),
   ('desk','つくえ','🪑'),('chair','いす','🪑'),('bed','ベッド','🛏️'),
 ]),
 ('遊びなど', 31, "I like ◯◯.", [
   ('camping','キャンプ','🏕️'),('dancing','ダンス','💃'),('fishing','つり','🎣'),('hiking','ハイキング','🥾'),
   ('shopping','買い物','🛍️'),('reading','読書','📖'),('drawing','絵をかくこと','🎨'),('jogging','ジョギング','🏃'),
   ('swinging','ブランコ','🛝'),('playing the piano','ピアノをひくこと','🎹'),('playing video games','ゲームをすること','🎮'),
   ('seeing movies','映画を見ること','🎬'),('cards','トランプ','🃏'),('jump rope','なわとび','🪢'),('tag','おにごっこ','🏃'),
   ('hide-and-seek','かくれんぼ','🙈'),('rock-paper-scissors','じゃんけん','✊'),
 ]),
 ('学校行事', 32, "I like the ◯◯.", [
   ('field trip','遠足','🚌'),('school trip','修学旅行','🧳'),('chorus contest','合唱コンクール','🎤'),('volunteer day','ボランティアの日','🤝'),
   ('drama festival','劇の発表会','🎭'),('music festival','音楽会','🎵'),('school festival','学園祭','🎪'),('sports day','運動会','🏃'),
   ('evacuation drill','ひなん訓練','🚨'),('swimming meet','水泳大会','🏊'),('summer vacation','夏休み','🏖️'),('memory','思い出','💭'),
   ('entrance ceremony','入学式','🎓'),('graduation ceremony','卒業式','🎓'),
 ]),
 ('年中行事', 32, "I like ◯◯.", [
   ('birthday','誕生日','🎂'),("New Year's Day",'元日','🎍'),("Dolls' Festival",'ひな祭り','🎎'),('cherry blossom viewing','お花見','🌸'),
   ("Children's Day",'こどもの日','🎏'),('Star Festival','七夕','🎋'),('fireworks festival','花火大会','🎆'),('Halloween','ハロウィン','🎃'),
   ('Christmas','クリスマス','🎄'),("New Year's Eve",'大みそか','🔔'),
 ]),
 ('感想・様子', 33, "It's ◯◯.", [
   ('good','よい','👍'),('great','すばらしい','🌟'),('bad','わるい','👎'),('nice','すてきな','😊'),('amazing','おどろくべき','🤩'),
   ('fantastic','すごくよい','✨'),('wonderful','すばらしい','🌟'),('beautiful','美しい','🌷'),('cool','かっこいい','😎'),('cute','かわいい','🥰'),
   ('favorite','お気に入りの','❤️'),('interesting','おもしろい','🤔'),('exciting','わくわくする','🎉'),('famous','有名な','🌟'),('popular','人気の','👍'),
   ('colorful','カラフルな','🌈'),('international','国際的な','🌍'),('fun','楽しい','😆'),
 ]),
 ('状態', 33, "It's ◯◯.", [
   ('big','大きい','🐘'),('small','小さい','🐭'),('long','長い','📏'),('short','短い','📏'),('new','新しい','✨'),
   ('old','古い','📦'),('fast','速い','💨'),('slow','おそい','🐌'),('high','高い','⛰️'),('low','低い','🔽'),
 ]),
 ('職業', 34, "I want to be ◯◯.", [
   ('artist','芸術家','🎨'),('writer','作家','✍️'),('singer','歌手','🎤'),('comedian','お笑い芸人','🤣'),('doctor','医者','👨‍⚕️'),
   ('nurse','看護師','👩‍⚕️'),('vet','獣医','🐶'),('zookeeper','飼育員','🦁'),('cook','料理人','👨‍🍳'),('baker','パン職人','🥖'),
   ('farmer','農家','👨‍🌾'),('police officer','警察官','👮'),('fire fighter','消防士','🧑‍🚒'),('pilot','パイロット','👨‍✈️'),('programmer','プログラマー','👨‍💻'),
   ('office worker','会社員','💼'),('astronaut','宇宙飛行士','👨‍🚀'),('teacher','先生','👩‍🏫'),('researcher','研究者','🔬'),('scientist','科学者','👨‍🔬'),
   ('flight attendant','客室乗務員','✈️'),('baseball player','野球選手','⚾'),('mountaineer','登山家','🧗'),
 ]),
 ('部活動', 35, "I want to join the ◯◯.", [
   ('baseball team','野球部','⚾'),('softball team','ソフトボール部','🥎'),('basketball team','バスケ部','🏀'),('volleyball team','バレー部','🏐'),
   ('soccer team','サッカー部','⚽'),('tennis team','テニス部','🎾'),('table tennis team','卓球部','🏓'),('badminton team','バドミントン部','🏸'),
   ('dance team','ダンス部','💃'),('track and field team','陸上部','🏃'),('art club','美術部','🎨'),('cooking club','料理部','🍳'),
   ('drama club','演劇部','🎭'),('brass band','吹奏楽部','🎺'),('chorus','合唱部','🎤'),('broadcasting club','放送部','📻'),
   ('newspaper club','新聞部','📰'),('photography club','写真部','📷'),
 ]),
]

content = open(VOCAB, encoding='utf-8').read()

# 既存の最大IDを求める
ids = [int(m) for m in re.findall(r"id:\s*'v(\d+)'", content)]
nid = max(ids) + 1

def q(s):  # シングルクォート文字列用にエスケープ
    return s.replace("\\", "\\\\").replace("'", "\\'")

lines = []
for cat, page, kp, items in DATA:
    for en, ja, emoji in items:
        lines.append(
            f"  {{ id: 'v{nid}', english: '{q(en)}', japanese: '{q(ja)}', category: '{q(cat)}', page: {page}, emoji: '{emoji}', keyPhrase: \"{kp}\" }}"
        )
        nid += 1

block = ',\n'.join(lines)

# 末尾の `}\n];` を `},\n<block>\n];` に置換（最後の要素にカンマを足す）
assert content.rstrip().endswith('}\n];') or content.rstrip().endswith('}];') or '}\n];' in content
content = content.rstrip()
idx = content.rfind('}\n];')
content = content[:idx] + '},\n' + block + '\n];\n'

open(VOCAB, 'w', encoding='utf-8').write(content)
print('added', len(lines), 'words. next id would be v' + str(nid))
