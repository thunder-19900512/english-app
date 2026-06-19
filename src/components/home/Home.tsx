import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stages } from '../../data/stages';
import { Trophy, Lock, BookOpen, Target, Keyboard, Mic, Search, CheckCircle, Star, MessageCircleQuestion } from 'lucide-react';
import { Button } from '../ui/Button';
import { vocabulary } from '../../data/vocabulary';
import { pushToSupabase } from '../../lib/sync';
import { useDictionaryProgress } from '../../hooks/useDictionaryProgress';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [earnedBadges, setEarnedBadges] = useState<number[]>([]);
  const [studentName, setStudentName] = useState<string>('ゲスト');
  const [activeTab, setActiveTab] = useState<'phonics' | 'dictionary'>('phonics');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { progress } = useDictionaryProgress();
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    // Auto-sync local data to Supabase when returning to home
    if (studentId) {
      pushToSupabase(studentId);
    }
  }, [studentId]);

  // Get unique categories for dictionary
  const categories = Array.from(new Set(vocabulary.map(v => v.category)));

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      navigate('/');
      return;
    }

    const dataStr = localStorage.getItem(`student_${studentId}`);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      setEarnedBadges(data.badges || []);
      setStudentName(data.name || 'ゲスト');
    }
  }, [navigate]);

  const allCleared = earnedBadges.length === stages.length;

  return (
    <div className="flex-col gap-lg" style={{ flex: 1 }}>
      <div className="flex-col flex-center gap-sm">
        <h1 className="text-primary" style={{ fontSize: '2.5rem', margin: 0 }}>こんにちは、{studentName}さん！</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>きょうもえいごをたのしもう！</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', width: '100%', maxWidth: '900px', marginBottom: '2rem' }}>
        <div 
          className="glass-card flex-col flex-center animate-pop"
          style={{ padding: '2rem', cursor: 'pointer', background: activeTab === 'phonics' ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 107, 107, 0.1)', border: activeTab === 'phonics' ? '2px solid var(--color-primary)' : '1px solid transparent' }}
          onClick={() => setActiveTab('phonics')}
        >
          <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-primary)' }}>Phonics</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', textAlign: 'center' }}>音と文字のルールを学ぼう！<br/>(全6ステージ)</p>
        </div>

        <div 
          className="glass-card flex-col flex-center animate-pop"
          style={{ padding: '2rem', cursor: 'pointer', background: activeTab === 'dictionary' ? 'rgba(72, 219, 251, 0.4)' : 'rgba(72, 219, 251, 0.1)', border: activeTab === 'dictionary' ? '2px solid var(--color-primary)' : '1px solid transparent' }}
          onClick={() => setActiveTab('dictionary')}
        >
          <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-primary)' }}>Picture Dictionary</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', textAlign: 'center' }}>英単語のれんしゅうと<br/>ミニゲームであそぼう！</p>
        </div>

        <div 
          className="glass-card flex-col flex-center animate-pop"
          style={{ padding: '2rem', cursor: 'pointer', background: 'rgba(253, 203, 110, 0.2)', border: '2px solid var(--color-accent)' }}
          onClick={() => navigate('/reflection')}
        >
          <Star size={40} color="var(--color-accent)" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#000' }}>今日のふりかえり</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', textAlign: 'center' }}>がんばりをきろくして<br/>ポイントゲット！</p>
        </div>
      </div>

      {/* Phonics Progress Dashboard */}
      {activeTab === 'phonics' && (
        <div style={{ width: '100%', maxWidth: '800px' }} className="animate-pop">
          <h2 style={{ textAlign: 'center', color: '#444', marginBottom: '1rem' }}>Phonics パスポート</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {stages.map((stage) => {
            const isCleared = earnedBadges.includes(stage.id);
            
            return (
              <div 
                key={stage.id}
                className="glass-card flex-col flex-center"
                style={{ 
                  cursor: 'pointer', 
                  transform: isCleared ? 'scale(1.02)' : 'scale(1)',
                  border: isCleared ? `2px solid var(--color-success)` : '1px solid var(--glass-border)',
                  opacity: isCleared ? 1 : 0.8
                }}
                onClick={() => navigate(`/stage/${stage.id}`)}
              >
                <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '1rem' }}>
                  {isCleared ? (
                    <div className="animate-float" style={{ color: 'var(--color-accent)' }}>
                      <Trophy size={80} />
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-muted)' }}>
                      <Lock size={80} />
                    </div>
                  )}
                </div>
                <h3 style={{ textAlign: 'center' }}>Stage {stage.id}</h3>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  {stage.title}
                </p>
                {isCleared && (
                  <div style={{ marginTop: '0.5rem', color: 'var(--color-success)', fontWeight: 'bold' }}>
                    {stage.badgeName}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Picture Dictionary Dashboard */}
      {activeTab === 'dictionary' && (
        <div style={{ width: '100%', maxWidth: '800px' }} className="animate-pop">
          <h2 style={{ textAlign: 'center', color: '#444', marginBottom: '1rem' }}>Picture Dictionary 単元一覧</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {categories.map((category, idx) => (
              <React.Fragment key={idx}>
                <div 
                  className="glass-card flex-col flex-center"
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    background: expandedCategory === category ? 'rgba(72, 219, 251, 0.2)' : 'var(--glass-bg)',
                    border: expandedCategory === category ? '2px solid var(--color-primary)' : '1px solid var(--glass-border)'
                  }}
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  onMouseOver={(e) => { if (expandedCategory !== category) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.border = '2px solid var(--color-primary)'; } }}
                  onMouseOut={(e) => { if (expandedCategory !== category) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.border = '1px solid var(--glass-border)'; } }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>{category}</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {vocabulary.filter(v => v.category === category).length} words
                  </p>
                </div>

                {expandedCategory === category && (
                  <div className="glass-card flex-col flex-center animate-pop" style={{ gridColumn: '1 / -1', marginTop: '0.5rem', marginBottom: '1.5rem', padding: '2rem', background: 'rgba(255,255,255,0.9)', border: '2px dashed var(--color-primary)' }}>
                    <h2 className="text-primary" style={{ margin: '0 0 1rem 0' }}>【{expandedCategory}】のモードをえらぶ</h2>
                    
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', width: '100%', marginBottom: '2rem' }}>
                      <div 
                        className="glass-card flex-col flex-center animate-pop" 
                        style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(72, 219, 251, 0.2)' }}
                        onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/learn`)}
                      >
                        <BookOpen size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                        <h3 style={{ margin: 0 }}>学習モード</h3>
                      </div>

                      <div 
                        className="glass-card flex-col flex-center animate-pop" 
                        style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(29, 209, 161, 0.2)', position: 'relative' }}
                        onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/practice`)}
                      >
                        {(progress[expandedCategory]?.practice) && (
                          <div style={{ position: 'absolute', top: '-10px', right: '-10px', color: 'var(--color-success)' }}>
                            <CheckCircle size={28} fill="#fff" />
                          </div>
                        )}
                        <Target size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                        <h3 style={{ margin: 0 }}>選択モード</h3>
                      </div>

                      <div 
                        className="glass-card flex-col flex-center animate-pop" 
                        style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(255, 159, 67, 0.2)', position: 'relative' }}
                        onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/game/spelling`)}
                      >
                        {(progress[expandedCategory]?.spelling) && (
                          <div style={{ position: 'absolute', top: '-10px', right: '-10px', color: 'var(--color-success)' }}>
                            <CheckCircle size={28} fill="#fff" />
                          </div>
                        )}
                        <Keyboard size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                        <h3 style={{ margin: 0 }}>タイピングモード</h3>
                      </div>

                      <div 
                        className="glass-card flex-col flex-center animate-pop" 
                        style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(255, 107, 107, 0.2)' }}
                        onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/game/voice`)}
                      >
                        <Mic size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                        <h3 style={{ margin: 0 }}>モンスターバトル</h3>
                      </div>

                      <div 
                        className="glass-card flex-col flex-center animate-pop" 
                        style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(253, 121, 168, 0.2)' }}
                        onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/game/qa`)}
                      >
                        <MessageCircleQuestion size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                        <h3 style={{ margin: 0 }}>QAモード</h3>
                      </div>

                      <div 
                        className="glass-card flex-col flex-center animate-pop" 
                        style={{ padding: '1.5rem', background: 'rgba(162, 155, 254, 0.2)', opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        <Search size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                        <h3 style={{ margin: 0 }}>言葉さがし<br/><span style={{ fontSize: '0.8rem', color: '#666' }}>(じゅんび中)</span></h3>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>


        </div>
      )}

      {allCleared && (
        <div className="flex-center" style={{ marginTop: '2rem', animation: 'float 3s infinite' }}>
          <Button 
            onClick={() => navigate('/certificate')}
            style={{ fontSize: '1.5rem', padding: '1.5rem 3rem', background: 'var(--color-accent)', color: 'var(--color-text-main)' }}
            icon={Star}
          >
            修了証を見る！
          </Button>
        </div>
      )}
    </div>
  );
};
