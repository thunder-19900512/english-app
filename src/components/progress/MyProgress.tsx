import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';
import { vocabulary } from '../../data/vocabulary';
import { stages } from '../../data/stages';
import { DEFAULT_QUIZZES } from '../textbook/textbookQuizData';
import { useDictionaryProgress, type DictCategoryProgress } from '../../hooks/useDictionaryProgress';

// 1カテゴリで挑戦できる4つのスキル。現在地マップの軸になる。
const SKILLS: { key: keyof DictCategoryProgress; label: string; emoji: string; path: string }[] = [
  { key: 'practice', label: '選択', emoji: '🎯', path: 'practice' },
  { key: 'wordsearch', label: '言葉さがし', emoji: '🔍', path: 'game/wordsearch' },
  { key: 'spelling', label: 'タイピング', emoji: '⌨️', path: 'game/spelling' },
  { key: 'voice', label: '発音', emoji: '🎤', path: 'game/voice' },
];

// 進捗リング（％を円グラフで表示）
const Ring: React.FC<{ pct: number; color: string; label: string; sub: string; emoji: string }> = ({ pct, color, label, sub, emoji }) => {
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <div className="glass-card flex-col flex-center" style={{ padding: '1.2rem', gap: '0.4rem' }}>
      <div style={{ position: 'relative', width: '110px', height: '110px' }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={R} fill="none" stroke="#e2e8f0" strokeWidth="11" />
          <circle
            cx="55" cy="55" r={R} fill="none"
            stroke={color} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (C * pct) / 100}
            transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <text x="55" y="52" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>{pct}%</text>
          <text x="55" y="72" textAnchor="middle" fontSize="11" fill="#666">{sub}</text>
        </svg>
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#2d3436', textAlign: 'center' }}>{emoji} {label}</div>
    </div>
  );
};

