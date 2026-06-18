import { useCallback } from 'react';

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
  const fallbackSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    // Map digraphs to phonetic spellings if they are in the practice corner
    const textToSpeak = digraphMap[text] || text;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.1; 
    
    const voices = window.speechSynthesis.getVoices();
    const googleVoice = voices.find(v => v.name.includes('Google US English'));
    if (googleVoice) {
      utterance.voice = googleVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const speak = useCallback((text: string) => {
    const baseUrl = import.meta.env.BASE_URL;
    if (text.length === 1 && AUDIO_LETTERS.includes(text)) {
      const audio = new Audio(`${baseUrl}audio/${text}.ogg`);
      audio.play().catch(e => {
        console.warn('Failed to play audio file, falling back to TTS:', e);
        fallbackSpeak(text);
      });
    } else if (['sh', 'ch', 'th', 'ph', 'wh', 'ck', 'ng', 'ar', 'or', 'ir', 'air', 'ear', 'wor'].includes(text)) {
      const audio = new Audio(`${baseUrl}audio/${text}.mp3`);
      audio.play().catch(e => {
        console.warn('Failed to play audio file, falling back to TTS:', e);
        fallbackSpeak(text);
      });
    } else {
      fallbackSpeak(text);
    }
  }, []);

  return { speak };
};
