#!/bin/zsh
cd "$(dirname "$0")/../public/audio"

declare -A urls
urls["a"]="https://upload.wikimedia.org/wikipedia/commons/e/e6/Near-open_front_unrounded_vowel.ogg"
urls["d"]="https://upload.wikimedia.org/wikipedia/commons/1/16/Voiced_alveolar_plosive.ogg"
urls["f"]="https://upload.wikimedia.org/wikipedia/commons/8/8f/Voiceless_labiodental_fricative.ogg"
urls["h"]="https://upload.wikimedia.org/wikipedia/commons/d/d4/Voiceless_glottal_fricative.ogg"
urls["i"]="https://upload.wikimedia.org/wikipedia/commons/2/23/Near-close_near-front_unrounded_vowel.ogg"
urls["j"]="https://upload.wikimedia.org/wikipedia/commons/c/ce/Voiced_palato-alveolar_affricate.ogg"
urls["l"]="https://upload.wikimedia.org/wikipedia/commons/c/cf/Alveolar_lateral_approximant.ogg"
urls["m"]="https://upload.wikimedia.org/wikipedia/commons/e/e0/Bilabial_nasal.ogg"
urls["n"]="https://upload.wikimedia.org/wikipedia/commons/0/00/Alveolar_nasal.ogg"
urls["o"]="https://upload.wikimedia.org/wikipedia/commons/7/7b/Open_back_unrounded_vowel.ogg"
urls["p"]="https://upload.wikimedia.org/wikipedia/commons/6/6f/Voiceless_bilabial_plosive.ogg"
urls["r"]="https://upload.wikimedia.org/wikipedia/commons/1/1f/Alveolar_approximant.ogg"
urls["s"]="https://upload.wikimedia.org/wikipedia/commons/d/d1/Voiceless_alveolar_sibilant.ogg"
urls["t"]="https://upload.wikimedia.org/wikipedia/commons/0/02/Voiceless_alveolar_plosive.ogg"
urls["u"]="https://upload.wikimedia.org/wikipedia/commons/8/87/Open-mid_back_unrounded_vowel.ogg"
urls["v"]="https://upload.wikimedia.org/wikipedia/commons/9/90/Voiced_labiodental_fricative.ogg"
urls["w"]="https://upload.wikimedia.org/wikipedia/commons/1/18/Voiced_labio-velar_approximant.ogg"
urls["y"]="https://upload.wikimedia.org/wikipedia/commons/0/05/Palatal_approximant.ogg"
urls["z"]="https://upload.wikimedia.org/wikipedia/commons/c/c0/Voiced_alveolar_sibilant.ogg"
urls["ee"]="https://upload.wikimedia.org/wikipedia/commons/f/fc/Close_front_unrounded_vowel.ogg"
urls["ea"]="https://upload.wikimedia.org/wikipedia/commons/f/fc/Close_front_unrounded_vowel.ogg"
urls["oo"]="https://upload.wikimedia.org/wikipedia/commons/5/5a/Close_back_rounded_vowel.ogg"
urls["a_e"]="https://upload.wikimedia.org/wikipedia/commons/6/6b/Close-mid_front_unrounded_vowel.ogg"
urls["ai"]="https://upload.wikimedia.org/wikipedia/commons/6/6b/Close-mid_front_unrounded_vowel.ogg"
urls["ay"]="https://upload.wikimedia.org/wikipedia/commons/6/6b/Close-mid_front_unrounded_vowel.ogg"
urls["o_e"]="https://upload.wikimedia.org/wikipedia/commons/8/84/Close-mid_back_rounded_vowel.ogg"
urls["oa"]="https://upload.wikimedia.org/wikipedia/commons/8/84/Close-mid_back_rounded_vowel.ogg"
urls["ow"]="https://upload.wikimedia.org/wikipedia/commons/8/84/Close-mid_back_rounded_vowel.ogg"

for key in "${!urls[@]}"; do
  url="${urls[$key]}"
  if [ ! -f "${key}.mp3" ] || [ ! -s "${key}.mp3" ]; then
    echo "Downloading ${key} from ${url}"
    curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" -o "${key}.ogg" "$url"
    ffmpeg -y -v error -i "${key}.ogg" -vn -ar 44100 -ac 2 -b:a 192k "${key}.mp3"
    rm -f "${key}.ogg"
    sleep 1
  else
    echo "Skipping ${key}.mp3 (already exists)"
  fi
done
echo "Done!"
