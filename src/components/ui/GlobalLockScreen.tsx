import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, PenLine } from 'lucide-react';
import { STAFF_TEST_ID } from '../../lib/trial';

export type LockMode = 'none' | 'screen' | 'reflection';

// 全員の画面にかぶせるロック。
//   screen     … 何もできない（スタッフの話を聞く）
//   reflection … ふりかえりを書く画面だけ使える。ほかの画面ではこのロックが出て、ボタンで ふりかえりへ
export const GlobalLockScreen: React.FC<{ mode: LockMode }> = ({ mode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Test（00）はロック対象外（ロック中にスタッフがデモを見せられるように）。
  // TestのログインにはPINが必要なので、子どもがここを抜け道にはできない。
  // おためし（99）はPIN無しで入れるので、子どもと同じにロックする。
  if (mode === 'none' || localStorage.getItem('studentId') === STAFF_TEST_ID) return null;

  const onReflection = location.pathname.startsWith('/reflection');
  if (mode === 'reflection' && onReflection) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textAlign: 'center',
      padding: '1rem',
    }}>
      {mode === 'reflection' ? (
        <>
          <PenLine size={80} color="var(--color-accent)" className="animate-pop" style={{ marginBottom: '2rem' }} />
          <h1 style={{ fontSize: '3.2rem', margin: 0 }}>✏️ ふりかえりの時間です</h1>
          <p style={{ fontSize: '1.4rem', marginTop: '1rem', color: '#ccc' }}>
            今は ふりかえりだけ 書けます。ほかの画面は 使えません。
          </p>
          <button
            onClick={() => navigate('/reflection')}
            className="animate-pop"
            style={{ marginTop: '2rem', padding: '1rem 2.5rem', fontSize: '1.5rem', fontWeight: 'bold', borderRadius: '999px', border: 'none', cursor: 'pointer', background: 'var(--color-accent)', color: '#222', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
          >
            ふりかえりを書く →
          </button>
        </>
      ) : (
        <>
          <Lock size={80} color="var(--color-accent)" className="animate-pop" style={{ marginBottom: '2rem' }} />
          <h1 style={{ fontSize: '4rem', margin: 0 }}>👀 スタッフのお話を聞きましょう！</h1>
          <p style={{ fontSize: '1.5rem', marginTop: '1rem', color: '#ccc' }}>
            画面がロックされています。スタッフの指示を待ってください。
          </p>
        </>
      )}
    </div>
  );
};
