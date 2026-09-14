import { useState, useCallback, useEffect, useRef } from 'react';
import { showToast } from '../components/ui/Toast';
import { logVoiceEvent } from '../lib/voiceLog';

// ブラウザの音声認識（Web Speech API＝Chromeの仕組み。Azureとは別）のエラーを、
// 子どもが次に何をすればいいか分かる言葉にする。
// ※ これまでは onerror がコンソールに出るだけで、画面には何も出なかった。
//   マイクを押しても何も起きない＝「マイクがきかない」と見えていた原因のひとつ。
// マイク許可の直し方は端末で違う（パソコンのChromeにはアドレスバーの🔒があるが、
// iPadではブラウザの中に切り替えが無く「設定」アプリ側で許可する）。子どもの声 2026-09-13。
export const micPermissionHelp = (): string => {
  const ua = navigator.userAgent;
  const isIPad = /iPad|iPhone/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIPad) {
    const app = /CriOS/.test(ua) ? 'Chrome' : 'Safari';
    return `🔒 マイクの許可が オフになっているよ。iPadの「設定」→「${app}」→「マイク」を オンにしてから、このページを開き直してね`;
  }
  if (/Android/.test(ua)) {
    return '🔒 マイクの許可が オフになっているよ。アドレスバーの左のマーク→「権限」→「マイク」を 許可にして、もう一度試してね';
  }
  return '🔒 マイクの許可が オフになっているよ。アドレスバーの左の🔒（または ⚙）→「マイク」→「許可」にして、ページを開き直してね';
};

export const friendlySpeechError = (code: string): string | null => {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return micPermissionHelp();
    case 'network':
      return '📶 このネットワークでは 音声認識（Chromeの仕組み）が 使えないみたい。先生に 伝えてね';
    case 'no-speech':
      return '🎙️ 声が聞こえなかったよ。マイクボタンを押してから、はっきり話してね';
    case 'audio-capture':
      return '🎙️ マイクが 見つからないよ。イヤホンマイクのさしこみを 確かめてね';
    case 'aborted':
      return null; // 自分で止めたときは何も出さない
    default:
      return `⚠️ 音声認識が うまくいかなかったよ（${code}）。もう一度試してね`;
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
      if (event.results[current].isFinal) logVoiceEvent({ kind: 'chrome', ok: true });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setError(event.error);
      setIsRecording(false);
      const msg = friendlySpeechError(String(event.error));
      if (msg) showToast(msg, 'fail');
      if (event.error !== 'aborted') logVoiceEvent({ kind: 'chrome', ok: false, code: String(event.error) });
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
      showToast('⚠️ このブラウザでは 音声認識が 使えないよ。Chrome で 開いてね', 'fail');
      logVoiceEvent({ kind: 'chrome', ok: false, code: 'unsupported' });
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
