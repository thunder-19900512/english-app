import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSettings } from '../../hooks/useAppSettings';
import {
  checkSpendPin, hasSpendPin, recentlyVerified, registerSpendAsker, setSpendPin, spendExempt,
} from '../../lib/spendPin';

// 合言葉の画面（2つ）
//   1) 決める画面 … 先生が「決める時間」にしていて、まだ決めていない子に自動で出る
//   2) 確かめる画面 … ポイントを使う直前（ensureSpendAllowed）に出る
// Layout に1つだけ置く。

const box: React.CSSProperties = {
  background: 'white', borderRadius: '18px', padding: '1.6rem', width: 'min(420px, 92vw)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center', textAlign: 'center',
};
const pinInput: React.CSSProperties = {
  fontSize: '2rem', textAlign: 'center', width: '170px', padding: '0.4rem', borderRadius: '10px',
  border: '2px solid #cbd5e1', letterSpacing: '0.5rem',
};
const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </div>
);
const only4 = (v: string) => v.replace(/\D/g, '').slice(0, 4);

export const SpendGate: React.FC = () => {
  const { spendMode } = useAppSettings();
  const studentId = localStorage.getItem('studentId');
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  useEffect(() => {
    if (spendExempt(studentId)) return;
    hasSpendPin(studentId!).then(setHasPin);
  }, [studentId, spendMode]);

  // ── 決める画面
  const [p1, setP1] = useState(''); const [p2, setP2] = useState('');
  const [setupMsg, setSetupMsg] = useState(''); const [saving, setSaving] = useState(false);
  const showSetup = !spendExempt(studentId) && spendMode === 'setup' && hasPin === false;

  const saveSetup = async () => {
    if (p1.length !== 4) { setSetupMsg('数字を 4つ 入れてね'); return; }
    if (p1 !== p2) { setSetupMsg('2回目が ちがうよ。もう一度 入れてね'); setP2(''); return; }
    setSaving(true);
    const r = await setSpendPin(studentId!, p1);
    setSaving(false);
    if (r === 'ok') { setHasPin(true); setP1(''); setP2(''); setSetupMsg(''); return; }
    if (r === 'already_set') { setHasPin(true); return; }
    setSetupMsg(r === 'not_setup_time' ? '今は 決める時間じゃないよ。先生の合図を待ってね' : '通信が うまくいかなかったよ。もう一度 試してね');
  };

  // ── 確かめる画面（ensureSpendAllowed から呼ばれる）
  const [asking, setAsking] = useState<null | 'pin' | 'locked' | 'nopin'>(null);
  const [pin, setPin] = useState(''); const [askMsg, setAskMsg] = useState('');
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const finish = (ok: boolean) => { setAsking(null); setPin(''); setAskMsg(''); resolver.current?.(ok); resolver.current = null; };

  const ask = useCallback(async (): Promise<boolean> => {
    if (spendMode === 'locked') { setAsking('locked'); return new Promise(r => { resolver.current = () => r(false); }); }
    const has = hasPin ?? await hasSpendPin(studentId!);
    if (!has) { setAsking('nopin'); return new Promise(r => { resolver.current = () => r(false); }); }
    if (recentlyVerified(studentId!)) return true;
    setAsking('pin');
    return new Promise(r => { resolver.current = r; });
  }, [spendMode, hasPin, studentId]);

  useEffect(() => { registerSpendAsker(ask); return () => registerSpendAsker(null); }, [ask]);

  const submitPin = async () => {
    if (pin.length !== 4) return;
    const r = await checkSpendPin(studentId!, pin);
    if (r === 'ok') { finish(true); return; }
    setPin('');
    setAskMsg(r === 'wrong' ? '合言葉が ちがうよ'
      : r === 'locked' ? 'まちがいが 多かったので、10分 待ってね'
      : '通信が うまくいかなかったよ');
  };

  if (showSetup) {
    return (
      <Overlay>
        <div style={box}>
          <div style={{ fontSize: '2.4rem' }}>🔑</div>
          <b style={{ fontSize: '1.3rem', color: 'var(--color-primary)' }}>ポイントを使うときの 合言葉を 決めよう</b>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>
            ショップや みんなの木で ポイントを使うときに 聞かれるよ。<br />
            <b>数字4つ</b>。友だちに 見せない・教えない。<br />
            わすれたら 先生に 言えば 作り直せるよ。
          </p>
          <input type="password" inputMode="numeric" autoFocus value={p1} placeholder="●●●●"
            onChange={e => { setP1(only4(e.target.value)); setSetupMsg(''); }} style={pinInput} />
          <input type="password" inputMode="numeric" value={p2} placeholder="もう一度"
            onChange={e => { setP2(only4(e.target.value)); setSetupMsg(''); }}
            onKeyDown={e => { if (e.key === 'Enter') saveSetup(); }} style={pinInput} />
          {setupMsg && <div style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>{setupMsg}</div>}
          <button onClick={saveSetup} disabled={saving}
            style={{ padding: '0.7rem 2rem', borderRadius: '999px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem',
              background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
            {saving ? '保存中…' : 'これに 決める'}
          </button>
        </div>
      </Overlay>
    );
  }

  if (!asking) return null;

  return (
    <Overlay>
      <div style={box}>
        {asking === 'locked' && (<>
          <div style={{ fontSize: '2.2rem' }}>🔒</div>
          <b>今は ポイントを 使えないよ</b>
          <p style={{ margin: 0, color: '#475569' }}>次の授業で、ポイントを使うときの 合言葉を つけるよ。<br />貯めることは できるので、学習を進めよう！</p>
          <button onClick={() => finish(false)} style={{ padding: '0.6rem 2rem', borderRadius: '999px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>わかった</button>
        </>)}
        {asking === 'nopin' && (<>
          <div style={{ fontSize: '2.2rem' }}>🔑</div>
          <b>まだ 合言葉が ないよ</b>
          <p style={{ margin: 0, color: '#475569' }}>ポイントを使うには 合言葉が いるよ。<br />先生に「合言葉を作りたい」と 伝えてね。</p>
          <button onClick={() => finish(false)} style={{ padding: '0.6rem 2rem', borderRadius: '999px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>わかった</button>
        </>)}
        {asking === 'pin' && (<>
          <div style={{ fontSize: '2.2rem' }}>🔑</div>
          <b>合言葉を 入れてね</b>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{localStorage.getItem('studentName')}さんの ポイントを 使うよ</p>
          <input type="password" inputMode="numeric" autoFocus value={pin} placeholder="●●●●"
            onChange={e => { setPin(only4(e.target.value)); setAskMsg(''); }}
            onKeyDown={e => { if (e.key === 'Enter') submitPin(); }} style={pinInput} />
          {askMsg && <div style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>{askMsg}</div>}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={() => finish(false)} style={{ padding: '0.6rem 1.4rem', borderRadius: '999px', border: '2px solid #cbd5e1', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}>やめる</button>
            <button onClick={submitPin} style={{ padding: '0.6rem 1.8rem', borderRadius: '999px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>OK</button>
          </div>
        </>)}
      </div>
    </Overlay>
  );
};

/** ショップ・みんなの木の上に出すお知らせ（止めている間だけ） */
export const SpendLockedNotice: React.FC = () => {
  const { spendMode } = useAppSettings();
  if (spendMode !== 'locked' || spendExempt(localStorage.getItem('studentId'))) return null;
  return (
    <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '14px', padding: '0.9rem 1.1rem', textAlign: 'center', fontWeight: 'bold', color: '#92400e' }}>
      🔒 次の授業で、ポイントを使うときに 合言葉を つけるよ。<br />
      それまでは 一時的に ポイントは使えません（貯めることは できるので、学習を進めよう！）
    </div>
  );
};
