import React, { useEffect, useState } from 'react';

// 画面固定トースト：スクロール位置に関係なく「今見ている画面」の下部に必ず出る通知。
// ポイント獲得・クリア・失敗（もう一回）を、その場で気づけるようにする。
// 使い方: showToast('🎉 ＋10ポイント！', 'points')
export type ToastType = 'success' | 'fail' | 'points';

export const showToast = (message: string, type: ToastType = 'success') => {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
};

const STYLE: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: '#dcfce7', border: '#16a34a', color: '#166534' },
  fail: { bg: '#fff7ed', border: '#f97316', color: '#c2410c' },
  points: { bg: '#fef9c3', border: '#f59e0b', color: '#92400e' },
};

export const ToastHost: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType; id: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail || {};
      if (!message) return;
      setToast({ message, type: type || 'success', id: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener('app-toast', handler);
    return () => { window.removeEventListener('app-toast', handler); clearTimeout(timer); };
  }, []);

  if (!toast) return null;
  const s = STYLE[toast.type];
  return (
    <div
      key={toast.id}
      className="animate-pop"
      style={{
        position: 'fixed',
        bottom: '2.2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: s.bg,
        border: `3px solid ${s.border}`,
        color: s.color,
        padding: '0.9rem 1.6rem',
        borderRadius: '999px',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        maxWidth: '92vw',
        textAlign: 'center',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
      }}
    >
      {toast.message}
    </div>
  );
};
