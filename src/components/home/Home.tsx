import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stages } from '../../data/stages';
import { Trophy, Lock, BookOpen, Target, Keyboard, Mic, Search, CheckCircle, Star, MessageCircleQuestion, Sparkles, Book } from 'lucide-react';
import { Button } from '../ui/Button';
import { vocabulary } from '../../data/vocabulary';
import { pushToSupabase } from '../../lib/sync';
import { useDictionaryProgress } from '../../hooks/useDictionaryProgress';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [earnedBadges, setEarnedBadges] = useState<number[]>([]);
  const [studentName, setStudentName] = useState<string>('ゲスト');
  const [activeTab, setActiveTab] = useState<'phonics' | 'dictionary' | null>(null);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '900px', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="flex-col gap-sm">
          <h1 className="text-primary" style={{ fontSize: '2.5rem', margin: 0 }}>こんにちは、{studentName}さん！</h1>
          <p style={{ fontSize: '1.2rem', color: '#666', margin: 0 }}>きょうもえいごをたのしもう！</p>
        </div>
        <div 
          className="glass-card animate-pop hover-scale"
          style={{ padding: '0.8rem 1.5rem', cursor: 'pointer', background: 'rgba(253, 203, 110, 0.2)', border: '2px solid var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => navigate('/reflection')}
        >
          <Star size={24} color="var(--color-accent)" />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#000' }}>今日のふりかえり</span>
        </div>
      </div>

      {!activeTab && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '900px', marginBottom: '2rem' }}>
          <div 
            className="glass-card flex-col flex-center animate-pop hover-scale"
            style={{ padding: '2rem', cursor: 'pointer', background: 'rgba(255, 107, 107, 0.2)', border: '2px solid transparent' }}
            onClick={() => setActiveTab('phonics')}
          >
            <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-primary)' }}>Phonics</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', textAlign: 'center' }}>音と文字のルールを学ぼう！<br/>(全6ステージ)</p>
          </div>

          <div 
            className="glass-card flex-col flex-center animate-pop hover-scale"
            style={{ padding: '2rem', cursor: 'pointer', background: 'rgba(72, 219, 251, 0.2)', border: '2px solid transparent' }}
            onClick={() => setActiveTab('dictionary')}
          >
            <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-primary)' }}>Picture Dictionary</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', textAlign: 'center' }}>英単語のれんしゅうと<br/>ミニゲームであそぼう！</p>
          </div>

          <div 
            className="glass-card flex-col flex-center animate-pop hover-scale"
            style={{ padding: '2rem', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%)', border: '2px solid #d946ef' }}
            onClick={() => navigate('/story')}
          >
            <Book size={40} color="#d946ef" style={{ marginBottom: '0.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#000' }}>おはなしづくり</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', textAlign: 'center' }}>覚えた単語で<br/>物語をつくろう！</p>
          </div>

          <div 
            className="glass-card flex-col flex-center animate-pop hover-scale"
            style={{ padding: '2rem', cursor: 'pointer', background: 'rgba(85, 239, 196, 0.2)', border: '2px solid #00b894' }}
            onClick={() => navigate('/textbook')}
          >
            <Book size={40} color="#00b894" style={{ marginBottom: '0.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#000' }}>教科書モード</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', textAlign: 'center' }}>教科書を見て<br/>クイズにちょうせん！</p>
          </div>

          <div 
            className="glass-card flex-col flex-center animate-pop hover-scale"
            style={{ padding: '2rem', cursor: 'pointer', background: 'rgba(162, 155, 254, 0.2)', border: '2px solid #a29bfe' }}
            onClick={() => navigate('/ai')}
          >
            <Sparkles size={40} color="#a29bfe" style={{ marginBottom: '0.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#000' }}>AI英会話</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', textAlign: 'center' }}>AIキャラクターと<br/>声でえいかいわ！</p>
          </div>
        </div>
      )}

      {/* Phonics Progress Dashboard */}
      {activeTab === 'phonics' && (
        <div style={{ width: '100%', maxWidth: '800px' }} className="animate-pop">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Button variant="outline" onClick={() => setActiveTab(null)} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>← もどる</Button>
            <h2 style={{ flex: 1, textAlign: 'center', color: '#444', margin: 0, marginRight: '80px' }}>Phonics パスポート</h2>
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Button variant="outline" onClick={() => setActiveTab(null)} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>← もどる</Button>
            <h2 style={{ flex: 1, textAlign: 'center', color: '#444', margin: 0, marginRight: '80px' }}>Picture Dictionary 単元一覧</h2>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {categories.map((category, idx) => (
              <div 
                key={idx}
                className="glass-card flex-col flex-center hover-scale"
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)'
                }}
                onClick={() => setExpandedCategory(category)}
              >
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>{category}</h3>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  {vocabulary.filter(v => v.category === category).length} words
                </p>
              </div>
            ))}
          </div>

          {/* Modal for Dictionary Category Modes */}
          {expandedCategory && (
            <div className="modal-overlay" onClick={() => setExpandedCategory(null)}>
              <div className="modal-content animate-pop" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setExpandedCategory(null)}>✕</button>
                <h2 className="text-primary" style={{ margin: '0 0 1.5rem 0', textAlign: 'center', fontSize: '1.8rem' }}>【{expandedCategory}】のモードをえらぶ</h2>
                
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', width: '100%' }}>
                  <div 
                    className="glass-card flex-col flex-center hover-scale" 
                    style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(72, 219, 251, 0.2)' }}
                    onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/learn`)}
                  >
                    <BookOpen size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>学習モード</h3>
                  </div>

                  <div 
                    className="glass-card flex-col flex-center hover-scale" 
                    style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(162, 155, 254, 0.2)', position: 'relative' }}
                    onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/game/wordsearch`)}
                  >
                    {(progress[expandedCategory]?.wordsearch) && (
                      <div style={{ position: 'absolute', top: '-10px', right: '-10px', color: 'var(--color-success)' }}>
                        <CheckCircle size={28} fill="#fff" />
                      </div>
                    )}
                    <Search size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>言葉さがし</h3>
                  </div>

                  <div 
                    className="glass-card flex-col flex-center hover-scale" 
                    style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(29, 209, 161, 0.2)', position: 'relative' }}
                    onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/practice`)}
                  >
                    {(progress[expandedCategory]?.practice) && (
                      <div style={{ position: 'absolute', top: '-10px', right: '-10px', color: 'var(--color-success)' }}>
                        <CheckCircle size={28} fill="#fff" />
                      </div>
                    )}
                    <Target size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>選択モード</h3>
                  </div>

                  <div 
                    className="glass-card flex-col flex-center hover-scale" 
                    style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(255, 159, 67, 0.2)', position: 'relative' }}
                    onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/game/spelling`)}
                  >
                    {(progress[expandedCategory]?.spelling) && (
                      <div style={{ position: 'absolute', top: '-10px', right: '-10px', color: 'var(--color-success)' }}>
                        <CheckCircle size={28} fill="#fff" />
                      </div>
                    )}
                    <Keyboard size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>タイピング</h3>
                  </div>

                  <div 
                    className="glass-card flex-col flex-center hover-scale" 
                    style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(255, 107, 107, 0.2)' }}
                    onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/game/voice`)}
                  >
                    <Mic size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>モンスターバトル</h3>
                  </div>

                  <div 
                    className="glass-card flex-col flex-center hover-scale" 
                    style={{ padding: '1.5rem', cursor: 'pointer', background: 'rgba(253, 121, 168, 0.2)' }}
                    onClick={() => navigate(`/dictionary/${encodeURIComponent(expandedCategory)}/game/qa`)}
                  >
                    <MessageCircleQuestion size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>QAモード</h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {allCleared && (
        <div className="flex-center" style={{ marginTop: '2rem', animation: 'float 3s infinite', gap: '1rem', flexDirection: 'column' }}>
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