export const MyProgress: React.FC = () => {
  const navigate = useNavigate();
  const { progress } = useDictionaryProgress();

  const categories = useMemo(() => Array.from(new Set(vocabulary.map(v => v.category))), []);

  const studentId = localStorage.getItem('studentId');
  const points = parseInt(localStorage.getItem(`points_${studentId}`) || '0', 10);
  const badges: number[] = useMemo(() => {
    const dataStr = studentId ? localStorage.getItem(`student_${studentId}`) : null;
    return dataStr ? (JSON.parse(dataStr).badges || []) : [];
  }, [studentId]);
  const clearCounts: Record<string, number> = useMemo(() => {
    const str = studentId ? localStorage.getItem(`clearCounts_${studentId}`) : null;
    return str ? JSON.parse(str) : {};
  }, [studentId]);

  // 各カテゴリの達成スキル数（0〜4）を計算（Picture Dictionary）
  const catStats = useMemo(() => {
    return categories.map(cat => {
      const p = progress[cat] || {};
      const done = SKILLS.filter(s => (p as any)[s.key]).length;
      return { cat, done, p };
    });
  }, [categories, progress]);

  // ===== 3領域のざっくり進捗 =====
  // フォニックス：クリアしたステージ数 / 全ステージ
  const phonicsPct = stages.length > 0 ? Math.round((badges.length / stages.length) * 100) : 0;

  // Picture Dictionary：達成スキル数 / (単元数 × 4スキル)
  const dictDone = catStats.reduce((sum, c) => sum + c.done, 0);
  const dictTotal = categories.length * SKILLS.length;
  const dictPct = dictTotal > 0 ? Math.round((dictDone / dictTotal) * 100) : 0;
  const masteredCount = catStats.filter(c => c.done === SKILLS.length).length;

  // 教科書モード：クリアしたUnit数 / 全Unit
  const textbookDone = DEFAULT_QUIZZES.filter(q => (clearCounts[`textbook_quiz_${q.id}`] || 0) > 0).length;
  const textbookPct = DEFAULT_QUIZZES.length > 0 ? Math.round((textbookDone / DEFAULT_QUIZZES.length) * 100) : 0;

  // 「次にやるといいよ」：まだ達成が少ない順に、最初の未挑戦スキルをおすすめ
  const recommendations = useMemo(() => {
    return catStats
      .filter(c => c.done < SKILLS.length)
      .sort((a, b) => a.done - b.done)
      .slice(0, 3)
      .map(c => {
        const nextSkill = SKILLS.find(s => !(c.p as any)[s.key])!;
        return { cat: c.cat, skill: nextSkill };
      });
  }, [catStats]);

  const colorFor = (done: number) => {
    if (done === SKILLS.length) return { bg: 'rgba(0, 184, 148, 0.15)', border: '#00b894', label: 'マスター！', labelColor: '#00b894' };
    if (done > 0) return { bg: 'rgba(253, 203, 110, 0.15)', border: '#fdcb6e', label: 'がんばり中', labelColor: '#b45309' };
    return { bg: 'rgba(0,0,0,0.03)', border: '#e2e8f0', label: 'まだ', labelColor: '#94a3b8' };
  };

  return (
    <div className="flex-col gap-lg" style={{ flex: 1, maxWidth: '900px', margin: '0 auto', width: '100%', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>もどる</Button>
        <h1 className="text-primary" style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '1.8rem', marginRight: '90px' }}>
          🗺️ じぶんの記録
        </h1>
      </div>

      {/* 3領域のざっくり進捗 */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <Ring pct={phonicsPct} color="#ff6b6b" emoji="🔤" label="Phonics" sub={`${badges.length}/${stages.length}`} />
        <Ring pct={dictPct} color="#48dbfb" emoji="📚" label="Picture Dictionary" sub={`${masteredCount}/${categories.length} 単元`} />
        <Ring pct={textbookPct} color="#00b894" emoji="📖" label="教科書モード" sub={`${textbookDone}/${DEFAULT_QUIZZES.length} Unit`} />
      </div>

      {/* ポイント・トロフィー */}
      <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
          <Star size={24} color="var(--color-accent)" fill="var(--color-accent)" />
          <span><strong>{points}</strong> ポイント</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
          <Trophy size={24} color="var(--color-accent)" />
          <span>バッジ <strong>{badges.length}</strong> 個</span>
        </div>
      </div>

      {/* おすすめ */}
      {recommendations.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(162, 155, 254, 0.12)', border: '2px solid #a29bfe' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#6c5ce7' }}>✨ つぎにやってみよう！</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
            {recommendations.map(({ cat, skill }) => (
              <button
                key={cat + skill.key}
                className="hover-scale"
                onClick={() => navigate(`/dictionary/${encodeURIComponent(cat)}/${skill.path}`)}
                style={{ padding: '0.8rem 1.2rem', borderRadius: '12px', border: '2px solid #a29bfe', background: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#6c5ce7', fontSize: '1rem' }}
              >
                {skill.emoji} {cat} の{skill.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Picture Dictionary 単元ごとの現在地 */}
      <div>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>📍 Picture Dictionary 単元ごとの現在地</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {catStats.map(({ cat, done, p }) => {
            const c = colorFor(done);
            return (
              <div
                key={cat}
                className="glass-card hover-scale"
                style={{ padding: '1.2rem', background: c.bg, border: `2px solid ${c.border}`, cursor: 'pointer' }}
                onClick={() => navigate('/dictionary')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2d3436' }}>{cat}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: c.labelColor }}>{c.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                  {SKILLS.map(s => {
                    const ok = !!(p as any)[s.key];
                    return (
                      <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', opacity: ok ? 1 : 0.35 }}>
                        <div style={{ fontSize: '1.4rem', filter: ok ? 'none' : 'grayscale(1)' }}>{s.emoji}</div>
                        <div style={{ fontSize: '0.7rem', color: ok ? c.labelColor : '#94a3b8' }}>{ok ? '✓' : '−'}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: '0.8rem', height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(done / SKILLS.length) * 100}%`, height: '100%', background: c.border, transition: 'width 0.4s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
