import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vocabulary, type Vocabulary } from '../../data/vocabulary';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { Button } from "../ui/Button";
import { ArrowLeft, Volume2, Star, Trophy, RefreshCw } from 'lucide-react';
import { useDictionaryProgress } from '../../hooks/useDictionaryProgress';
import { usePoints } from '../../hooks/usePoints';

export const PracticeMode: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const decodedCategory = decodeURIComponent(category || '');
  const { speak } = useSpeechSynthesis();
  const { saveProgress } = useDictionaryProgress();
  const { addPoints } = usePoints();

  const words = React.useMemo(() => vocabulary.filter(v => v.category === decodedCategory), [decodedCategory]);

  const [targetWord, setTargetWord] = useState<Vocabulary | null>(null);
  const [options, setOptions] = useState<Vocabulary[]>([]);
  const [shuffledWords, setShuffledWords] = useState<Vocabulary[]>([]);
  
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  
  const [startTime, setStartTime] = useState<number | null>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState<{ name: string; time: number } | null>(null);
  const [newRecordMsg, setNewRecordMsg] = useState('');
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const [showAnswerState, setShowAnswerState] = useState(false);
  const [showCorrectMark, setShowCorrectMark] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [choiceError, setChoiceError] = useState(false);

  const DEFAULT_TOTAL_QUESTIONS = 10;
  const TOTAL_QUESTIONS = words.length > 0 ? Math.min(DEFAULT_TOTAL_QUESTIONS, words.length) : DEFAULT_TOTAL_QUESTIONS;
  const PASS_MARK = Math.max(1, Math.floor(TOTAL_QUESTIONS * 0.8));

  // Load best time
  useEffect(() => {
    const recordKey = `dict_practice_${decodedCategory}`;
    const recordStr = localStorage.getItem(recordKey);
    if (recordStr) {
      setBestTime(JSON.parse(recordStr));
    } else {
      setBestTime(null);
    }
  }, [decodedCategory]);

  // Live timer
  useEffect(() => {
    if (startTime && !showCelebration && !showFailure) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, showCelebration, showFailure]);

  useEffect(() => {
    if (words.length > 0 && shuffledWords.length === 0) {
      setShuffledWords([...words].sort(() => 0.5 - Math.random()));
    }
  }, [words, shuffledWords.length]);

  const generateQuestion = useCallback((qCount: number, sWords: Vocabulary[]) => {
    if (sWords.length === 0) return;
    const target = sWords[qCount % sWords.length];
    setTargetWord(target);

    const others = words.filter(w => w.id !== target.id);
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3);
    
    const newOptions = [target, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
  }, [words]);

  useEffect(() => {
    if (shuffledWords.length > 0 && questionCount === 0 && !targetWord && !showCelebration && !showFailure) {
      generateQuestion(0, shuffledWords);
    }
  }, [shuffledWords, questionCount, targetWord, showCelebration, showFailure, generateQuestion]);

  // Auto-play audio
  useEffect(() => {
    if (targetWord && !showCelebration && !showFailure && !showAnswerState && !showCorrectMark) {
      const timer = setTimeout(() => {
        speak(targetWord.english);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [targetWord, showCelebration, showFailure, showAnswerState, showCorrectMark, speak]);

  const moveToNextQuestion = (nextQC: number) => {
    generateQuestion(nextQC, shuffledWords);
  };

  const proceedToNextTurn = (isCorrect: boolean) => {
    const newQC = questionCount + 1;
    const newCC = isCorrect ? correctCount + 1 : correctCount;
    
    setQuestionCount(newQC);
    setCorrectCount(newCC);
    setMistakes(0);

    if (newQC >= TOTAL_QUESTIONS) {
      if (newCC >= PASS_MARK) {
        saveProgress(decodedCategory, { practice: true });
        
        let isNewBest = false;

        if (newCC === TOTAL_QUESTIONS && startTime) {
          const timeTaken = Date.now() - startTime;
          const recordKey = `dict_practice_${decodedCategory}`;
          const recordStr = localStorage.getItem(recordKey);
          
          if (!recordStr) {
            isNewBest = true;
          } else {
            const currentBest = JSON.parse(recordStr);
            if (timeTaken < currentBest.time) {
              isNewBest = true;
            }
          }

          if (isNewBest) {
            const studentName = localStorage.getItem('studentName') || '名無し';
            const newRecord = { name: studentName, time: timeTaken };
            localStorage.setItem(recordKey, JSON.stringify(newRecord));
            setBestTime(newRecord);
            setNewRecordMsg(`🏆 新記録達成！ ${(timeTaken / 1000).toFixed(1)}秒！`);
          } else {
            setNewRecordMsg(`クリアタイム: ${(timeTaken / 1000).toFixed(1)}秒`);
          }
        }
        
        const pts = addPoints(`dict_practice_${decodedCategory}`, {
          isPerfect: newCC === TOTAL_QUESTIONS,
          isNewRecord: isNewBest,
          multiplier: TOTAL_QUESTIONS / DEFAULT_TOTAL_QUESTIONS
        });
        setEarnedPoints(pts);

        setShowCelebration(true);
      } else {
        setShowFailure(true);
      }
    } else {
      moveToNextQuestion(newQC);
    }
  };

  const handleCorrectAnswer = () => {
    setChoiceError(false);
    setShowCorrectMark(true);
    setTimeout(() => {
      setShowCorrectMark(false);
      proceedToNextTurn(true);
    }, 500);
  };

  const handleMistake = () => {
    setChoiceError(true);
    setTimeout(() => setChoiceError(false), 500);
    
    const newMistakes = mistakes + 1;
    setMistakes(newMistakes);

    if (newMistakes >= 2) {
      setShowAnswerState(true);
      setTimeout(() => {
        setShowAnswerState(false);
        proceedToNextTurn(false);
      }, 2000);
    }
  };

  const handleOptionClick = (option: Vocabulary) => {
    if (showAnswerState) return;
    if (option.id === targetWord?.id) {
      handleCorrectAnswer();
    } else {
      handleMistake();
    }
  };

  const resetSession = () => {
    setQuestionCount(0);
    setCorrectCount(0);
    setMistakes(0);
    setShowAnswerState(false);
    setShowCelebration(false);
    setShowFailure(false);
    setNewRecordMsg('');
    setEarnedPoints(null);
    const newShuffled = [...words].sort(() => 0.5 - Math.random());
    setShuffledWords(newShuffled);
    setElapsedTime(0);
    setStartTime(Date.now());
    generateQuestion(0, newShuffled);
  };

  if (showCelebration) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>ステージクリア！</h1>
        {newRecordMsg && (
          <div className="animate-pop text-accent" style={{ fontSize: '2rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.8)', padding: '1rem 2rem', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
            {newRecordMsg}
          </div>
        )}
        <div className="animate-float">
          <Trophy size={100} color="var(--color-accent)" />
        </div>
        {earnedPoints !== null && (
          <div className="animate-pop" style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
            +{earnedPoints} ポイントゲット！✨
          </div>
        )}
        <p style={{ fontSize: '1.5rem' }}>{TOTAL_QUESTIONS}問中 <strong>{correctCount}</strong>問 正解！</p>
        <p style={{ fontSize: '1.5rem' }}>選択モードをクリアしたよ！</p>
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
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>おしい！</h1>
        <p style={{ fontSize: '1.5rem' }}>{TOTAL_QUESTIONS}問中 <strong>{correctCount}</strong>問 正解でした。</p>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>{PASS_MARK}問正解でクリアだよ。もう一度挑戦しよう！</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button onClick={resetSession} icon={RefreshCw}>もう一度</Button>
          <Button onClick={() => navigate(`/dictionary/${category}`)} variant="outline">もどる</Button>
        </div>
      </div>
    );
  }

  if (!targetWord) return null;

  return (
    <div className="flex-col flex-center gap-lg" style={{ minHeight: '100%', width: '100%' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outline" onClick={() => navigate(`/dictionary/${category}`)} icon={ArrowLeft}>
          もどる
        </Button>
        <h1 className="text-primary" style={{ fontSize: '2rem', margin: 0 }}>選択モード</h1>
        <div style={{ width: '100px' }} /> {/* Spacer */}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
          ⏱️ {(elapsedTime / 1000).toFixed(1)}秒
        </div>
        <div style={{ textAlign: 'center', animation: 'float 3s infinite' }}>
          {bestTime ? (
            <span className="badge" style={{ background: 'var(--color-accent)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: '#000', fontWeight: 'bold' }}>
              👑 最速記録: {bestTime.name}さん {(bestTime.time / 1000).toFixed(1)}秒
            </span>
          ) : (
            <span className="badge" style={{ background: '#eee', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: '#888' }}>
              👑 最速記録: まだいないよ！最初のチャンピオンになろう！
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginRight: '1rem' }}>
          {questionCount + 1} / {TOTAL_QUESTIONS} 問目
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

      <Button 
        onClick={() => speak(targetWord.english)} 
        icon={Volume2}
        style={{ fontSize: '1.5rem', padding: '1rem 3rem', background: 'var(--color-accent)', color: '#000' }}
      >
        音をきく
      </Button>

      <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
        {showCorrectMark && (
          <div className="animate-pop" style={{ position: 'absolute', fontSize: '8rem', color: 'var(--color-success)', fontWeight: 'bold', zIndex: 10 }}>
            ◯
          </div>
        )}
        {showAnswerState && (
          <div className="animate-pop text-error" style={{ fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center' }}>
            正解は: {targetWord.english} {targetWord.emoji}
          </div>
        )}
      </div>

      {!showAnswerState && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%', maxWidth: '600px' }}>
          {options.map((opt) => (
            <div 
              key={opt.id}
              className="glass-card flex-col flex-center animate-pop"
              style={{ 
                padding: '2rem', 
                cursor: 'pointer', 
                background: choiceError ? 'var(--color-error)' : 'rgba(255,255,255,0.8)',
                minHeight: '150px',
                opacity: mistakes >= 1 && opt.id !== targetWord.id ? 0.5 : 1
              }}
              onClick={() => handleOptionClick(opt)}
            >
              {mistakes >= 1 && (
                <div className="animate-pop" style={{ fontSize: '4rem', marginBottom: '1rem' }}>{opt.emoji}</div>
              )}
              <h2 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
                {opt.english}
              </h2>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
