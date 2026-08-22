// フォニックスの「連続子音(sm/sl…)」「連続母音(ou/au…)」タイル用に、
// 人間が録音した実在の英単語音声(Wikimedia Commons)をダウンロードして mp3 にする。
// 単音の雑な合成だと不自然なため、各グラフェムを代表する例単語の自然な肉声に置きかえる。
// 仕組み：Wikipedia API で File:En-us-<word>.ogg の実URLを取得（無ければ En-uk）。
//        実在が確認できたものだけ ffmpeg で <grapheme>.mp3 に変換して保存する（捏造なし）。
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// グラフェム -> 例単語（その音をふくむ、子どもになじみのある語。ステージのitemsに合わせた）
const MAP = {
  // マジックE（ステージ4）
  a_e: 'cake', i_e: 'bike', o_e: 'nose', u_e: 'cute', e_e: 'these',
  // 母音チーム その2（ステージ7）
  ay: 'play', ey: 'key', ie: 'pie', ow: 'snow', ue: 'blue', ui: 'juice',
  // 2文字の母音（ステージ8）
  oo: 'moon', ou: 'house', oi: 'coin', oy: 'toy', au: 'sauce', aw: 'draw',
  // 連続子音 ブレンド①（ステージ9）
  sm: 'smile', sn: 'snake', sk: 'sky', sp: 'spoon', st: 'star', sw: 'swim',
  bl: 'black', pl: 'plane', cl: 'clock', gl: 'glass', fl: 'flower', sl: 'sleep',
  // 連続子音 ブレンド②（ステージ10）
  br: 'brush', fr: 'frog', cr: 'crab', gr: 'grape', dr: 'drum', tr: 'tree',
  thr: 'three', spr: 'spring', str: 'strawberry',
};

const audioDir = path.join(__dirname, '../public/audio');
const UA = 'PhonicsAppBot/1.0 (educational; contact teacher)';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// curl でAPIを叩いてFileの実URLを取得（ブラウザUA。429対策にリトライ）
async function api(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
  for (let i = 0; i < 5; i++) {
    try {
      const out = execFileSync('curl', ['-s', '-A', BROWSER_UA, url], { encoding: 'utf8', maxBuffer: 1 << 20 });
      const pages = JSON.parse(out).query.pages;
      const p = pages[Object.keys(pages)[0]];
      return p.imageinfo && p.imageinfo[0] ? p.imageinfo[0].url : null;
    } catch (e) { await sleep(2000 * (i + 1)); }
  }
  return null;
}

// 先頭が "OggS" なら本物のOggファイル（429のHTMLエラーページを弾く）
function isOgg(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf.toString('ascii') === 'OggS';
  } catch { return false; }
}

// curl で実ファイルをDL（ブラウザUA＋Referer。429ならRetry-Afterを尊重して長めに待つ）
async function fetchBin(url, dest) {
  for (let i = 0; i < 3; i++) {
    try {
      execFileSync('curl', ['-sL', '-f', '-A', BROWSER_UA, '-e', 'https://commons.wikimedia.org/', '-o', dest, url], { stdio: 'ignore' });
      if (isOgg(dest)) return;
      throw new Error('not ogg');
    } catch (e) {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      await sleep(3000 * (i + 1));
    }
  }
  throw new Error('download failed after retries');
}

async function resolveWord(word) {
  // En-us を優先、無ければ En-uk
  for (const title of [`En-us-${word}.ogg`, `En-uk-${word}.ogg`, `En-au-${word}.ogg`]) {
    const u = await api(title);
    if (u) return { title, url: u };
  }
  return null;
}

async function run() {
  const ok = [], missing = [], skipped = [];
  for (const [g, word] of Object.entries(MAP)) {
    // 成功済み（.done マーカーあり）は再DLしない＝レート制限で中断しても続きから再開できる
    const marker = path.join(audioDir, `.done_${g}`);
    if (fs.existsSync(marker)) { skipped.push(g); continue; }
    const found = await resolveWord(word);
    if (!found) { missing.push(`${g} (${word})`); console.log(`MISSING: ${g} <- ${word}`); continue; }
    const ogg = path.join(audioDir, `_tmp_${g}.ogg`);
    const mp3 = path.join(audioDir, `${g}.mp3`);
    try {
      await fetchBin(found.url, ogg);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', ogg, '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k', mp3]);
      fs.unlinkSync(ogg);
      fs.writeFileSync(marker, found.title);
      ok.push(`${g} <- ${word} (${found.title})`);
      console.log(`OK: ${g}.mp3 <- ${found.title}`);
    } catch (e) {
      missing.push(`${g} (${word}) [convert/download error]`);
      console.log(`ERROR: ${g} <- ${word}: ${e.message}`);
      if (fs.existsSync(ogg)) fs.unlinkSync(ogg);
    }
    await sleep(4500);
  }
  console.log(`\n=== DONE: ${ok.length} ok, ${skipped.length} skipped(既済), ${missing.length} missing ===`);
  if (missing.length) console.log('MISSING/ERRORS:\n' + missing.join('\n'));
}

run();
