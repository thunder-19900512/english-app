import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

// クラス共通の「あいことば」入力画面。
// この端末で初めて開いたときだけ表示され、正しいあいことばを入れると
// Supabaseのログイン状態が端末に保存される（以後この画面はスキップ）。
//
// ★重要：あいことば（＝Supabaseアカウントのパスワード）はこのコードには書かない。
//   子どもが画面で入力する。ここに書いてよいのは「メールアドレス」だけ（秘密ではない）。
export const CLASS_ACCOUNT_EMAIL = 'class56@kazakoshi.app';

export const ClassGate: React.FC<{ onAuthed: () => void }> = ({ onAuthed }) => {
  const [word, setWord] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = word.trim();
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: CLASS_ACCOUNT_EMAIL,
        password,
      });
      if (error) {
        setError('あいことばが ちがうよ。もういちど！');
        setWord('');
      } else {
        onAuthed();
      }
    } catch {
      setError('つうしんに しっぱいしたよ。もういちど ためしてね');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex-col flex-center gap-lg"
      style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center' }}
    >
      <div className="flex-col flex-center gap-sm">
        <div style={{ fontSize: '3rem' }}>🔑</div>
        <h1 className="text-primary" style={{ fontSize: '2.4rem', margin: 0 }}>
          あいことば を いれてね
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#555', margin: 0 }}>
          この タブレット（パソコン）で さいしょの 1かい だけ
        </p>
      </div>

      {/* ヒント（先生が教室に掲示。答えそのものは書かない） */}
      <div
        className="animate-pop"
        style={{
          background: '#fffbe6',
          border: '2px dashed #f0c040',
          borderRadius: '14px',
          padding: '1rem 1.4rem',
          maxWidth: '440px',
          fontSize: '1.05rem',
          lineHeight: 1.7,
          color: '#7a5c00',
        }}
      >
        💡 ヒント：わたしたちの がっこうは？<br />
        <span style={{ fontWeight: 'bold', letterSpacing: '0.15em' }}>
          ＿＿＿＿＿＿＿＿＿ がくえん
        </span>
        <br />
        （あてはまる ローマ字 9もじ）
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-col flex-center gap-sm"
        style={{ width: '100%', maxWidth: '360px' }}
      >
        <input
          type="text"
          inputMode="text"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={word}
          onChange={(e) => { setWord(e.target.value); setError(''); }}
          placeholder="ここに ローマ字で"
          aria-label="あいことば"
          style={{
            fontSize: '1.6rem',
            textAlign: 'center',
            width: '100%',
            padding: '0.7rem 1rem',
            borderRadius: '12px',
            border: `2px solid ${error ? 'var(--color-error)' : '#ccc'}`,
            letterSpacing: '0.1em',
          }}
        />
        {error && (
          <div style={{ color: 'var(--color-error)', fontWeight: 'bold', fontSize: '1rem' }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btn"
          disabled={busy || !word.trim()}
          style={{
            padding: '0.7rem 2.4rem',
            fontSize: '1.2rem',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            cursor: busy ? 'wait' : 'pointer',
            fontWeight: 'bold',
            opacity: busy || !word.trim() ? 0.6 : 1,
          }}
        >
          {busy ? 'かくにん中…' : 'はじめる'}
        </button>
      </form>
    </div>
  );
};
