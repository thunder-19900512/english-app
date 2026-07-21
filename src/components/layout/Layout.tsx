import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Home, LogOut, Star } from 'lucide-react';
import { usePoints } from '../../hooks/usePoints';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useShop } from '../../hooks/useShop';
import { findTitle } from '../../data/shopItems';
import { GlobalLockScreen } from '../ui/GlobalLockScreen';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { totalPoints } = usePoints();
  const { isScreenLocked } = useAppSettings();
  const { shop } = useShop();

  // Basic mock auth check (to be replaced with real context later)
  const studentId = localStorage.getItem('studentId');

  // 装備中テーマ・背景画像を画面全体に適用する
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = shop.equippedTheme || '';
    if (shop.bgImage) {
      // 白の半透明オーバーレイで文字の可読性を確保
      document.body.style.backgroundImage =
        `linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.82)), url("${shop.bgImage}")`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
    }
    return () => {
      root.dataset.theme = '';
      document.body.style.backgroundImage = '';
    };
  }, [shop.equippedTheme, shop.bgImage]);

  const titleEmoji = findTitle(shop.equippedTitle)?.emoji || '';

  const handleLogout = () => {
    localStorage.removeItem('studentId');
    localStorage.removeItem('studentName');
    navigate('/');
  };

  return (
    <div className="app-container">
      <GlobalLockScreen isLocked={isScreenLocked} />
      {studentId && (
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/home')} 
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
            >
              <Home size={20} />
              ホーム
            </button>
            <h2 className="text-primary" style={{ margin: 0 }}>
              こんにちは、{localStorage.getItem('studentName')}{titleEmoji}さん！
            </h2>
            <div className="badge" style={{ background: 'var(--color-accent)', color: '#000', fontSize: '1.2rem', padding: '0.2rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star fill="#fff" stroke="#fff" size={20} />
              {totalPoints} pts
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            <LogOut size={20} />
            おわる
          </button>
        </header>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};
