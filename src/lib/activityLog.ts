// 「さっき何をやったか」の記録。
//
// ふりかえりを書くときに、その子が直近で取り組んだ活動を思い出せるように出す。
// （「今日なにしたっけ？」で手が止まる子が多いので、書き出しの足場にする）
//
// 端末のlocalStorageだけに持つ。Supabaseには送らない：
//   - ふりかえりは書いた端末で書くので、端末に持っていれば足りる
//   - 全員ぶんの行動ログをサーバに貯めると、目的に対して過剰な記録になる

export interface ActivityEntry {
  ts: number;
  label: string;   // 子どもが読んで分かる名前（例「🔍 言葉さがし（町）」）
}

const MAX = 60;                      // 端末に残す件数
export const RECENT_HOURS = 6;       // ふりかえり画面で見せる範囲

const keyFor = (studentId: string) => `activity_${studentId}`;

export const recordActivity = (label: string) => {
  try {
    const id = localStorage.getItem('studentId');
    if (!id || !label) return;
    const key = keyFor(id);
    const list: ActivityEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    const last = list[0];
    // 同じ活動を続けている間は増やさない（画面を行き来しただけで埋まらないように）
    if (last && last.label === label && Date.now() - last.ts < 10 * 60 * 1000) return;
    list.unshift({ ts: Date.now(), label });
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX)));
  } catch { /* 記録できなくても学習には影響しない */ }
};

/** 直近 hours 時間の活動を、新しい順に返す（同じものはまとめる） */
export const recentActivities = (hours = RECENT_HOURS): ActivityEntry[] => {
  try {
    const id = localStorage.getItem('studentId');
    if (!id) return [];
    const since = Date.now() - hours * 3600 * 1000;
    const list: ActivityEntry[] = JSON.parse(localStorage.getItem(keyFor(id)) || '[]');
    const seen = new Set<string>();
    return list
      .filter(e => e && e.ts >= since)
      .filter(e => (seen.has(e.label) ? false : (seen.add(e.label), true)));
  } catch { return []; }
};

/**
 * URL（ハッシュ）から、子どもに見せる活動名をつくる。
 * ここ1か所で全画面ぶんをまかなうので、画面側にコードを足さなくて済む。
 */
export const labelForHash = (hash: string, dict: Record<string, string> = {}): string | null => {
  const clean = hash.replace(/^#/, '');
  const [path, query] = clean.split('?');
  const seg = path.split('/').filter(Boolean);
  const q = new URLSearchParams(query || '');
  const dec = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

  if (seg.length === 0) return null;

  switch (seg[0]) {
    case 'stage': {
      const name = dict[`stage_${seg[1]}`];
      return `🔤 フォニックス${name ? `（${name}）` : ` ステージ${seg[1]}`}`;
    }
    case 'dictionary': {
      if (seg.length === 1) return '📕 Picture Dictionary';
      const cat = dec(seg[1]);
      const modes: Record<string, string> = {
        learn: '学習', practice: '選択', wordsearch: '言葉さがし',
        spelling: 'スペリング', typing: 'タイピング', voice: 'モンスターバトル', qa: 'QA',
      };
      const mode = seg[seg.length - 1];
      const m = modes[mode];
      return `📕 辞書「${cat}」${m ? `の${m}` : ''}`;
    }
    case 'textbook': {
      const set = q.get('set');
      if (set === 'karuizawa') return '🏔 軽井沢まちクイズ';
      if (set === 'worldbento') return '🍱 世界の料理クイズ';
      const g = q.get('grade');
      return `📖 教科書クイズ${g ? `（${g}年）` : ''}`;
    }
    case 'dialogue': {
      const g = q.get('grade');
      return `🗣️ ダイアログ${g ? `（${g}年）` : ''}`;
    }
    case 'ai': return '🤖 AI英会話';
    case 'story': return '📖 おはなしづくり';
    case 'tree': return '🌳 みんなの町';
    case 'shop': return '🎁 ショップ';
    case 'mictest': return '🎙️ マイクテスト';
    case 'progress': return '🗺️ 自分の記録';
    case 'skilltest': return '📝 単語テスト';
    default: return null;   // ホーム・ふりかえり等は「取り組んだこと」ではないので記録しない
  }
};
