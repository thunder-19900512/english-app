import { useState, useCallback, useEffect, useRef } from 'react';
import { showToast } from '../components/ui/Toast';

// ブラウザの音声認識（Web Speech API＝Chromeの仕組み。Azureとは別）のエラーを、
// 子どもが次に何をすればいいか分かる言葉にする。
// ※ これまでは onerror がコンソールに出るだけで、画面には何も出なかった。
//   マイクを押しても何も起きない＝「マイクがきかない」と見えていた原因のひとつ。
export const friendlySpeechError = (code: string): string | null => {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '🔒 マイクの許可が オフになっているよ。アドレスバーの🔒→マイク→許可 にして、もう一回ためしてね';
    case 'network':
      return '📶 このネットワークでは 音声認識（Chromeのしくみ）が つかえないみたい。先生に つたえてね';
    case 'no-speech':
      return '🎙️ 声が聞こえなかったよ。マイクボタンを押してから、はっきり話してね';
    case 'audio-capture':
      return '🎙️ マイクが 見つからないよ。イヤホンマイクのさしこみを たしかめてね';
    case 'aborted':
      return null; // 自分で止めたときは何も出さない
    default:
      return `⚠️ 音声認識が うまくいかなかったよ（${code}）。もう一回ためしてね`;
  }
};

// Extend Window interface for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const resultTranscript = event.results[current][0].transcript;
      setTranscript(resultTranscript.toLowerCase().trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setError(event.error);
      setIsRecording(false);
      const msg = friendlySpeechError(String(event.error));
      if (msg) showToast(msg, 'fail');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      // Safari/古いブラウザなど、そもそも音声認識が無い
      showToast('⚠️ このブラウザでは 音声認識が つかえないよ。Chrome で ひらいてね', 'fail');
      return;
    }
    try {
      setTranscript('');
      recognitionRef.current.start();
    } catch (e) {
      // 直前の認識が終わりきっていない（InvalidStateError）ときは、いったん止めてやり直す
      console.error(e);
      try { recognitionRef.current.abort(); recognitionRef.current.start(); } catch { /* noop */ }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isRecording, transcript, error, startListening, stopListening, setTranscript };
};
