import { useState, useCallback } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

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

/**
 * Azure Pronunciation Assessment hook.
 * Records one utterance from the microphone and scores it against `referenceText`.
 * The subscription key is used directly in the browser (fromSubscription); it is
 * loaded from app settings (Supabase) and never committed to the repository.
 */
export const usePronunciationAssessment = (
  key: string | null,
  region: string | null
) => {
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = !!(key && region);

  const assess = useCallback(
    (referenceText: string): Promise<PronunciationResult | null> => {
      return new Promise((resolve) => {
        if (!key || !region) {
          setError('Azure Speech is not configured');
          resolve(null);
          return;
        }

        setError(null);
        setIsAssessing(true);

        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

        const paConfig = new SpeechSDK.PronunciationAssessmentConfig(
          referenceText,
          SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
          SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
          true // enableMiscue
        );
        paConfig.applyTo(recognizer);

        const cleanup = () => {
          recognizer.close();
        };

        recognizer.recognizeOnceAsync(
          (result) => {
            setIsAssessing(false);
            try {
              if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                const pa = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
                const detail: any = pa.detailResult || {};
                const words: WordScore[] = (detail.Words || []).map((w: any) => ({
                  word: w.Word,
                  accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
                  errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
                }));
                resolve({
                  recognizedText: result.text || '',
                  accuracyScore: pa.accuracyScore,
                  pronunciationScore: pa.pronunciationScore,
                  fluencyScore: pa.fluencyScore,
                  completenessScore: pa.completenessScore,
                  words,
                });
              } else {
                // No speech detected / no match: score as 0 so the caller treats it as a miss.
                resolve({
                  recognizedText: '',
                  accuracyScore: 0,
                  pronunciationScore: 0,
                  fluencyScore: 0,
                  completenessScore: 0,
                  words: [],
                });
              }
            } catch (e) {
              setError(String(e));
              resolve(null);
            } finally {
              cleanup();
            }
          },
          (err) => {
            setIsAssessing(false);
            setError(String(err));
            cleanup();
            resolve(null);
          }
        );
      });
    },
    [key, region]
  );

  return { assess, isAssessing, error, isAvailable };
};
