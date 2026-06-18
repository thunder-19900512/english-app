import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowLeft, Star } from 'lucide-react';
import { useReflections } from '../../hooks/useReflections';

export const ReflectionHistory: React.FC = () => {
  const navigate = useNavigate();
  const { reflections } = useReflections();

  return (
    <div className="flex-col flex-center gap-lg" style={{ minHeight: '100%', width: '100%' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outline" onClick={() => navigate('/reflection')} icon={ArrowLeft}>
          もどる
        </Button>
        <h1 className="text-primary" style={{ fontSize: '2rem', margin: 0 }}>これまでのきろく</h1>
        <div style={{ width: '100px' }} /> {/* Spacer */}
      </div>

      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reflections.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
            まだふりかえりがないよ。<br/>
            今日のぶんを書いてみよう！
          </div>
        ) : (
          reflections.map((ref) => {
            const d = new Date(ref.date);
            const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            
            return (
              <div key={ref.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.2rem', color: '#666' }}>{dateStr}</div>
                  <div style={{ display: 'flex' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star 
                        key={num}
                        size={20}
                        fill={num <= ref.stars ? "var(--color-accent)" : "transparent"}
                        color={num <= ref.stars ? "var(--color-accent)" : "#ccc"}
                      />
                    ))}
                  </div>
                </div>
                {ref.comment && (
                  <div style={{ fontSize: '1.2rem', padding: '1rem', background: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap' }}>
                    {ref.comment}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
