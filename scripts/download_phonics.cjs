const https = require('https');
const fs = require('fs');
const path = require('path');

const map = {
  'A': 'Near-open_front_unrounded_vowel.ogg',
  'B': 'Voiced_bilabial_plosive.ogg',
  'C': 'Voiceless_velar_plosive.ogg',
  'F': 'Voiceless_labiodental_fricative.ogg',
  'L': 'Alveolar_lateral_approximant.ogg',
  'M': 'Bilabial_nasal.ogg',
  'N': 'Alveolar_nasal.ogg',
  'R': 'Alveolar_approximant.ogg',
  'S': 'Voiceless_alveolar_fricative.ogg',
  'V': 'Voiced_labiodental_fricative.ogg'
};

const audioDir = path.join(__dirname, '../public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

async function fetchUrl(title) {
  return new Promise((resolve, reject) => {
    const api = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${title}&prop=imageinfo&iiprop=url&format=json`;
    const options = { headers: { 'User-Agent': 'PhonicsAppBot/1.0' } };
    https.get(api, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          const info = pages[pageId].imageinfo;
          if (info && info.length > 0) {
            resolve(info[0].url);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = { headers: { 'User-Agent': 'PhonicsAppBot/1.0' } };
    https.get(url, options, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  for (const [letter, title] of Object.entries(map)) {
    console.log(`Fetching URL for ${letter}...`);
    try {
      const url = await fetchUrl(title);
      if (url) {
        console.log(`Downloading ${letter} from ${url}...`);
        const dest = path.join(audioDir, `${letter}.ogg`);
        await download(url, dest);
        console.log(`Saved ${letter}.ogg`);
      } else {
        console.log(`Could not find URL for ${title}`);
      }
    } catch (e) {
      console.error(`Error processing ${letter}:`, e);
    }
  }
}

run();
