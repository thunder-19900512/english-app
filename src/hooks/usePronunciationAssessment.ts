import { useState, useCallback, useRef, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { isOverCap, incUsage } from '../lib/apiUsage';

export interface WordScore {
  word: string;
  accuracyScore: number;
  errorType: string;
}

export interface PronunciationResult {
  recognizedText: string;
  accuracyScore: number;      // 発音の正確さ (0-100)
  pronunciationScore: number; // 総合スコア (0-100)
  fluencyScore: number;       // なめらかさ
  completenessScore: number;  // 言い切れたか
  words: WordScore[];
}

// Float32(-1〜1) の音声サンプルを 16bit PCM (リトルエンディアン) に変換する。
const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
};

// 16kHz mono の 16bit PCM チャンクをまとめて、再生できる WAV(Blob) にする。
const encodeWav = (chunks: Float32Array[], sampleRate: number): Blob => {
  let length = 0;
  for (const c of chunks) length += c.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (const c of chunks) {
    for (let i = 0; i < c.length; i++) {
      const s = Math.max(-1, Math.min(1, c[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
};

// マイクのサンプルレート（48000等）を Azure が要求する 16000Hz に落とす。
const downsample = (buffer: Float32Array, inRate: number, outRate: number): Float32Array => {
  if (outRate >= inRate) return buffer;
  const ratio = inRate / outRate;
  const newLen = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLen);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < newLen) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
};

/**
 * Azure Pronunciation Assessment hook.
 *
 * マイクは getUserMedia で「1回だけ」取得して保持し、WebAudio で 16kHz PCM に変換して
 * Azure の PushStream に流し込む。SDK 任せの fromDefaultMicrophoneInput だと、Chrome で
 * 2回目以降の録音が空（NoMatch）になる不具合があったため、自前で録音を握る方式にしている。
 *
 * The subscription key is used directly in the browser (fromSubscription); it is
 * loaded from app settings (Supabase) and never committed to the repository.
 */
export const usePronunciationAssessment = (
  key: string | null,
  region: string | null
) => {
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  // 録音中だけ、ここに今回の PushStream を入れる。processor はこれがある時だけ書き込む。
  const activePushRef = useRef<SpeechSDK.PushAudioInputStream | null>(null);
  // 録音再生用に、流し込んだのと同じ 16kHz PCM を溜めておく。
  const recordedChunksRef = useRef<Float32Array[]>([]);

  const isAvailable = !!(key && region);

  // マイク＋WebAudio のパイプラインを一度だけ用意する（クリック起点で呼ぶ）。
  const ensurePipeline = useCallback(async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      return;
    }
    // 教室の雑音対策：ノイズ抑制・エコー除去・自動ゲインをON。
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    });
    mediaStreamRef.current = stream;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      const push = activePushRef.current;
      if (!push) return;
      const input = e.inputBuffer.getChannelData(0);
      const down = downsample(input, ctx.sampleRate, 16000);
      push.write(floatTo16BitPCM(down));
      recordedChunksRef.current.push(down); // 再生用に同じ音を控えておく
    };

    // 出力は無音にしてマイクの音がスピーカーに回り込まないようにする。
    const muteGain = ctx.createGain();
    muteGain.gain.value = 0;

    source.connect(processor);
    processor.connect(muteGain);
    muteGain.connect(ctx.destination);
  }, []);

  // アンマウント時にマイクとオーディオを片付ける。
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      mediaStreamRef.current = null;
    };
  }, []);

  const assess = useCallback(
    async (referenceText: string): Promise<PronunciationResult | null> => {
      if (!key || !region) {
        setError('Azure Speech is not configured');
        return null;
      }

      // 1日の発音チェック上限に達していたら、Azureを呼ばずに止める（課金の安全装置）。
      if (isOverCap('azure')) {
        setError('今日の発音チェックは上限に達したよ。また明日ためしてね！');
        return null;
      }

      setError(null);
      setIsAssessing(true);

      try {
        await ensurePipeline();
      } catch (e) {
        setIsAssessing(false);
        setError('マイクを使えませんでした。ブラウザのマイク許可を確認してね');
        return null;
      }

      return new Promise((resolve) => {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        speechConfig.setProperty(
          SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
          '15000'
        );
        speechConfig.setProperty(
          SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
          '1500'
        );

        const format = SpeechSDK.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
        const pushStream = SpeechSDK.AudioInputStream.createPushStream(format);
        const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

        const paConfig = new SpeechSDK.PronunciationAssessmentConfig(
          referenceText,
          SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
          SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
          true // enableMiscue
        );
        paConfig.applyTo(recognizer);

        // ここから processor の音声が pushStream に流れ込む。録音バッファもリセット。
        recordedChunksRef.current = [];
        activePushRef.current = pushStream;

        const finish = (value: PronunciationResult | null) => {
          activePushRef.current = null;
          // 今回マイクから拾った音を WAV にして、再生できるようにする。
          const chunks = recordedChunksRef.current;
          recordedChunksRef.current = [];
          if (chunks.length > 0) {
            setLastRecordingUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return URL.createObjectURL(encodeWav(chunks, 16000));
            });
          }
          try {
            pushStream.close();
          } catch {
            /* noop */
          }
          recognizer.close();
          setIsAssessing(false);
          resolve(value);
        };

        incUsage('azure'); // ここでAzureを実際に呼ぶので1回ぶん計上する
        recognizer.recognizeOnceAsync(
          (result) => {
            try {
              if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                const pa = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
                const detail: any = pa.detailResult || {};
                const words: WordScore[] = (detail.Words || []).map((w: any) => ({
                  word: w.Word,
                  accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
                  errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
                }));
                finish({
                  recognizedText: result.text || '',
                  accuracyScore: pa.accuracyScore,
                  pronunciationScore: pa.pronunciationScore,
                  fluencyScore: pa.fluencyScore,
                  completenessScore: pa.completenessScore,
                  words,
                });
              } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
                const cancel = SpeechSDK.CancellationDetails.fromResult(result);
                setError(
                  `${SpeechSDK.CancellationReason[cancel.reason]}: ${cancel.errorDetails || 'キー/リージョンを確認してください'}`
                );
                finish(null);
              } else {
                // 無音 / 認識できず（NoMatch）：これは「発音が下手で0点」ではなく
                // 「うまく録れなかった／聞き取れなかった」なので、0点として記録せず
                // null を返して呼び出し側に“ノーカウントで再挑戦”させる。
                // （録音はできているのにAzureが認識できず0点になる、を防ぐ）
                setError('声が聞き取れなかったよ。もう一度マイクを押して、ゆっくりはっきり言ってみてね');
                finish(null);
              }
            } catch (e) {
              setError(String(e));
              finish(null);
            }
          },
          (err) => {
            setError(String(err));
            finish(null);
          }
        );
      });
    },
    [key, region, ensurePipeline]
  );

  return { assess, isAssessing, error, isAvailable, lastRecordingUrl };
};
