const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const path = require('path');

const WIKI_AUDIO_MAP = {
  // Consonants
  'b': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Voiced_bilabial_plosive.ogg',
  'c': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Voiceless_velar_plosive.ogg',
  'k': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Voiceless_velar_plosive.ogg',
  'ck': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Voiceless_velar_plosive.ogg',
  'd': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Voiced_alveolar_plosive.ogg',
  'f': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Voiceless_labiodental_fricative.ogg',
  'g': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Voiced_velar_plosive_02.ogg',
  'h': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Voiceless_glottal_fricative.ogg',
  'j': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Voiced_palato-alveolar_affricate.ogg',
  'l': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Alveolar_lateral_approximant.ogg',
  'm': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bilabial_nasal.ogg',
  'n': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Alveolar_nasal.ogg',
  'p': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Voiceless_bilabial_plosive.ogg',
  'qu': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Voiceless_velar_plosive.ogg',
  'r': 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Alveolar_approximant.ogg',
  's': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Voiceless_alveolar_sibilant.ogg',
  't': 'https://upload.wikimedia.org/wikipedia/commons/0/02/Voiceless_alveolar_plosive.ogg',
  'v': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Voiced_labiodental_fricative.ogg',
  'w': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Voiced_labio-velar_approximant.ogg',
  'x': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Voiceless_velar_plosive.ogg',
  'y': 'https://upload.wikimedia.org/wikipedia/commons/0/05/Palatal_approximant.ogg',
  'z': 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Voiced_alveolar_sibilant.ogg',
  
  // Digraphs
  'sh': 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Voiceless_palato-alveolar_fricative.ogg',
  'ch': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Voiceless_palato-alveolar_affricate.ogg',
  'th': 'https://upload.wikimedia.org/wikipedia/commons/8/80/Voiceless_dental_fricative.ogg',
  'ph': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Voiceless_labiodental_fricative.ogg',
  'wh': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Voiced_labio-velar_approximant.ogg',
  'ng': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Velar_nasal.ogg',

  // Short Vowels
  'a': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Near-open_front_unrounded_vowel.ogg',
  'e': 'https://upload.wikimedia.org/wikipedia/commons/7/71/Open-mid_front_unrounded_vowel.ogg',
  'i': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Near-close_near-front_unrounded_vowel.ogg',
  'o': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Open_back_unrounded_vowel.ogg',
  'u': 'https://upload.wikimedia.org/wikipedia/commons/8/87/Open-mid_back_unrounded_vowel.ogg',

  // Long Vowels / Magic E
  'ee': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Close_front_unrounded_vowel.ogg',
  'ea': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Close_front_unrounded_vowel.ogg',
  'oo': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Close_back_rounded_vowel.ogg',
  'a_e': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Close-mid_front_unrounded_vowel.ogg',
  'ai': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Close-mid_front_unrounded_vowel.ogg',
  'ay': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Close-mid_front_unrounded_vowel.ogg',
  'o_e': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Close-mid_back_rounded_vowel.ogg',
  'oa': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Close-mid_back_rounded_vowel.ogg',
  'ow': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Close-mid_back_rounded_vowel.ogg',
};

const outputDir = path.join(__dirname, '../public/audio');

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'EnglishAppBot/1.0 (https://github.com/thunder-19900512/english-app)'
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        // handle redirects manually or just fail
        if (response.statusCode === 301 || response.statusCode === 302) {
          https.get(response.headers.location, options, (res) => {
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
          });
        } else {
          reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
        }
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err.message));
    });
  });
};

const convertToMp3 = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    exec(`ffmpeg -y -i "${inputPath}" -vn -ar 44100 -ac 2 -b:a 192k "${outputPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.warn(stderr);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const main = async () => {
  for (const [key, url] of Object.entries(WIKI_AUDIO_MAP)) {
    const oggPath = path.join(outputDir, `${key}.ogg`);
    const mp3Path = path.join(outputDir, `${key}.mp3`);
    
    // Only download if mp3 doesn't exist yet
    if (fs.existsSync(mp3Path)) {
      console.log(`[SKIPPING] ${key}.mp3 already exists`);
      continue;
    }
    
    console.log(`[DOWNLOADING] ${key} from ${url}...`);
    try {
      await downloadFile(url, oggPath);
      console.log(`[CONVERTING] ${key}.ogg -> ${key}.mp3...`);
      await convertToMp3(oggPath, mp3Path);
      fs.unlinkSync(oggPath); // cleanup
      console.log(`[SUCCESS] ${key}.mp3`);
    } catch (err) {
      console.error(`[ERROR] Failed to process ${key}:`, err);
    }
    
    // Wait 1.5 seconds between downloads to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log("All audio processing complete.");
};

main();
