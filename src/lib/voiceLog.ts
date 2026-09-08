import { supabase } from './supabase';

// 音声まわりの「成功／失敗」を1行ずつ記録する（Supabase voice_logs）。
// ねらい：「マイクが認識されない」が、どの経路（Chromeの音声認識／Azure発音チェック／
// マイク取得）で・どんな理由（混雑429／許可オフ／無音…）で起きているかを、先生が数字で見る。
// 音声そのものは送らない。失敗しても子どもの画面には何も出さない（黙って記録するだけ）。

export type VoiceKind = 'chrome' | 'azure' | 'mic';

export interface VoiceEvent {
  kind: VoiceKind;
  ok: boolean;
  code?: string;    // 短い理由コード（429 / not-allowed / nomatch / silent / network …）
  detail?: string;  // 生のエラー文（先頭200文字だけ）
}

// 同じ失敗が連打されたときに、ログを洪水にしない（同一コードは3秒に1回）
let lastKey = '';
let lastAt = 0;

export const logVoiceEvent = (ev: VoiceEvent) => {
  try {
    if (!supabase) return;
    const key = `${ev.kind}:${ev.ok}:${ev.code || ''}`;
    const now = Date.now();
    if (key === lastKey && now - lastAt < 3000) return;
    lastKey = key; lastAt = now;

    const row = {
      student_id: localStorage.getItem('studentId'),
      kind: ev.kind,
      ok: ev.ok,
      code: (ev.code || (ev.ok ? 'ok' : 'unknown')).slice(0, 40),
      detail: (ev.detail || '').slice(0, 200) || null,
      screen: (window.location.hash || '').slice(0, 80),
      ua: navigator.userAgent.slice(0, 120),
    };
    // 待たない（授業の操作を止めない）。失敗しても握りつぶす。
    void supabase.from('voice_logs').insert(row).then(() => {}, () => {});
  } catch { /* noop */ }
};

/** Azureの中止理由の生文を、集計しやすい短いコードにする */
export const azureCode = (details: string): string => {
  const d = details || '';
  if (/429|4429|Too many|throttl|quota|exceeded/i.test(d)) return '429';
  if (/401|403|Authentication|subscription|key/i.test(d)) return 'auth';
  if (/1006|network|WebSocket|Unable to contact|connection/i.test(d)) return 'network';
  return 'canceled';
};
