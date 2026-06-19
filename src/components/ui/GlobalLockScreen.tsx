import React from 'react';
import { Lock } from 'lucide-react';

export const GlobalLockScreen: React.FC<{ isLocked: boolean }> = ({ isLocked }) => {
  if (!isLocked) return null;

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
      textAlign: 'center'
    }}>
      <Lock size={80} color="var(--color-accent)" className="animate-pop" style={{ marginBottom: '2rem' }} />
      <h1 style={{ fontSize: '4rem', margin: 0 }}>👀 先生のお話を聞きましょう！</h1>
      <p style={{ fontSize: '1.5rem', marginTop: '1rem', color: '#ccc' }}>
        画面がロックされています。先生の指示を待ってください。
      </p>
    </div>
  );
};
