import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stages } from '../../data/stages';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { MicButton } from '../ui/MicButton';
import { Button } from '../ui/Button';
import { ArrowLeft, Trophy, Star, Volume2, RefreshCw } from 'lucide-react';
import { pushToSupabase } from '../../lib/sync';
import { usePoints } from '../../hooks/usePoints';

const phonicsEmojis: Record<string, string> = {
  A: '🍎', B: '🐻', C: '🐱', D: '🐶', E: '🐘', F: '🐸', G: '🦍', H: '🎩', I: '🧊', J: '🧃', K: '🐨', L: '🦁', M: '🐒', N: '🥜', O: '🐙', P: '🐷', Q: '👑', R: '🐰', S: '☀️', T: '🐯', U: '☂️', V: '🎻', W: '🍉', X: '❌', Y: '🛥️', Z: '🦓',
  cat: '🐱', dog: '🐶', pig: '🐷', bed: '🛏️', sun: '☀️', hat: '🎩', bat: '🦇', map: '🗺️', pin: '📍', lip: '👄', box: '📦', fox: '🦊', cup: '☕', bug: '🐛', net: '🕸️', red: '🔴',
  ship: '🚢', shop: '🏪', fish: '🐟', dish: '🍽️', star: '⭐', stop: '🛑', chop: '🔪', chin: '🧔', thin: '📏', math: '🔢', phone: '📱', whale: '🐳', duck: '🦆', ring: '💍', queen: '👑',
  cake: '🍰', make: '🛠️', take: '🤲', bike: '🚲', like: '👍', kite: '🪁', nose: '👃', rose: '🌹', cute: '🥰', mute: '🔇',
  rain: '🌧️', train: '🚂', tree: '🌳', see: '👀', boat: '⛵', coat: '🧥', meat: '🥩', seat: '💺',
  smile: '😊', snack: '🍪', black: '⬛', clock: '🕒', spoon: '🥄', park: '🏞️', short: '👖', girl: '👧', chair: '🪑', work: '💼'
};

const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

