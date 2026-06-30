import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVocabulary } from '../../hooks/useVocabulary';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useDictionaryProgress } from '../../hooks/useDictionaryProgress';
import { usePoints } from '../../hooks/usePoints';
import { Button } from '../ui/Button';
import { ArrowLeft, Volume2, RefreshCw, Trophy, CheckCircle2 } from 'lucide-react';

// 学習モード：音を聞いてインプットする練習。
// ・発音認識（マイク採点）は精度が低いので廃止し「聞く」のみに。
// ・ただし連打で秒で終わらせるチートを防ぐため、
//   「読み上げを最後まで聞いたカード」だけを“聞いた”としてカウントする。
//   （途中で別カードを押すと前の音はキャンセルされ、カウントされない）
// ・全部きちんと聞けたらポイント付与（繰り返すと逓減）。
export const LearnMode: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const decodedCategory = decodeURIComponent(category || '');
  const { speak } = useSpeechSynthesis();
  const { saveProgress } = useDictionaryProgress();
  const { addPoints } = usePoints();
  const vocabulary = useVocabulary();

  const words = React.useMemo(() => vocabulary.filter(v => v.category === decodedCategory), [decodedCategory, vocabulary]);

  const [heardWords, setHeardWords] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<{ points: number } | null>(null);

  // 今アクティブな（最後に押した）単語。連打時の取り違え防止に使う。
  const activeWordRef = useRef<string | null>(null);
  // ポイント二重付与ガード（完了処理は1回だけ）
  const awardedRef = useRef(false);

  const markHeard = (wordId: string) => {
    setHeardWords(prev => prev.has(wordId) ? prev : new Set(prev).add(wordId));
  };

  // 全部きちんと聞き終わったら、1回だけポイント付与＆クリア処理。
  useEffect(() => {
    if (!awardedRef.current && words.length > 0 && heardWords.size === words.length) {
      awardedRef.current = true;
      saveProgress(decodedCategory, { learn: true });
      // ちゃんと全部聞けたらポイント（繰り返すと逓減して最後は0）
      addPoints(`dict_learn_listen_${decodedCategory}`, { multiplier: 0.5 })
        .then(pts => setShowCelebration({ points: pts }));
    }
  }, [heardWords, words.length, decodedCategory, addPoints, saveProgress]);

  const handleWordClick = (word: typeof vocabulary[0]) => {
    activeWordRef.current = word.id;
    setPlayingId(word.id);
    speak(word.english, () => {
      // 読み上げが最後まで終わったときだけカウント。
      // 連打で割り込まれた音は activeWordRef が変わっているのでカウントされない。
      if (activeWordRef.current === word.id) {
        setPlayingId(null);
        markHeard(word.id);
      }
    });
  };

  const resetSession = () => {
    setHeardWords(new Set());
    setPlayingId(null);
    setShowCelebration(null);
    activeWordRef.current = null;
    awardedRef.current = false;
  };

  if (showCelebration) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>ぜんぶしっかりきけたね！</h1>
        <div className="animate-float">
          <Trophy size={100} color="var(--color-accent)" />
        </div>
        {showCelebration.points > 0 ? (
          <div className="animate-pop" style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
            +{showCelebration.points} ポイントゲット！✨
          </div>
        ) : (
          <p style={{ fontSize: '1.3rem', color: '#666' }}>このカテゴリはもうたくさん聞いたね！（ポイントは入りません）</p>
        )}
        <p style={{ fontSize: '1.4rem' }}>学習モード（リスニング）をクリアしたよ！</p>
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
        <p style={{ fontSize: '1.2rem', color: '#666' }}>カードをタップして、音を<b>さいごまで</b>よくきいてみよう！🎧</p>
        <div style={{ fontWeight: 'bold', color: 'var(--color-accent)', fontSize: '1.2rem' }}>
          🎧 きけた: {heardWords.size} / {words.length}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '900px', paddingBottom: '2rem' }}>
        {words.map((word) => {
          const heard = heardWords.has(word.id);
          const playing = playingId === word.id;
          return (
            <div
              key={word.id}
              className="glass-card flex-col flex-center animate-pop"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                position: 'relative',
                background: heard ? 'rgba(29, 209, 161, 0.2)' : playing ? 'rgba(72, 219, 251, 0.25)' : 'rgba(255,255,255,0.8)',
                border: heard ? '2px solid var(--color-success)' : playing ? '2px solid var(--color-primary)' : '1px solid transparent'
              }}
              onClick={() => handleWordClick(word)}
            >
              {heard && (
                <CheckCircle2 size={32} color="var(--color-success)" style={{ position: 'absolute', top: '10px', right: '10px' }} />
              )}
              {playing && !heard && (
                <div className="animate-pulse" style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '1.3rem' }}>🔊</div>
              )}

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
          );
        })}
      </div>
    </div>
  );
};
