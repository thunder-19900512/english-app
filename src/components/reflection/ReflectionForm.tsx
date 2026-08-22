import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeBack } from '../../hooks/useSafeBack';
import { Button } from '../ui/Button';
import { ArrowLeft, Star, Send } from 'lucide-react';
import { useReflections } from '../../hooks/useReflections';
import { usePoints } from '../../hooks/usePoints';

export const ReflectionForm: React.FC = () => {
  const navigate = useNavigate();
  const goBack = useSafeBack();
  const { reflections, saveReflection } = useReflections();
  const { addPoints } = usePoints();
  
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const HALF_DAY_MS = 12 * 60 * 60 * 1000;
  const lastReflectionDate = reflections.length > 0 ? new Date(reflections[0].date) : null;
  const canEarnPoints = !lastReflectionDate || (new Date().getTime() - lastReflectionDate.getTime() >= HALF_DAY_MS);

  const handleSubmit = async () => {
    if (stars === 0) return; // Require at least 1 star
    saveReflection(stars, comment);
    
    if (canEarnPoints) {
      // Give some small points (multiplier 0.25 -> 5 points first time)
      const pts = await addPoints('daily_reflection', { multiplier: 0.25 });
      setEarnedPoints(pts);
    } else {
      setEarnedPoints(0);
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '3rem' }}>ふりかえり完了！</h1>
        <div className="animate-float" style={{ fontSize: '6rem' }}>📝</div>
        {earnedPoints !== null && earnedPoints > 0 && (
          <div className="animate-pop" style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
            +{earnedPoints} ポイントゲット！✨
          </div>
        )}
        <p style={{ fontSize: '1.5rem' }}>えらい！今日もがんばったね！</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={() => navigate('/reflection/history')} variant="outline">これまでのふりかえり</Button>
          <Button onClick={() => navigate('/home')}>ホームにもどる</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col flex-center gap-lg" style={{ minHeight: '100%', width: '100%' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outline" onClick={goBack} icon={ArrowLeft}>
          もどる
        </Button>
        <h1 className="text-primary" style={{ fontSize: '2rem', margin: 0 }}>今日のふりかえり</h1>
        <Button variant="outline" onClick={() => navigate('/reflection/history')}>
          これまでの記録
        </Button>
      </div>

      <div 
        className="glass-card flex-col flex-center animate-pop"
        style={{ 
          width: '100%', 
          maxWidth: '600px', 
          padding: '3rem',
          background: 'rgba(255,255,255,0.9)'
        }}
      >
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
          今日の手ごたえはどうだった？
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <Star 
              key={num}
              size={48}
              fill={num <= stars ? "var(--color-accent)" : "transparent"}
              color={num <= stars ? "var(--color-accent)" : "#ccc"}
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => setStars(num)}
              className="hover-scale"
            />
          ))}
        </div>

        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
          かんそうをかこう！
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1rem', textAlign: 'center' }}>
          （ここがよかった・難しかった・こんな風に学びたい...など）
        </p>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="ここに入力してね"
          style={{
            width: '100%',
            height: '150px',
            padding: '1rem',
            fontSize: '1.2rem',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-primary)',
            resize: 'none',
            fontFamily: 'inherit'
          }}
        />

        <Button 
          onClick={handleSubmit} 
          icon={Send}
          disabled={stars === 0}
          style={{ 
            marginTop: '2rem', 
            padding: '1rem 3rem', 
            fontSize: '1.5rem',
            opacity: stars === 0 ? 0.5 : 1
          }}
        >
          {canEarnPoints ? '送ってポイントをもらう！' : '送って記録する'}
        </Button>
      </div>
    </div>
  );
};