export const Stage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const stage = stages.find(s => s.id === parseInt(id || '1'));
  
  const { speak } = useSpeechSynthesis();
  const { isRecording, transcript, error, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { addPoints } = usePoints();

  const [mode, setMode] = useState<'input' | 'choice' | 'typing' | 'quiz'>('input');
  const [quizIndex, setQuizIndex] = useState(() => stage ? Math.floor(Math.random() * stage.items.length) : 0);
  
  // Game session states
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showAnswerState, setShowAnswerState] = useState(false);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  
  const [options, setOptions] = useState<string[]>([]);
  const [choiceError, setChoiceError] = useState(false);
  const [typingInput, setTypingInput] = useState('');

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState<{ name: string; time: number } | null>(null);
  const [newRecordMsg, setNewRecordMsg] = useState('');
  const [showCorrectMark, setShowCorrectMark] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const checkIsCorrect = (input: string, target: string) => {
    const i = input.toLowerCase().trim();
    const t = target.toLowerCase().trim();
    if (i === t) return true;
    if ((t === 'c' && i === 'k') || (t === 'k' && i === 'c')) return true;
    return false;
  };

  // Generate options for choice mode
  const generateOptions = useCallback((currentIndex: number) => {
    if (!stage) return;
    const target = stage.items[currentIndex];
    const allItems = stages.flatMap(s => s.items);
    const others = allItems.filter(item => {
      if (item === target) return false;
      const i = item.toLowerCase();
      const t = target.toLowerCase();
      if ((t === 'c' && i === 'k') || (t === 'k' && i === 'c')) return false;
      return true;
    });
    
    const sortedOthers = [...others].sort((a, b) => {
      const distA = getLevenshteinDistance(target, a);
      const distB = getLevenshteinDistance(target, b);
      if (distA === distB) return Math.random() - 0.5;
      return distA - distB;
    });
    
    const distractors = sortedOthers.slice(0, 2);
    const newOptions = [target, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
  }, [stage]);

  useEffect(() => {
    if (mode === 'choice') {
      generateOptions(quizIndex);
    }
  }, [mode, quizIndex, generateOptions]);

  useEffect(() => {
    if (stage) {
      const recordKey = `global_record_stage_${stage.id}_${mode}`;
      const recordStr = localStorage.getItem(recordKey);
      if (recordStr) {
        setBestTime(JSON.parse(recordStr));
      } else {
        setBestTime(null);
      }
    }
  }, [stage?.id, mode]);

  // Auto-play audio when question changes
  useEffect(() => {
    if (['choice', 'typing', 'quiz'].includes(mode) && !showCelebration && !showFailure && !showAnswerState && !showCorrectMark && stage) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        speak(stage.items[quizIndex]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [quizIndex, mode, showCelebration, showFailure, showAnswerState, showCorrectMark, stage, speak]);

  // Live timer
  useEffect(() => {
    if (startTime && !showCelebration && !showFailure && ['choice', 'typing'].includes(mode)) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, showCelebration, showFailure, mode]);

  useEffect(() => {
    if (mode === 'quiz' && transcript) {
      const targetWord = stage?.items[quizIndex].toLowerCase() || '';
      if (transcript.includes(targetWord) || targetWord.includes(transcript)) {
        handleCorrectAnswer();
      }
    }
  }, [transcript, mode, quizIndex]);

  const TOTAL_QUESTIONS = 10;
  const PASS_MARK = 8;

  const moveToNextQuestion = () => {
    setQuizIndex((prev) => {
      if (stage!.items.length <= 1) return 0;
      let next = Math.floor(Math.random() * stage!.items.length);
      while (next === prev) {
        next = Math.floor(Math.random() * stage!.items.length);
      }
      return next;
    });
    setTypingInput('');
    setTranscript('');
  };

  const proceedToNextTurn = (isCorrect: boolean) => {
    const newQC = questionCount + 1;
    const newCC = isCorrect ? correctCount + 1 : correctCount;
    
    setQuestionCount(newQC);
    setCorrectCount(newCC);
    setMistakes(0);

    if (newQC >= TOTAL_QUESTIONS) {
      if (newCC >= PASS_MARK) {
        saveBadge(stage!.id);

        let isNewBest = false;
        if (newCC === TOTAL_QUESTIONS && ['choice', 'typing'].includes(mode) && startTime) {
          const timeTaken = Date.now() - startTime;
          const recordKey = `global_record_stage_${stage!.id}_${mode}`;
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

        const pts = addPoints(`stage_${id}_${mode}`, {
          isPerfect: newCC === TOTAL_QUESTIONS,
          isNewRecord: isNewBest
        });
        setEarnedPoints(pts);

        setShowCelebration(true);
      } else {
        setShowFailure(true);
      }
    } else {
      moveToNextQuestion();
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

  const handleOptionClick = (option: string) => {
    if (showAnswerState) return;
    if (checkIsCorrect(option, stage!.items[quizIndex])) {
      handleCorrectAnswer();
    } else {
      handleMistake();
    }
  };

  const handleTypingSubmit = () => {
    if (showAnswerState) return;
    if (!typingInput) return;
    
    if (checkIsCorrect(typingInput, stage!.items[quizIndex])) {
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
    setTranscript('');
    setTypingInput('');
    setNewRecordMsg('');
    setEarnedPoints(null);
    setElapsedTime(0);
    setStartTime(Date.now());
    moveToNextQuestion();
  };

  const saveBadge = (stageId: number) => {
    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      const dataStr = localStorage.getItem(`student_${studentId}`);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (!data.badges.includes(stageId)) {
          data.badges.push(stageId);
          localStorage.setItem(`student_${studentId}`, JSON.stringify(data));
        }
      }
    }
  };

  if (!stage) return <div>Stage not found</div>;

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
        <p style={{ fontSize: '1.5rem' }}><strong>{stage.badgeName}</strong> バッジをゲットしたよ！</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={resetSession} variant="outline">もう一度プレイ</Button>
          <Button onClick={() => navigate('/home')}>ホームにもどる</Button>
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
          <Button onClick={() => navigate('/home')} variant="outline">ホームにもどる</Button>
        </div>
      </div>
    );
  }

  const renderStars = () => (
    <>
      {['choice', 'typing'].includes(mode) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
            ⏱️ {(elapsedTime / 1000).toFixed(1)}秒
          </div>
          <div style={{ textAlign: 'center', animation: 'float 3s infinite' }}>
            {bestTime ? (
              <span className="badge" style={{ background: 'var(--color-accent)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: '#000', fontWeight: 'bold' }}>
                👑 最速記録 ({mode === 'choice' ? 'えらぶ' : 'タイピング'}): {bestTime.name}さん {(bestTime.time / 1000).toFixed(1)}秒
              </span>
            ) : (
              <span className="badge" style={{ background: '#eee', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: '#888' }}>
                👑 最速記録 ({mode === 'choice' ? 'えらぶ' : 'タイピング'}): まだいないよ！最初のチャンピオンになろう！
              </span>
            )}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
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
    </>
  );

  return (
    <div className="flex-col gap-lg" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>
          もどる
        </Button>
        <h1 className="text-primary">{stage.title}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button 
            variant={mode === 'input' ? 'primary' : 'outline'} 
            onClick={() => { setMode('input'); resetSession(); }}
          >
            きく
          </Button>
          <Button 
            variant={mode === 'choice' ? 'primary' : 'outline'} 
            onClick={() => { setMode('choice'); resetSession(); }}
          >
            えらぶ
          </Button>
          <Button 
            variant={mode === 'typing' ? 'primary' : 'outline'} 
            onClick={() => { setMode('typing'); resetSession(); }}
          >
            タイピング
          </Button>
          {stage.id !== 1 && (
            <Button 
              variant={mode === 'quiz' ? 'secondary' : 'outline'} 
              onClick={() => { setMode('quiz'); resetSession(); }}
            >
              マイク
            </Button>
          )}
        </div>
      </div>

      <div className={`glass-card flex-col flex-center ${stage.colorClass}`} style={{ flex: 1, gap: '2rem' }}>
        {stage.explanation && (
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.8)' }}>
            <p style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-primary)' }}>💡 {stage.explanation}</p>
          </div>
        )}

        {mode === 'input' && (
          <>
            {stage.practiceItems && (
              <div style={{ width: '100%', maxWidth: '600px', marginBottom: '1rem', background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>🎧 練習コーナー (音だけをきこう)</p>
                <div className="badge-grid">
                  {stage.practiceItems.map((item, idx) => (
                    <div 
                      key={`prac-${idx}`} 
                      className="stage-tile" 
                      onClick={() => speak(item)}
                      style={{ padding: '1rem', fontSize: '2rem', minHeight: '80px', minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      {phonicsEmojis[item] && <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{phonicsEmojis[item]}</span>}
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p style={{ fontSize: '1.2rem' }}>カードをタップして単語の音をきこう</p>
            <div className="badge-grid" style={{ width: '100%', maxWidth: '600px' }}>
              {stage.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="stage-tile" 
                  onClick={() => speak(item)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  {phonicsEmojis[item] && <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{phonicsEmojis[item]}</span>}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </>
        )}
        
        {mode === 'choice' && (
          <>
            <p style={{ fontSize: '1.2rem' }}>音をきいて、正しいものをえらぼう！</p>
            {renderStars()}

            <Button 
              onClick={() => speak(stage.items[quizIndex])} 
              icon={Volume2}
              style={{ fontSize: '1.5rem', padding: '1rem 3rem', background: 'var(--color-accent)', color: '#000' }}
            >
              音をきく
            </Button>
            
            <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {showCorrectMark && (
                <div className="animate-pop" style={{ position: 'absolute', fontSize: '8rem', color: 'var(--color-success)', fontWeight: 'bold', zIndex: 10 }}>
                  ◯
                </div>
              )}
              {showAnswerState && (
                <div className="animate-pop text-error" style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center' }}>
                  正解は: {stage.items[quizIndex]} {phonicsEmojis[stage.items[quizIndex]] || ''}
                </div>
              )}
            </div>
            
            {!showAnswerState && (
              <div className="badge-grid" style={{ width: '100%', maxWidth: '600px' }}>
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '2rem', 
                      fontSize: '2rem', 
                      fontFamily: 'var(--font-heading)',
                      background: choiceError ? 'var(--color-error)' : 'var(--color-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: mistakes >= 1 && !checkIsCorrect(option, stage.items[quizIndex]) ? 0.5 : 1
                    }}
                    onClick={() => handleOptionClick(option)}
                  >
                    {/* Show emoji ONLY if mistakes >= 1 OR if it's not the target word? 
                        Wait, the prompt says initially NO emoji. So only show emoji if mistakes >= 1.
                    */}
                    {mistakes >= 1 && phonicsEmojis[option] && (
                      <span className="animate-pop" style={{ fontSize: '3rem' }}>{phonicsEmojis[option]}</span>
                    )}
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {mode === 'typing' && (
          <>
            <p style={{ fontSize: '1.2rem' }}>音をきいて、タイピングしよう！</p>
            {renderStars()}

            <Button 
              onClick={() => speak(stage.items[quizIndex])} 
              icon={Volume2}
              style={{ fontSize: '1.5rem', padding: '1rem 3rem', background: 'var(--color-accent)', color: '#000' }}
            >
              音をきく
            </Button>
            
            <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {showCorrectMark && (
                <div className="animate-pop" style={{ position: 'absolute', fontSize: '8rem', color: 'var(--color-success)', fontWeight: 'bold', zIndex: 10 }}>
                  ◯
                </div>
              )}
              {showAnswerState && (
                <div className="animate-pop text-error" style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center' }}>
                  正解は: {stage.items[quizIndex]}
                </div>
              )}
            </div>
            
            {!showAnswerState && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                {mistakes >= 1 && phonicsEmojis[stage.items[quizIndex]] && (
                  <div style={{ fontSize: '5rem', animation: 'pop 0.3s ease-out' }}>
                    {phonicsEmojis[stage.items[quizIndex]]}
                  </div>
                )}
                <input 
                  type="text" 
                  value={typingInput}
                  onChange={(e) => setTypingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTypingSubmit();
                  }}
                  style={{ 
                    fontSize: '2rem', 
                    padding: '1rem', 
                    width: '300px', 
                    textAlign: 'center', 
                    borderRadius: 'var(--radius-sm)',
                    border: choiceError ? '2px solid var(--color-error)' : '2px solid var(--color-primary)' 
                  }}
                  autoFocus
                />
                <Button onClick={handleTypingSubmit}>
                  こたえる
                </Button>
              </div>
            )}
          </>
        )}

        {mode === 'quiz' && stage.id !== 1 && (
          <>
            <p style={{ fontSize: '1.2rem' }}>マイクをタップして発音しよう！</p>
            {renderStars()}
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {phonicsEmojis[stage.items[quizIndex]] && (
                <div style={{ fontSize: '4rem', animation: 'pop 0.3s ease-out' }}>
                  {phonicsEmojis[stage.items[quizIndex]]}
                </div>
              )}
              <div style={{ fontSize: '4rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
                {stage.items[quizIndex]}
              </div>
            </div>
            
            <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {showCorrectMark && (
                <div className="animate-pop" style={{ position: 'absolute', fontSize: '8rem', color: 'var(--color-success)', fontWeight: 'bold', zIndex: 10 }}>
                  ◯
                </div>
              )}
            </div>
            
            <MicButton 
              isRecording={isRecording} 
              onClick={isRecording ? stopListening : startListening} 
            />

            {transcript && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)' }}>
                あなたの発音: <strong>{transcript}</strong>
              </div>
            )}
            
            {error && (
              <div className="text-error" style={{ marginTop: '1rem' }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
