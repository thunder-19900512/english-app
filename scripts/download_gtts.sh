#!/bin/bash
cd public/audio

curl -s "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=shhh&tl=en" -o sh.mp3
curl -s "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=chuh&tl=en" -o ch.mp3
curl -s "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=thhh&tl=en" -o th.mp3
curl -s "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=fff&tl=en" -o ph.mp3
curl -s "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=wuh&tl=en" -o wh.mp3
curl -s "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=kuh&tl=en" -o ck.mp3
curl -s "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=ing&tl=en" -o ng.mp3
curl -s "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=kwuh&tl=en" -o qu.mp3

rm -f sh.m4a ch.m4a th.m4a st.m4a sh_test.mp3
