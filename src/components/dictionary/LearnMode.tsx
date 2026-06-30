import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVocabulary } from '../../hooks/useVocabulary';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useDictionaryProgress } from '../../hooks/useDictionaryProgress';
import { Button } from '../ui/Button';
import { ArrowLeft, Volume2, Headphones, RefreshCw } from 'lucide-react';

// 学習モード：音を聞いてインプットするだけの練習。
// ・発音認識（マイク採点）は精度が低いので廃止し、「聞く」のみに。
// ・聞くだけでポイントが入る＝荒稼ぎ（チート）になるため、ポイントは付与しない。
//   「学習した」記録（先生画面の辞書進捗）だけ残す。
export const LearnMode: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const decodedCategory = decodeURIComponent(category || '');
  const { speak } = useSpeechSynthesis();
  const { saveProgress } = useDictionaryProgress();
  const vocabulary = useVocabulary();

  const words = React.useMemo(() => vocabulary.filter(v => v.category === decodedCategory), [decodedCategory, vocabulary]);

  const [clickedWords, setClickedWords] = useState<Set<string>>(new Set());
  const [listenCleared, setListenCleared] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleWordClick = (word: typeof vocabulary[0]) => {
    speak(word.english);
    const newSet = new Set(clickedWords).add(word.id);
    setClickedWords(newSet);

    if (newSet.size === words.length && !listenCleared && words.length > 0) {
      setListenCleared(true);
      saveProgress(decodedCategory, { learn: true }); // 進捗だけ記録（ポイントなし）
      setShowCelebration(true);
    }
  };

  const resetSession = () => {
    setClickedWords(new Set());
    setListenCleared(false);
    setShowCelebration(false);
  };

  if (showCelebration) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>ぜんぶきけたね！</h1>
        <div className="animate-float">
          <Headphones size={100} color="var(--color-accent)" />
        </div>
        <p style={{ fontSize: '1.5rem' }}>
          学習モード（リスニング）でしっかりインプットできたよ！<br />
          つぎはクイズやゲームでポイントをゲットしよう！🎮
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={resetSession} variant="outline" icon={RefreshCw}>もう一度きく</Button>
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
        <p style={{ fontSize: '1.2rem', color: '#666' }}>カードをタップして、音をよくきいてみよう！🎧</p>
        <div style={{ fontWeight: 'bold', color: 'var(--color-accent)', fontSize: '1.2rem' }}>
          🎧 きいた: {clickedWords.size} / {words.length}
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
              background: clickedWords.has(word.id) ? 'rgba(72, 219, 251, 0.2)' : 'rgba(255,255,255,0.8)',
              border: clickedWords.has(word.id) ? '2px solid var(--color-primary)' : '1px solid transparent'
            }}
            onClick={() => handleWordClick(word)}
          >
            {word.imageUrl
              ? <img src={word.imageUrl} alt={word.english} style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem' }} />
              : <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{word.emoji}</div>}
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
              {word.english}
            </h2>
            <p style={{ margin: '0.5rem 0 1rem 0', color: '#666', fontSize: '1.1rem' }}>
              {word.japanese}
            </p>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
              <Button
                onClick={(e) => { e.stopPropagation(); handleWordClick(word); }}
                icon={Volume2}
                style={{ width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
