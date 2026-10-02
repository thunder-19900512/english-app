import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, PenLine } from 'lucide-react';
import { STAFF_TEST_ID } from '../../lib/trial';
import type { TodayMission } from '../../hooks/useAppSettings';
import { isOnMission } from '../../lib/missionBonus';
import { supabase } from '../../lib/supabase';

export type LockMode = 'none' | 'screen' | 'reflection' | 'missions';

// ミッションロック：その日の「サインのあと」ミッションを、この端末で解除したか（日付ごと）
const signKey = () => `signUnlock_${localStorage.getItem('studentId')}_${new Date().toDateString()}`;
export const isSignUnlocked = () => { try { return localStorage.getItem(signKey()) === '1'; } catch { return false; } };

// 全員の画面にかぶせるロック。
//   screen     … 何もできない（スタッフの話を聞く）
//   reflection … ふりかえりを書く画面だけ使える。ほかの画面ではこのロックが出て、ボタンで ふりかえりへ
//   missions   … 今日のミッションの画面（とトップ・ふりかえり）だけ使える。
//                「サインのあと」のミッションは、スタッフが端末で合言葉（スタッフPIN）を入れると、その日その端末で開く
export const GlobalLockScreen: React.FC<{ mode: LockMode; missions?: TodayMission[] }> = ({ mode, missions = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pin, setPin] = useState(''); const [pinMsg, setPinMsg] = useState(''); const [, force] = useState(0);

  // Test（00）はロック対象外（ロック中にスタッフがデモを見せられるように）。
  // TestのログインにはPINが必要なので、子どもがここを抜け道にはできない。
  // おためし（99）はPIN無しで入れるので、子どもと同じにロックする。
  if (mode === 'none' || localStorage.getItem('studentId') === STAFF_TEST_ID) return null;

  const onReflection = location.pathname.startsWith('/reflection');
  if (mode === 'reflection' && onReflection) return null;

  // ── ミッションロック
  let signBlocked: TodayMission | null = null;
  if (mode === 'missions') {
    if (onReflection || location.pathname === '/home' || location.pathname === '/') return null;
    const here = location.pathname + location.search;
    const hit = missions.find(m => m.route && isOnMission(here, m.route));
    if (hit && (!hit.afterSign || isSignUnlocked())) return null;
    if (hit && hit.afterSign) signBlocked = hit;
  }
  const unlock = async () => {
    // サインのあと用の合言葉（DB の check_sign_pin。スタッフ画面のPINとは別に決められる。スタッフPINでも開く）
    const { data, error } = await supabase.rpc('check_sign_pin', { pin });
    const ok = !error && data === true;
    if (ok) { try { localStorage.setItem(signKey(), '1'); } catch { /* 保存できなくても今回は開く */ } setPin(''); setPinMsg(''); force(x => x + 1); }
    else { setPin(''); setPinMsg('ちがうよ（スタッフが入れてね）'); }
  };

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
      {mode === 'missions' ? (
        signBlocked ? (
          <>
            <div style={{ fontSize: '4rem' }}>✍️</div>
            <h1 style={{ fontSize: '2.6rem', margin: 0 }}>スタッフのサインのあとで 使えるよ</h1>
            <p style={{ fontSize: '1.3rem', marginTop: '1rem', color: '#ccc' }}>
              「{signBlocked.label}」は、制作物にサインをもらってから。<br />スタッフに 端末で 合言葉を入れてもらおう。
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* type="password" にすると、子どもの端末のブラウザが「パスワードを保存しますか？」と聞いてくる。
                  文字欄＋伏せ字（-webkit-text-security）にして、保存・自動入力の対象にしない */}
              <input type="text" value={pin} onChange={e => { setPin(e.target.value); setPinMsg(''); }}
                onKeyDown={e => { if (e.key === 'Enter') unlock(); }} placeholder="スタッフの合言葉"
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                data-lpignore="true" data-1p-ignore="true" data-form-type="other"
                style={{ fontSize: '1.3rem', padding: '0.6rem 1rem', borderRadius: '12px', border: 'none', width: '14rem', WebkitTextSecurity: 'disc' } as React.CSSProperties} />
              <button onClick={unlock} style={{ padding: '0.7rem 1.6rem', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '999px', border: 'none', cursor: 'pointer', background: 'var(--color-accent)', color: '#222' }}>ひらく</button>
            </div>
            {pinMsg && <p style={{ color: '#ff7675', fontWeight: 'bold' }}>{pinMsg}</p>}
            <button onClick={() => navigate('/home')} style={{ marginTop: '1.2rem', padding: '0.7rem 2rem', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '999px', border: '2px solid white', cursor: 'pointer', background: 'transparent', color: 'white' }}>← トップにもどる</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem' }}>🎯</div>
            <h1 style={{ fontSize: '2.8rem', margin: 0 }}>今は 今日のミッションだけ 使えるよ</h1>
            <p style={{ fontSize: '1.3rem', marginTop: '1rem', color: '#ccc' }}>トップの「今日のミッション」から選んでね。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.2rem' }}>
              {missions.map(m => (
                <button key={m.route} onClick={() => navigate(m.route)}
                  style={{ padding: '0.8rem 1.6rem', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '999px', border: 'none', cursor: 'pointer', background: 'var(--color-accent)', color: '#222' }}>
                  {m.afterSign && !isSignUnlocked() ? '✍️ ' : '🎯 '}{m.label}{m.afterSign && !isSignUnlocked() ? '（サインのあと）' : ''}
                </button>
              ))}
              <button onClick={() => navigate('/home')} style={{ padding: '0.7rem 1.6rem', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '999px', border: '2px solid white', cursor: 'pointer', background: 'transparent', color: 'white' }}>← トップにもどる</button>
            </div>
          </>
        )
      ) : mode === 'reflection' ? (
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
