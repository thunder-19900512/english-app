import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vocabulary, type Vocabulary } from '../../../data/vocabulary';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis';
import { useAppSettings } from '../../../hooks/useAppSettings';
import { usePronunciationAssessment } from '../../../hooks/usePronunciationAssessment';
import { usePronunciationHistory } from '../../../hooks/usePronunciationHistory';
import { usePoints } from '../../../hooks/usePoints';
import { Button } from '../../ui/Button';
import { MicButton } from '../../ui/MicButton';
import { ArrowLeft, Trophy, Star, RefreshCw } from 'lucide-react';
import { useDictionaryProgress } from '../../../hooks/useDictionaryProgress';

// 発音バトルの合格ライン（Azure発音判定の正確さスコア 0-100）。小学生向けに少しやさしめ。
const PASS_SCORE = 60;

const MONSTERS = ['👹', '👺', '🐉', '👾', '👻', '🦖', '🦈', '🕷️', '🐍', '🦇'];

export const VoiceBattle: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const decodedCategory = decodeURIComponent(category || '');
  
  const { speak } = useSpeechSynthesis();
  const { isRecording, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { azureSpeechKey, azureSpeechRegion } = useAppSettings();
  const { assess, isAssessing, isAvailable: azureAvailable, error: azureError, lastRecordingUrl } = usePronunciationAssessment(azureSpeechKey, azureSpeechRegion);
  const { saveProgress } = useDictionaryProgress();
  const { addScore } = usePronunciationHistory();
  const { addPoints } = usePoints();

  // Azureの発音採点で出た最新スコア（フィードバック表示用）
  const [lastScore, setLastScore] = useState<number | null>(null);

  const words = React.useMemo(() => vocabulary.filter(v => v.category === decodedCategory), [decodedCategory]);

  const [targetWord, setTargetWord] = useState<Vocabulary | null>(null);
  const [currentMonster, setCurrentMonster] = useState('👾');
  const [shuffledWords, setShuffledWords] = useState<Vocabulary[]>([]);
  
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const [monsterState, setMonsterState] = useState<'idle' | 'hit' | 'attack'>('idle');
  const [mistakes, setMistakes] = useState(0);

  const DEFAULT_TOTAL_QUESTIONS = 10;
  const TOTAL_QUESTIONS = words.length > 0 ? Math.min(DEFAULT_TOTAL_QUESTIONS, words.length) : DEFAULT_TOTAL_QUESTIONS;
  const PASS_MARK = Math.max(1, Math.floor(TOTAL_QUESTIONS * 0.8));

  useEffect(() => {
    if (words.length > 0 && shuffledWords.length === 0) {
      setShuffledWords([...words].sort(() => 0.5 - Math.random()));
    }
  }, [words, shuffledWords.length]);

  const generateQuestion = useCallback((qCount: number, sWords: Vocabulary[]) => {
    if (sWords.length === 0) return;
    const target = sWords[qCount % sWords.length];
    setTargetWord(target);
    setCurrentMonster(MONSTERS[Math.floor(Math.random() * MONSTERS.length)]);
    setMonsterState('idle');
    setMistakes(0);
    setTranscript('');
    setLastScore(null);
  }, [setTranscript]);

  useEffect(() => {
    if (shuffledWords.length > 0 && questionCount === 0 && !targetWord && !showCelebration && !showFailure) {
      generateQuestion(0, shuffledWords);
    }
  }, [shuffledWords, questionCount, targetWord, showCelebration, showFailure, generateQuestion]);

  const checkIsCorrect = useCallback((input: string, target: string) => {
    const i = input.toLowerCase().trim();
    const t = target.toLowerCase().trim();
    if (i === t) return true;
    const strippedI = i.replace(/[^a-z0-9]/g, '');
    const strippedT = t.replace(/[^a-z0-9]/g, '');
    return strippedI === strippedT && strippedT.length > 0;
  }, []);

  const proceedToNextTurn = useCallback((isCorrect: boolean) => {
    const newQC = questionCount + 1;
    const newCC = isCorrect ? correctCount + 1 : correctCount;
    
    setQuestionCount(newQC);
    setCorrectCount(newCC);

    if (newQC >= TOTAL_QUESTIONS) {
      if (newCC >= PASS_MARK) {
        saveProgress(decodedCategory, { voice: true });
        
        const savePoints = async () => {
          const pts = await addPoints(`dict_voice_${decodedCategory}`, {
            isPerfect: newCC === TOTAL_QUESTIONS,
            multiplier: TOTAL_QUESTIONS / DEFAULT_TOTAL_QUESTIONS
          });
          setEarnedPoints(pts);
        };
        savePoints();

        setShowCelebration(true);
      } else {
        setShowFailure(true);
      }
    } else {
      setTimeout(() => generateQuestion(newQC, shuffledWords), 500);
    }
  }, [questionCount, correctCount, decodedCategory, saveProgress, addPoints, generateQuestion, shuffledWords, TOTAL_QUESTIONS, DEFAULT_TOTAL_QUESTIONS]);

  // Azureの発音採点で1回チャレンジする（Azure設定があるときのみ使用）
  const handleAzureAttempt = useCallback(async () => {
    if (!targetWord || monsterState !== 'idle' || isAssessing) return;

    const result = await assess(targetWord.english);
    if (!result) {
      // 採点に失敗（設定ミスや通信エラー）。今回はノーカウントで、もう一度促す。
      return;
    }

    setLastScore(result.accuracyScore);
    setTranscript(result.recognizedText);
    addScore('battle', result.accuracyScore, targetWord.english);

    if (result.accuracyScore >= PASS_SCORE) {
      setMonsterState('hit');
      speak('Good!');
      // スコアを見せてから次へ進む（少し長めに待つ）
      setTimeout(() => proceedToNextTurn(true), 1500);
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= 3) {
        setMonsterState('attack');
        setTimeout(() => proceedToNextTurn(false), 1000);
      }
    }
  }, [targetWord, monsterState, isAssessing, assess, setTranscript, speak, proceedToNextTurn, mistakes, addScore]);

  useEffect(() => {
    // Web Speech APIでの判定はAzure未設定のときだけ動かす
    if (!azureAvailable && transcript && targetWord && monsterState === 'idle') {
      const isCorrect = checkIsCorrect(transcript, targetWord.english);
      if (isCorrect) {
        setMonsterState('hit');
        speak('Good!');
        setTimeout(() => {
          proceedToNextTurn(true);
        }, 1000);
      } else {
        setMistakes(prev => prev + 1);
        setTranscript('');
        
        if (mistakes + 1 >= 3) {
          // Monster attacks after 3 mistakes
          setMonsterState('attack');
          setTimeout(() => {
            proceedToNextTurn(false);
          }, 1000);
        }
      }
    }
  }, [azureAvailable, transcript, targetWord, checkIsCorrect, monsterState, mistakes, speak, proceedToNextTurn, setTranscript]);

  const resetSession = () => {
    const newShuffled = [...words].sort(() => 0.5 - Math.random());
    setShuffledWords(newShuffled);
    setQuestionCount(0);
    setCorrectCount(0);
    setShowCelebration(false);
    setShowFailure(false);
    setEarnedPoints(null);
    setLastScore(null);
    generateQuestion(0, newShuffled);
  };

  if (showCelebration) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>討伐成功！</h1>
        <div className="animate-float">
          <Trophy size={100} color="var(--color-accent)" />
        </div>
        {earnedPoints !== null && (
          <div className="animate-pop" style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
            +{earnedPoints} ポイントゲット！✨
          </div>
        )}
        <p style={{ fontSize: '1.5rem' }}>{TOTAL_QUESTIONS}体中 <strong>{correctCount}</strong>体のモンスターを倒した！</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={resetSession} variant="outline">もう一度プレイ</Button>
          <Button onClick={() => navigate(`/dictionary/${category}`)}>もどる</Button>
        </div>
      </div>
    );
  }

  if (showFailure) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-error" style={{ fontSize: '3rem' }}>討伐失敗…</h1>
        <p style={{ fontSize: '1.5rem' }}>{TOTAL_QUESTIONS}体中 <strong>{correctCount}</strong>体のモンスターを倒した。</p>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>{PASS_MARK}体倒せばクリアだよ。マイクに向かってハッキリ発音してみよう！</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button onClick={resetSession} icon={RefreshCw}>もう一度</Button>
          <Button onClick={() => navigate(`/dictionary/${category}`)} variant="outline">もどる</Button>
        </div>
      </div>
    );
  }

  if (!targetWord) return null;

  return (
    <div className="flex-col flex-center gap-lg" style={{ minHeight: '100%', width: '100%', position: 'relative' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outline" onClick={() => navigate(`/dictionary/${category}`)} icon={ArrowLeft}>
          もどる
        </Button>
        <h1 className="text-primary" style={{ fontSize: '2rem', margin: 0 }}>モンスターバトル</h1>
        <div style={{ width: '100px' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginRight: '1rem' }}>
          {questionCount + 1} / {TOTAL_QUESTIONS} 体目
        </div>
        {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
          <Star 
            key={i} 
            size={24} 
            fill={i < correctCount ? "var(--color-accent)" : "transparent"} 
            color={i < correctCount ? "var(--color-accent)" : i < questionCount ? "#ff9f43" : "#ccc"} 
          />
        ))}
      </div>

      <div 
        className="glass-card flex-col flex-center"
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          padding: '2rem',
          minHeight: '400px',
          background: monsterState === 'attack' ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.8)'
        }}
      >
        <div 
          className={monsterState === 'hit' ? 'animate-pop' : monsterState === 'attack' ? 'animate-float' : ''}
          style={{ 
            fontSize: '8rem', 
            transition: 'all 0.3s',
            transform: monsterState === 'hit' ? 'scale(0) rotate(180deg)' : 'scale(1)',
            opacity: monsterState === 'hit' ? 0 : 1
          }}
        >
          {currentMonster}
        </div>

        {monsterState === 'attack' && (
          <div className="text-error animate-pop" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Miss! 逃げられた！
          </div>
        )}

        {monsterState === 'idle' && (
          <>
            <div style={{ fontSize: '4rem', margin: '1rem 0' }}>{targetWord.emoji}</div>
            <h2 style={{ fontSize: '2.5rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
              {targetWord.english}
            </h2>
            <div style={{ marginTop: '1rem', color: '#666' }}>
              {azureAvailable
                ? (isAssessing ? '聞いているよ…ハッキリ発音してね！' : `マイクを押して発音してね！ (残り ${3 - mistakes} 回)`)
                : `マイクを押して発音してね！ (残り ${3 - mistakes} 回)`}
            </div>
          </>
        )}
      </div>

      <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        {transcript && monsterState === 'idle' && (
          <div className="badge animate-pop" style={{ background: '#fff', fontSize: '1.5rem', padding: '1rem 2rem' }}>
            {transcript}
          </div>
        )}
        {azureAvailable && lastScore !== null && (monsterState === 'idle' || monsterState === 'hit') && (
          <div
            className="animate-pop"
            style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: lastScore >= PASS_SCORE ? 'var(--color-success)' : 'var(--color-error)'
            }}
          >
            発音スコア: {Math.round(lastScore)} 点 {lastScore >= PASS_SCORE ? '✅' : '（もう一回！）'}
          </div>
        )}
        {azureAvailable && azureError && monsterState === 'idle' && (
          <div
            className="animate-pop"
            style={{
              fontSize: '0.95rem',
              fontWeight: 'bold',
              color: 'var(--color-error)',
              maxWidth: '500px',
              textAlign: 'center',
              wordBreak: 'break-word'
            }}
          >
            ⚠️ Azureエラー: {azureError}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <MicButton
          isRecording={azureAvailable ? isAssessing : isRecording}
          disabled={azureAvailable && isAssessing}
          onClick={
            azureAvailable
              ? handleAzureAttempt
              : (isRecording ? stopListening : startListening)
          }
        />

        {azureAvailable && lastRecordingUrl && monsterState === 'idle' && (
          <button
            onClick={() => new Audio(lastRecordingUrl).play()}
            title="さっきの自分の声を聞く"
            className="hover-scale"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid var(--color-primary)',
              background: 'white',
              color: 'var(--color-primary)',
              fontSize: '1.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            🔊
          </button>
        )}
      </div>

    </div>
  );
};
