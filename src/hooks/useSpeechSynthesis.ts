import { useCallback } from 'react';
import { getPreferredVoice } from '../lib/voice';

const AUDIO_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const digraphMap: Record<string, string> = {
  'sh': 'shhh',
  'ch': 'chuh',
  'th': 'thhh',
  'st': 'st',
  'ai': 'A',
  'ea': 'ee',
  'ee': 'ee',
  'oa': 'oh'
};

export const useSpeechSynthesis = () => {
  // onEnd: 読み上げ/再生が「最後まで」終わったときに呼ばれる。
  // 途中で次の音にキャンセルされた場合も end が発火しうるので、呼び出し側で
  // 「今アクティブな単語か」をチェックして連打を弾く想定。
  const fallbackSpeak = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this browser.');
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    // Map digraphs to phonetic spellings if they are in the practice corner
    const textToSpeak = digraphMap[text] || text;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.1;

    // クリアな英語ボイスに固定（無ければ既定）
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;

    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
  };

  const speak = useCallback((text: string, onEnd?: () => void) => {
    const baseUrl = import.meta.env.BASE_URL;
    if (text.length === 1 && AUDIO_LETTERS.includes(text)) {
      const audio = new Audio(`${baseUrl}audio/${text}.ogg`);
      if (onEnd) audio.onended = onEnd;
      audio.play().catch(e => {
        console.warn('Failed to play audio file, falling back to TTS:', e);
        fallbackSpeak(text, onEnd);
      });
    } else if (['sh', 'ch', 'th', 'ph', 'wh', 'ck', 'ng', 'ar', 'or', 'ir', 'air', 'ear', 'wor'].includes(text)) {
      const audio = new Audio(`${baseUrl}audio/${text}.mp3`);
      if (onEnd) audio.onended = onEnd;
      audio.play().catch(e => {
        console.warn('Failed to play audio file, falling back to TTS:', e);
        fallbackSpeak(text, onEnd);
      });
    } else {
      fallbackSpeak(text, onEnd);
    }
  }, []);

  return { speak };
};
