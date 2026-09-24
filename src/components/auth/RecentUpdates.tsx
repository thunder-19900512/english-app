import React, { useState } from 'react';
import { UPDATES } from '../../data/updates';

// トップに出す「最近の更新」。最初は新しい3件だけ、「もっと見る」で全部。
export const RecentUpdates: React.FC = () => {
  const [all, setAll] = useState(false);
  if (UPDATES.length === 0) return null;
  const list = all ? UPDATES : UPDATES.slice(0, 3);
  const md = (d: string) => { const [, m, day] = d.split('-'); return `${Number(m)}/${Number(day)}`; };

  return (
    <div style={{
      maxWidth: '640px', width: '100%', margin: '0 auto', background: 'white',
      border: '2px solid var(--color-primary)', borderRadius: '14px', padding: '0.8rem 1rem',
    }}>
      <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.4rem' }}>📰 最近の更新</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {list.map((u, i) => (
          <li key={i} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.92rem', alignItems: 'baseline' }}>
            <span style={{ color: '#94a3b8', minWidth: '2.8rem' }}>{md(u.date)}</span>
            <span style={{ flex: 1 }}>
              {u.text}
              {u.fromVoice && (
                <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#b45309',
                  background: '#fef3c7', borderRadius: '999px', padding: '0.05rem 0.5rem', whiteSpace: 'nowrap' }}>
                  📮 みんなの声から
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {UPDATES.length > 3 && (
        <button onClick={() => setAll(v => !v)}
          style={{ marginTop: '0.4rem', border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
          {all ? '▲ とじる' : `▼ もっと見る（全${UPDATES.length}件）`}
        </button>
      )}
    </div>
  );
};
