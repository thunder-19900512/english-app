import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// ポイントを使うときの合言葉（lib/spendPin.ts）の先生用カード。
//   - 受付の切り替え：止める／決める時間／ふだん
//   - だれが決めたか（合言葉そのものは誰にも見えない）
//   - 忘れた子の合言葉を消す
const MODES: { v: 'locked' | 'setup' | 'open'; label: string; hint: string; color: string }[] = [
  { v: 'locked', label: '🔒 使えない', hint: 'ポイントは貯まるが、ショップ・みんなの木で使えない。お知らせが出る', color: '#dc2626' },
  { v: 'setup', label: '🔑 合言葉を決める時間', hint: 'まだの子に「決める画面」が出る。決めた子は使える。終わったら「ふだん」へ', color: '#d97706' },
  { v: 'open', label: '✅ ふだん', hint: '使うときに合言葉を聞く。まだの子は使えない（新しく決めることもできない）', color: '#16a34a' },
];

export const SpendPinCard: React.FC<{
  students: any[];
  mode: 'locked' | 'setup' | 'open';
  onChangeMode: (m: 'locked' | 'setup' | 'open') => Promise<void>;
}> = ({ students, mode, onChangeMode }) => {
  const [setIds, setSetIds] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');

  const load = async () => {
    if (!supabase) return;
    const { data } = await supabase.rpc('spend_pin_list');
    setSetIds(new Set((data || []).map((r: any) => r.student_id)));
  };
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const kids = students.filter(s => /^\d+$/.test(s.id) && s.id !== '00' && s.id !== '99')
    .sort((a, b) => a.id.localeCompare(b.id));
  const notYet = kids.filter(s => !setIds.has(s.id));

  const reset = async (s: any) => {
    if (!supabase) return;
    const staff = window.prompt(`${s.name} の合言葉を消します。\n消したあと「合言葉を決める時間」にすると、その子はもう一度決められます。\n\nスタッフPINを入れてください`);
    if (!staff) return;
    const { data, error } = await supabase.rpc('reset_spend_pin', { sid: s.id, staff_pin: staff });
    setMsg(error ? '通信エラー' : data === 'ok' ? `${s.name} の合言葉を消しました` : 'スタッフPINが違います');
    setTimeout(() => setMsg(''), 5000);
    load();
  };

  return (
    <div className="glass-card">
      <h2>🔑 ポイントを使うときの合言葉</h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        なりすまし対策。ログインは今のまま、<b>ショップ・みんなの木でポイントを使うときだけ</b>数字4けたを聞きます。
        合言葉はハッシュでしか保存されず、先生にも見えません。決められるのは「決める時間」の間・まだの子だけです。
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <button key={m.v} onClick={() => onChangeMode(m.v)}
            style={{ flex: 1, minWidth: '160px', padding: '0.7rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold',
              border: `2px solid ${m.color}`, background: mode === m.v ? m.color : 'white', color: mode === m.v ? 'white' : m.color }}>
            {m.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.5rem 0' }}>いま：{MODES.find(m => m.v === mode)?.hint}</p>

      <div style={{ fontWeight: 'bold', margin: '0.8rem 0 0.3rem' }}>
        決めた子 {kids.length - notYet.length} / {kids.length}人
      </div>
      {notYet.length > 0 && (
        <div style={{ fontSize: '0.9rem', background: '#fef2f2', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
          まだ：{notYet.map(s => `${s.id}.${s.name}`).join('、')}
        </div>
      )}
      <details style={{ marginTop: '0.6rem' }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.9rem' }}>忘れた子の合言葉を消す</summary>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
          {kids.filter(s => setIds.has(s.id)).map(s => (
            <button key={s.id} onClick={() => reset(s)}
              style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
              {s.id}.{s.name} を消す
            </button>
          ))}
        </div>
      </details>
      {msg && <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{msg}</div>}
    </div>
  );
};
