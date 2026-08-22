const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
} = require('docx');

const OUT = path.join(__dirname, 'EnglishApp_児童用_つかいかた.docx');
const FONT = 'Yu Gothic';

// A4: 11906 x 16838 DXA、余白0.6inch(864)。content幅 = 11906 - 1728 = 10178
const CONTENT = 10178;
const border = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
const borders = { top: border, bottom: border, left: border, right: border };

const cell = (text, w, opts = {}) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA },
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  margins: { top: 60, bottom: 60, left: 120, right: 120 },
  verticalAlign: VerticalAlign.CENTER,
  children: Array.isArray(text) ? text : [new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, size: opts.size || 21, color: opts.color })],
  })],
});

// 2列テーブル（名前 | せつめい）
const twoColTable = (rows, w1, headFill) => new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [w1, CONTENT - w1],
  rows: rows.map((r, i) => new TableRow({
    children: [
      cell(r[0], w1, { bold: true, fill: i === 0 ? headFill : 'F2F7FB', size: i === 0 ? 22 : 22 }),
      cell(r[1], CONTENT - w1, { fill: i === 0 ? headFill : undefined, bold: i === 0 }),
    ],
  })),
});

const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const sp = (size = 80) => new Paragraph({ spacing: { after: size }, children: [new TextRun('')] });
const bullet = (t) => new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: t, size: 21 })] });

const menu = [
  ['🔤 Phonics（フォニックス）', '音と文字のルールを学ぶよ。ぜんぶで6ステージ。'],
  ['📚 Picture Dictionary', 'たくさんの英単語をれんしゅう＆ミニゲームであそぶ。'],
  ['📖 教科書モード', '動画を見てクイズにちょうせん。さいごに「音読ボーナス」もあるよ。'],
  ['📕 おはなしづくり', 'おぼえた単語でAIが物語をつくる。できたら声に出して読もう。'],
  ['✨ AI英会話', 'AIキャラクターと、声でおしゃべりできる。'],
  ['🗣️ ダイアログ', 'ペアで話す前の会話れんしゅう。AとB、両方の役ができるよ。'],
];

const dict = [
  ['🔍 言葉さがし', 'かくれた英単語をさがそう。'],
  ['🎯 選択モード', '3つの中から正しい絵をえらぶ。'],
  ['⌨️ タイピング', '英語をキーボードで打ってみよう。'],
  ['🎤 モンスターバトル', '単語を発音してモンスターをたおす。点数が出るよ。'],
  ['💬 QAモード', '質問されたら、英語でこたえよう。'],
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: '1F6FB2' },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: '2E7D32' },
        paragraph: { spacing: { before: 120, after: 60 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '●', alignment: AlignmentType.LEFT,
      style: { run: { color: '1F6FB2' }, paragraph: { indent: { left: 420, hanging: 260 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 864, right: 864, bottom: 720, left: 864 } } },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: 'えいごアプリ「English App」の つかいかた', bold: true, size: 34, color: '1F6FB2' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
        children: [new TextRun({ text: 'まずは 自分のなまえを えらんで スタート！　たくさん声を出して れんしゅうしよう🎤', size: 20, color: '555555' })] }),

      h1('① ホームには 6つの メニュー'),
      twoColTable([['メニュー', 'できること'], ...menu], 3400, 'D5E8F0'),
      sp(),

      h1('② Picture Dictionary の あそびかた'),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '単元（カテゴリ）をえらんで、まず「学習モード」で単語をおぼえたら、ゲームにちょうせん！', size: 21 })] }),
      twoColTable([['モード', 'ないよう'], ...dict], 3400, 'E3F0E3'),
      sp(),

      h1('③ マイクで 発音チェック 🎤'),
      bullet('あおい マイクボタン を おして、英語を はっきり 言ってみよう。'),
      bullet('発音スコア（0〜100点）が 出るよ。60点いじょうで ごうかく！✅'),
      bullet('🔊ボタンで、いま録音した「自分の声」を きける。聞きくらべると上手になるよ。'),
      bullet('はじめに「マイクをつかいますか？」と出たら「許可（きょか）」をおしてね。'),
      sp(),

      h1('④ がんばりを 見える化しよう'),
      bullet('🗺️ じぶんの記録 … たっせいマップ＆発音スコアのグラフで、自分の今がわかる。'),
      bullet('⭐ 今日のふりかえり … きょう がんばったことを かこう。'),
      bullet('れんしゅうすると ポイント がたまり、バッジ や 修了証 がもらえる！'),
      sp(),

      h1('⑤ じょうずになる コツ'),
      bullet('まいかい、ひとつ「きょうの目標」をきめてスタート。'),
      bullet('発音は 何回でも れんしゅうできる。あきらめずに もう一回！'),
      bullet('ペアで話す前は「ダイアログ」で よびれんしゅう しておくと安心。'),
      bullet('おわったら ふりかえりを かいて、つぎの目標をきめよう。'),
    ],
  }],
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('SAVED', OUT); });
