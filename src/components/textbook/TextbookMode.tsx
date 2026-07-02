import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSafeBack } from '../../hooks/useSafeBack';
import { ArrowLeft, HelpCircle, Mic, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { usePoints } from '../../hooks/usePoints';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { usePronunciationAssessment } from '../../hooks/usePronunciationAssessment';
import { usePronunciationHistory } from '../../hooks/usePronunciationHistory';
import { useAppSettings } from '../../hooks/useAppSettings';
import { DEFAULT_QUIZZES } from './textbookQuizData';
import { WORLD_BENTO_QUIZZES } from './worldBentoQuizData';

export type QuizQuestion = {
  question: string;
  videoRef: string;
} & (
  | { type: 'choice'; options: string[]; correctIndex: number; }
  | { type: 'typing'; correctAnswer: string; }
);

export interface TextbookQuiz {
  id: string;
  grade: 5 | 6;
  unitName: string;
  url?: string;
  keyPhrase: string;
  keyPhraseJapanese: string;
  questions: QuizQuestion[];
  noBonus?: boolean; // trueなら発音ボーナス課題を出さず、問題だけで完了（World Bento用）
}

const normalizeText = (text: string) => {
  return text
    .normalize('NFKC') // 全角英数を半角に
    .toLowerCase()
    .replace(/[.,!?'"・。\、「」\-\s]/g, '') // 記号や空白をすべて削除
    .trim();
};

// ボーナス課題（キーフレーズの音読）の合格ライン。Azure発音判定の総合スコア 0-100。
const BONUS_PASS_SCORE = 60;

export const TextbookMode: React.FC = () => {
  const goBack = useSafeBack();
  const { addPoints } = usePoints();
  const { isRecording, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { azureSpeechKey, azureSpeechRegion } = useAppSettings();
  const {
    assess,
    isAssessing,
    isAvailable: azureAvailable,
    lastRecordingUrl,
  } = usePronunciationAssessment(azureSpeechKey, azureSpeechRegion);
  const { addScore } = usePronunciationHistory();
  // ボーナス課題のAzureスコア（表示用）と、ボーナス獲得済みフラグ（ポイント二重取り防止）
  const [bonusScore, setBonusScore] = useState<number | null>(null);
  const [bonusEarned, setBonusEarned] = useState(false);
  
  const [grade, setGrade] = useState<5 | 6 | null>(null);
  const [quizzes, setQuizzes] = useState<TextbookQuiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<TextbookQuiz | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizState, setQuizState] = useState<'idle' | 'playing' | 'bonus' | 'completed'>('idle');
  // 正解数（本問だけ・ボーナス除く）。加点を正答率でスケールするために数える。
  const [correctCount, setCorrectCount] = useState(0);
  // このクイズで実際にポイントが入ったか（正答率が足りないと0点）。完了画面の表示に使う。
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  
  // Choice state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Typing/Bonus state
  const [typingInput, setTypingInput] = useState('');
  
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    let allQuizzes = [...DEFAULT_QUIZZES];

    if (supabase) {
      const { data } = await supabase
        .from('students')
        .select('dictionary_progress')
        .eq('id', 'app_settings_v1')
        .single();

      if (data?.dictionary_progress?.textbookQuizzes) {
        const dbQuizzes: TextbookQuiz[] = data.dictionary_progress.textbookQuizzes;
        const defaultIds = new Set(allQuizzes.map(q => q.id));
        for (const q of dbQuizzes) {
          if (!defaultIds.has(q.id)) {
            allQuizzes.push(q);
          }
        }
      }
    }
    setQuizzes(allQuizzes);
  };

  const handleQuizSelect = (quiz: TextbookQuiz) => {
    setSelectedQuiz(quiz);
    setQuizState('playing');
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setEarnedPoints(null);
    setBonusScore(null);
    setBonusEarned(false);
    resetQuestionState();
  };

  // URLパラメータ（?grade=5&id=g5-u1）で特定Unitを直接ひらく（今日のミッション用）
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const g = searchParams.get('grade');
    const id = searchParams.get('id');
    // 学年はTOPのカードでえらぶ前提。学年選択画面は廃止し、未指定なら5年を既定にする。
    setGrade(g === '6' ? 6 : 5);
    if (id) {
      const quiz = DEFAULT_QUIZZES.find(q => q.id === id) || WORLD_BENTO_QUIZZES.find(q => q.id === id);
      if (quiz) handleQuizSelect(quiz);
    }
  }, [searchParams]);

  const resetQuestionState = () => {
    setSelectedOption(null);
    setTypingInput('');
    setIsChecking(false);
    setFeedback(null);
    setTranscript('');
  };

  const handleChoiceSubmit = (index: number) => {
    if (isChecking) return;
    const currentQ = selectedQuiz!.questions[currentQuestionIndex];
    if (currentQ.type !== 'choice') return;

    setSelectedOption(index);
    setIsChecking(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      setFeedback('correct');
      setCorrectCount(prev => prev + 1); // Weight 1 for choice
    } else {
      setFeedback('incorrect');
    }

    proceedToNext();
  };

  const handleTypingSubmit = () => {
    if (isChecking) return;
    const currentQ = selectedQuiz!.questions[currentQuestionIndex];
    if (currentQ.type !== 'typing') return;

    setIsChecking(true);

    const normInput = normalizeText(typingInput);
    const normTarget = normalizeText(currentQ.correctAnswer);
    // 多少の揺れ（一部の一致など）を許容
    const isCorrect = normInput === normTarget || normInput.includes(normTarget) || normTarget.includes(normInput);

    if (isCorrect) {
      setFeedback('correct');
      setCorrectCount(prev => prev + 1); // Weight 3 for typing
    } else {
      setFeedback('incorrect');
    }

    proceedToNext();
  };

  const handleBonusSubmit = (input: string) => {
    if (isChecking) return;
    setIsChecking(true);
    
    const normInput = normalizeText(input);
    const normTarget = normalizeText(selectedQuiz!.keyPhrase);
    // 単文として完全に抜き出せなくても、キーワードが含まれていればOKとする
    const isCorrect = normInput === normTarget || normInput.includes(normTarget) || normTarget.includes(normInput);

    if (isCorrect) {
      setFeedback('correct');
      if (!bonusEarned) { // Weight 5 for bonus
        setBonusEarned(true);
      }
    } else {
      setFeedback('incorrect');
    }

    setTimeout(() => {
      finishQuiz();
    }, 1500);
  };

  // Sync voice transcript to typing input for bonus (Azure未設定のWeb Speech時のみ)
  useEffect(() => {
    if (!azureAvailable && quizState === 'bonus' && transcript) {
      setTypingInput(transcript);
    }
  }, [azureAvailable, transcript, quizState]);

  // Azureの発音採点でボーナス課題（キーフレーズの音読）を判定する。
  // 自動で次に進まず、録音の聞き返しや読み直しを自分のペースでできるようにする。
  const handleAzureBonus = async () => {
    if (isAssessing || !selectedQuiz) return;

    const result = await assess(selectedQuiz.keyPhrase);
    if (!result) return; // 通信エラー等。ノーカウントで再挑戦。

    // 採点は accuracyScore（発音の正確さ）で統一（なめらかさ等で不当に下がるのを防ぐ）
    setBonusScore(result.accuracyScore);
    setTypingInput(result.recognizedText);
    addScore('textbook', result.accuracyScore, selectedQuiz.keyPhrase);

    if (result.accuracyScore >= BONUS_PASS_SCORE) {
      setFeedback('correct');
      if (!bonusEarned) { // Weight 5 for bonus（一度だけ）
        setBonusEarned(true);
      }
    } else {
      setFeedback('incorrect');
    }
  };

  const proceedToNext = () => {
    setTimeout(() => {
      if (currentQuestionIndex < selectedQuiz!.questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        resetQuestionState();
      } else if (selectedQuiz!.noBonus) {
        finishQuiz(); // ボーナスなし：4問で完了
      } else {
        setQuizState('bonus');
        resetQuestionState();
      }
    }, 1500);
  };

  const finishQuiz = async () => {
    setQuizState('completed');
    // ポイントは「正答率」でスケールする。適当に押して完了しても点が入らないように、
    // 正答率が半分未満なら加点しない（まっとうに解いた分だけ加点＝チート抑止）。
    // 繰り返すほど加点は逓減する（addPoints内で共通処理。最終的に0）。
    const total = selectedQuiz!.questions.length;
    const ratio = total > 0 ? correctCount / total : 0;
    if (ratio < 0.5) {
      setEarnedPoints(0); // ほとんど不正解 → 今回は加点なし（もう一回！）
      return;
    }
    const pts = await addPoints(`textbook_quiz_${selectedQuiz!.id}`, {
      multiplier: ratio,               // 正答率でスケール（全問正解＝満額）
      isPerfect: correctCount === total,
    });
    setEarnedPoints(pts);
  };

  // 学年はTOPカードでえらぶ前提なので、ここでは必ず5/6が入っている（保険のガード）
  if (!grade) return null;

  // ?set=worldbento のときは World Bento クイズ（国別）を表示。通常は学年の教科書Unit。
  const isWorldBento = searchParams.get('set') === 'worldbento';
  const listQuizzes = isWorldBento ? WORLD_BENTO_QUIZZES : quizzes.filter(q => q.grade === grade);

  return (
    <div className="flex-col" style={{ flex: 1, padding: '2rem', gap: '1.5rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={goBack} icon={ArrowLeft}>もどる</Button>
        <h2 className="text-primary" style={{ margin: 0, fontSize: '1.8rem', flex: 1, textAlign: 'center' }}>
          {isWorldBento ? '🍱 世界の料理クイズ' : `📖 ${grade}年生の教科書`}
        </h2>
      </div>

      {quizState === 'idle' && (
        <>
          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 184, 148, 0.1)', border: '2px solid #00b894' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#2d3436' }}>
              📺 まずUnitの「<strong>動画を見る</strong>」ボタンで動画を見よう。<br/>
              見終わったら「<strong>クイズに挑戦</strong>」でポイントをもらおう！
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <HelpCircle color="var(--color-primary)" />
            <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.3rem' }}>Unitクイズ一覧</h3>
          </div>

          {listQuizzes.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              まだこの学年のクイズはありません。
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {listQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="glass-card"
                  style={{ padding: '1.5rem', background: 'white', border: '2px solid #e2e8f0' }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '1.2rem' }}>
                    {quiz.unitName}
                  </h4>
                  <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    {quiz.questions.length}問のクイズ{quiz.noBonus ? '' : ' ＋ ボーナス課題'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {quiz.url && (
                      <button
                        onClick={() => window.open(quiz.url, '_blank')}
                        style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: '2px solid #00b894', background: 'rgba(0, 184, 148, 0.1)', color: '#00b894', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      >
                        📺 動画を見る
                      </button>
                    )}
                    <button
                      onClick={() => handleQuizSelect(quiz)}
                      className="hover-scale"
                      style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                      ✏️ クイズに挑戦
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {quizState === 'playing' && selectedQuiz && (() => {
        const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
        return (
        <div className="glass-card animate-pop" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.3rem' }}>
                {selectedQuiz.unitName}
              </h3>
              <span style={{ display: 'inline-block', background: '#e2e8f0', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginTop: '0.5rem' }}>
                📺 {currentQuestion.videoRef}
              </span>
            </div>
            <span style={{ fontWeight: 'bold', color: '#64748b', fontSize: '1.1rem' }}>
              {currentQuestionIndex + 1} / {selectedQuiz.questions.length}
            </span>
          </div>

          <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '16px', marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', lineHeight: '1.6' }}>
              {currentQuestion.question}
            </p>
          </div>

          {currentQuestion.type === 'choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectAnswer = idx === currentQuestion.correctIndex;
                
                let bgColor = 'white';
                let borderColor = '#e2e8f0';
                let textColor = '#2d3436';
                if (isChecking) {
                  if (isCorrectAnswer) {
                    bgColor = 'var(--color-success)';
                    borderColor = 'var(--color-success)';
                    textColor = 'white';
                  } else if (isSelected) {
                    bgColor = 'var(--color-error)';
                    borderColor = 'var(--color-error)';
                    textColor = 'white';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleChoiceSubmit(idx)}
                    disabled={isChecking}
                    style={{
                      padding: '1.2rem 1.5rem',
                      borderRadius: '12px',
                      border: `2px solid ${borderColor}`,
                      background: bgColor,
                      color: textColor,
                      fontSize: '1.2rem',
                      cursor: isChecking ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      fontWeight: 'bold'
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'typing' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  value={typingInput}
                  onChange={(e) => setTypingInput(e.target.value)}
                  disabled={isChecking}
                  placeholder="英語で入力してね"
                  style={{ flex: 1, padding: '1rem 1.5rem', fontSize: '1.2rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTypingSubmit();
                  }}
                />
                <Button 
                  onClick={handleTypingSubmit} 
                  disabled={isChecking || !typingInput.trim()}
                  style={{ padding: '0 2rem' }}
                >
                  <Send size={20} />
                </Button>
              </div>
              {isChecking && feedback === 'incorrect' && (
                <div style={{ color: 'var(--color-error)', fontWeight: 'bold', marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
                  ❌ おしい！正解は: {currentQuestion.correctAnswer}
                </div>
              )}
              {isChecking && feedback === 'correct' && (
                <div style={{ color: 'var(--color-success)', fontWeight: 'bold', marginTop: '1rem', padding: '1rem', background: '#dcfce7', borderRadius: '8px' }}>
                  ✅ 正解！
                </div>
              )}
            </div>
          )}
        </div>
        );
      })()}

      {quizState === 'bonus' && selectedQuiz && (
        <div className="glass-card animate-pop" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
          <h2 style={{ color: '#d97706', fontSize: '2rem', margin: '0 0 1rem 0' }}>🌟 ボーナス課題 🌟</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#451a03', marginBottom: '2rem' }}>
            動画の最後に出てくるフレーズ（単文）を答えよう！<br/>
            （マイクで話すか、タイピングしてね。多少間違えても大丈夫！）
          </p>

          <div style={{ padding: '2rem', background: 'white', borderRadius: '16px', border: '2px solid #fde68a', marginBottom: '2rem' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
              「{selectedQuiz.keyPhraseJapanese}」
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                value={typingInput}
                onChange={(e) => setTypingInput(e.target.value)}
                disabled={isChecking}
                placeholder="Type or use mic..."
                style={{ flex: 1, padding: '1rem', fontSize: '1.2rem', borderRadius: '12px', border: '2px solid #e2e8f0' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBonusSubmit(typingInput);
                }}
              />
              <button
                onClick={() => {
                  if (azureAvailable) {
                    setBonusScore(null);
                    handleAzureBonus();
                  } else {
                    isRecording ? stopListening() : startListening();
                  }
                }}
                disabled={isChecking || (azureAvailable && isAssessing)}
                title={azureAvailable ? '英語のフレーズを声に出して読んでね' : undefined}
                style={{
                  padding: '0 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: (azureAvailable ? isAssessing : isRecording) ? 'var(--color-error)' : 'var(--color-primary)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Mic size={24} className={(azureAvailable ? isAssessing : isRecording) ? 'animate-pulse' : ''} />
              </button>
              {azureAvailable && lastRecordingUrl && !isAssessing && (
                <button
                  onClick={() => new Audio(lastRecordingUrl).play()}
                  title="さっきの自分の声を聞く"
                  style={{ padding: '0 1.2rem', borderRadius: '12px', border: '2px solid var(--color-primary)', background: 'white', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '1.4rem', flexShrink: 0 }}
                >
                  🔊
                </button>
              )}
            </div>

            {azureAvailable ? (
              <p style={{ fontSize: '0.9rem', color: '#92400e', margin: 0 }}>
                🎤 マイクを押して、英語のフレーズを声に出して読んでね（発音を採点するよ）。タイピングで答えてもOK。
              </p>
            ) : null}

            <Button
              onClick={() => handleBonusSubmit(typingInput)}
              disabled={isChecking || !typingInput.trim()}
              style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', background: '#d97706' }}
            >
              {azureAvailable ? 'タイピングで答える' : '回答する！'}
            </Button>

            {azureAvailable && bonusScore !== null && (
              <div
                className="animate-pop"
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: bonusScore >= BONUS_PASS_SCORE ? 'var(--color-success)' : 'var(--color-error)'
                }}
              >
                発音スコア: {Math.round(bonusScore)} 点 {bonusScore >= BONUS_PASS_SCORE ? '✅' : '（おしい！）'}
              </div>
            )}

            {(isChecking || azureAvailable) && feedback === 'incorrect' && (
              <div style={{ color: 'var(--color-error)', fontWeight: 'bold', marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
                ❌ おしい！正解は: {selectedQuiz.keyPhrase}
              </div>
            )}
            {(isChecking || azureAvailable) && feedback === 'correct' && (
              <div style={{ color: 'var(--color-success)', fontWeight: 'bold', marginTop: '1rem', padding: '1rem', background: '#dcfce7', borderRadius: '8px' }}>
                🎉 大正解！ボーナスポイントGET！
              </div>
            )}

            {azureAvailable && (
              <Button
                variant="outline"
                onClick={finishQuiz}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {bonusEarned ? 'おわってけっかを見る →' : 'スキップしてけっかを見る →'}
              </Button>
            )}
          </div>
        </div>
      )}

      {quizState === 'completed' && selectedQuiz && (
        <div className="glass-card flex-col flex-center gap-md animate-pop" style={{ padding: '3rem' }}>
          <div>
            <div style={{ fontSize: '5rem' }}>{earnedPoints && earnedPoints > 0 ? '🏆' : '💪'}</div>
          </div>

          <h2 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '2rem' }}>
            {earnedPoints && earnedPoints > 0 ? 'Unit Clear!' : 'おしい！もう一回！'}
          </h2>

          <p style={{ fontSize: '1.3rem', margin: 0 }}>
            {selectedQuiz.questions.length}問中 <strong>{correctCount}</strong>問 正解
          </p>
          {earnedPoints !== null && (
            earnedPoints > 0 ? (
              <p style={{ fontSize: '1.3rem', margin: 0, color: 'var(--color-accent)', fontWeight: 'bold' }}>
                ＋{earnedPoints} ポイント！✨
              </p>
            ) : (
              <p style={{ fontSize: '1.05rem', margin: 0, color: '#94a3b8' }}>
                半分以上せいかいすると、ポイントがもらえるよ。動画をもう一回見てチャレンジ！
              </p>
            )
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => { setQuizState('idle'); setSelectedQuiz(null); }}>
              クイズ一覧にもどる
            </Button>
            <Button onClick={() => handleQuizSelect(selectedQuiz)}>
              もう一回チャレンジ！
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
