const https = require('https');
const fs = require('fs');
const path = require('path');

const map = {
  'sh': 'Voiceless_postalveolar_fricative.ogg',
  'ch': 'Voiceless_postalveolar_affricate.ogg',
  'th': 'Voiceless_dental_fricative.ogg'
};

const audioDir = path.join(__dirname, '../public/audio');

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
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
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
  for (const [digraph, title] of Object.entries(map)) {
    console.log(`Fetching URL for ${digraph}...`);
    try {
      const url = await fetchUrl(title);
      if (url) {
        console.log(`Downloading ${digraph} from ${url}...`);
        const dest = path.join(audioDir, `${digraph}.ogg`);
        await download(url, dest);
        console.log(`Saved ${digraph}.ogg`);
      } else {
        console.log(`Could not find URL for ${title}`);
      }
    } catch (e) {
      console.error(`Error processing ${digraph}:`, e);
    }
  }
}

run();
