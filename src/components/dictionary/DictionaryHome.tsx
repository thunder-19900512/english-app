import React from 'react';
import { useNavigate } from 'react-router-dom';
import { vocabulary } from '../../data/vocabulary';
import { Button } from '../ui/Button';
import { ArrowLeft, BookOpen } from 'lucide-react';

export const DictionaryHome: React.FC = () => {
  const navigate = useNavigate();
  
  // Get unique categories
  const categories = Array.from(new Set(vocabulary.map(v => v.category)));

  return (
    <div className="flex-col flex-center gap-xl" style={{ minHeight: '100%' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
        <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>
          ホームにもどる
        </Button>
      </div>
      
      <div className="flex-col flex-center gap-sm">
        <BookOpen size={64} color="var(--color-primary)" />
        <h1 className="text-primary" style={{ fontSize: '3rem', margin: 0 }}>Picture Dictionary</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>単元を選んで単語を練習しよう！</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '800px' }}>
        {categories.map((category, idx) => (
          <div 
            key={idx} 
            className="glass-card flex-col flex-center animate-pop"
            style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate(`/dictionary/${encodeURIComponent(category)}`)}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-primary)' }}>{category}</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
              {vocabulary.filter(v => v.category === category).length} words
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
