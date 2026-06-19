import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vocabulary } from '../../data/vocabulary';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Button } from '../ui/Button';
import { ArrowLeft, Volume2, Mic, Trophy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { usePoints } from '../../hooks/usePoints';

export const LearnMode: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const decodedCategory = decodeURIComponent(category || '');
  const { speak } = useSpeechSynthesis();
  const { isRecording, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { addPoints } = usePoints();

  const words = React.useMemo(() => vocabulary.filter(v => v.category === decodedCategory), [decodedCategory]);

  const [clickedWords, setClickedWords] = useState<Set<string>>(new Set());
  const [spokenWords, setSpokenWords] = useState<Set<string>>(new Set());
  
  const [listenCleared, setListenCleared] = useState(false);
  const [speakCleared, setSpeakCleared] = useState(false);

  const [showCelebration, setShowCelebration] = useState<{type: 'listen' | 'speak', points: number} | null>(null);

  const [recordingWordId, setRecordingWordId] = useState<string | null>(null);

  // Check pronunciation
  useEffect(() => {
    if (recordingWordId && transcript) {
      const targetWord = words.find(w => w.id === recordingWordId);
      if (targetWord) {
        // Tolerant check (remove punctuation, ignore case)
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalize(transcript) === normalize(targetWord.english)) {
          // Success
          const newSpoken = new Set(spokenWords).add(targetWord.id);
          setSpokenWords(newSpoken);
          
          if (newSpoken.size === words.length && !speakCleared && words.length > 0) {
            // All words spoken! (higher points)
            const savePoints = async () => {
              const pts = await addPoints(`dict_learn_speak_${decodedCategory}`, {
                multiplier: 0.5
              });
              setEarnedPoints(pts);
              setSpeakCleared(true);
              setShowCelebration({ type: 'speak', points: pts });
            };
            savePoints();
          }
        }
      }
      // Stop and reset
      stopListening();
      setRecordingWordId(null);
      setTranscript('');
    }
  }, [transcript, recordingWordId, words, spokenWords, speakCleared, decodedCategory, addPoints, stopListening, setTranscript]);

  const handleWordClick = (word: typeof vocabulary[0]) => {
    speak(word.english);
    const newSet = new Set(clickedWords).add(word.id);
    setClickedWords(newSet);

    if (newSet.size === words.length && !listenCleared && words.length > 0) {
      // All words clicked! (lower points)
      const savePoints = async () => {
        const pts = await addPoints(`dict_learn_listen_${decodedCategory}`, {
          multiplier: 0.5
        });
        setEarnedPoints(pts);
        setListenCleared(true);
        setShowCelebration({ type: 'listen', points: pts });
      };
      savePoints();
    }
  };

  const handleMicClick = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation(); // prevent card click
    if (isRecording) {
      stopListening();
      setRecordingWordId(null);
    } else {
      setRecordingWordId(wordId);
      setTranscript('');
      startListening();
    }
  };

  const resetSession = () => {
    setClickedWords(new Set());
    setSpokenWords(new Set());
    setListenCleared(false);
    setSpeakCleared(false);
    setShowCelebration(null);
  };

  if (showCelebration) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>
          {showCelebration.type === 'speak' ? 'ぜんぶはつおんできたね！' : 'ぜんぶきけたね！'}
        </h1>
        <div className="animate-float">
          <Trophy size={100} color="var(--color-accent)" />
        </div>
        <div className="animate-pop" style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
          +{showCelebration.points} ポイントゲット！✨
        </div>
        <p style={{ fontSize: '1.5rem' }}>
          学習モード（{showCelebration.type === 'speak' ? 'スピーキング' : 'リスニング'}）をクリアしたよ！
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {showCelebration.type === 'listen' && !speakCleared && (
            <Button onClick={() => setShowCelebration(null)} variant="outline">
              もどって発音にちょうせん！
            </Button>
          )}
          {showCelebration.type === 'speak' && (
            <Button onClick={resetSession} variant="outline" icon={RefreshCw}>もう一度</Button>
          )}
          <Button onClick={() => navigate(`/dictionary/${category}`)}>もどる</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col flex-center gap-lg" style={{ minHeight: '100%', width: '100%' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
        <Button variant="outline" onClick={() => navigate(`/dictionary/${category}`)} icon={ArrowLeft}>
          もどる
        </Button>
      </div>

      <div className="flex-col flex-center gap-sm" style={{ textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '2.5rem', margin: 0 }}>学習モード: {decodedCategory}</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>カードをタップして発音をきこう！マイクをおして発音もしてみよう！</p>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <div style={{ fontWeight: 'bold', color: 'var(--color-accent)', fontSize: '1.2rem' }}>
            🎧 きいた: {clickedWords.size} / {words.length}
          </div>
          <div style={{ fontWeight: 'bold', color: 'var(--color-success)', fontSize: '1.2rem' }}>
            🎤 いえた: {spokenWords.size} / {words.length}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '900px', paddingBottom: '2rem' }}>
        {words.map((word) => (
          <div 
            key={word.id} 
            className="glass-card flex-col flex-center animate-pop"
            style={{ 
              padding: '1.5rem', 
              cursor: 'pointer', 
              position: 'relative',
              background: spokenWords.has(word.id) ? 'rgba(29, 209, 161, 0.2)' : clickedWords.has(word.id) ? 'rgba(72, 219, 251, 0.2)' : 'rgba(255,255,255,0.8)',
              border: spokenWords.has(word.id) ? '2px solid var(--color-success)' : clickedWords.has(word.id) ? '2px solid var(--color-primary)' : '1px solid transparent'
            }}
            onClick={() => handleWordClick(word)}
          >
            {spokenWords.has(word.id) && (
              <CheckCircle2 size={32} color="var(--color-success)" style={{ position: 'absolute', top: '10px', right: '10px' }} />
            )}
            
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{word.emoji}</div>
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
              {word.english}
            </h2>
            <p style={{ margin: '0.5rem 0 1rem 0', color: '#666', fontSize: '1.1rem' }}>
              {word.japanese}
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
              <Button
                onClick={(e) => { e.stopPropagation(); handleWordClick(word); }}
                icon={Volume2}
                style={{ width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              />

              <Button
                onClick={(e) => handleMicClick(e, word.id)}
                icon={Mic}
                style={{
                  width: '50px', 
                  height: '50px', 
                  padding: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: '50%',
                  background: recordingWordId === word.id ? 'var(--color-error)' : 'var(--color-success)',
                  animation: recordingWordId === word.id ? 'pulse 1.5s infinite' : 'none'
                }}
              />
            </div>
            
            {recordingWordId === word.id && (
              <div className="animate-pop" style={{ position: 'absolute', bottom: '-40px', background: 'var(--color-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                {transcript || '（きいているよ...）'}
                <div style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid var(--color-primary)' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
