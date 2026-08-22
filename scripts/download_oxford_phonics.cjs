const https = require('https');
const fs = require('fs');
const path = require('path');

const map = {
  'sh': 'ʃ_isolation.mp3',
  'ch': 'tʃ_isolation.mp3',
  'th': 'θ_isolation.mp3',
  'ng': 'ŋ_isolation.mp3',
  'ph': 'f_isolation.mp3',
  'wh': 'w_isolation.mp3',
  'ck': 'k_isolation.mp3'
};

const audioDir = path.join(__dirname, '../public/audio');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      } else {
        reject(`Failed to download: ${response.statusCode}`);
      }
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  for (const [digraph, filename] of Object.entries(map)) {
    const url = `https://raw.githubusercontent.com/xiaozhah/phoneme_audio/main/audio/${encodeURIComponent(filename)}`;
    const dest = path.join(audioDir, `${digraph}.mp3`);
    console.log(`Downloading ${digraph}.mp3 from ${url}...`);
    try {
      await download(url, dest);
      console.log(`Successfully saved ${digraph}.mp3`);
    } catch (e) {
      console.error(`Error downloading ${digraph}:`, e);
    }
  }
}

run();
