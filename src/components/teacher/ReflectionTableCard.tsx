import React, { useMemo, useState } from 'react';

// 日付を選んで、その日のふりかえりを1人1行の表で見る（先生用）。
// 表示は先生のブラウザの中だけで完結する（AIには通さない）。CSVで保存もできる。
// 2026-09-28：「みち案内の回のふりかえりをPCでやった子も多い」→ 端末に関係なく1つの表で見たい。

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

interface Row {
  id: string; name: string; grade: number | null; cls: string | null;
  items: { time: string; stars: number; comment: string }[];
}

export const ReflectionTableCard: React.FC<{ students: any[] }> = ({ students }) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(localDate(new Date()));
  const [hideEmpty, setHideEmpty] = useState(false);

  const rows: Row[] = useMemo(() => students
    .filter(s => /^\d+$/.test(s.id) && s.id !== '00' && s.id !== '99')
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(s => ({
      id: s.id, name: s.name, grade: s.grade ?? null, cls: s.cls ?? null,
      items: (Array.isArray(s.reflections) ? s.reflections : [])
        .filter((r: any) => r && r.date && localDate(new Date(r.date)) === date)
        .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)))
        .map((r: any) => ({ time: localTime(new Date(r.date)), stars: Number(r.stars) || 0, comment: String(r.comment || '') })),
    })), [students, date]);

  const shown = hideEmpty ? rows.filter(r => r.items.length) : rows;
  const doneCount = rows.filter(r => r.items.length).length;

  const downloadCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [['番号', '名前', '学年', 'クラス', '時刻', '星', 'ふりかえり'].map(esc).join(',')];
    for (const r of rows) {
      const base = [r.id, r.name, r.grade ? `${r.grade}年` : '', r.cls || ''];
      if (r.items.length === 0) lines.push([...base, '', '', '（未提出）'].map(esc).join(','));
      for (const it of r.items) lines.push([...base, it.time, String(it.stars), it.comment].map(esc).join(','));
    }
    // 先頭のBOMで、Excelでも文字化けしない
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ふりかえり_${date}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const cell: React.CSSProperties = { padding: '0.45rem 0.6rem', borderTop: '1px solid #e2e8f0', verticalAlign: 'top', fontSize: '0.9rem' };

  return (
    <div className="glass-card" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>📋 ふりかえり一覧（日付で見る）</h2>
        <button onClick={() => setOpen(o => !o)}
          style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>
          {open ? '▲ たたむ' : '▼ ひらく'}
        </button>
      </div>
      {open && (<>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', margin: '1rem 0' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          <b>書いた子 {doneCount} / {rows.length}人</b>
          <label style={{ fontSize: '0.9rem' }}>
            <input type="checkbox" checked={hideEmpty} onChange={e => setHideEmpty(e.target.checked)} /> 未提出の子をかくす
          </label>
          <button onClick={downloadCsv}
            style={{ marginLeft: 'auto', padding: '0.45rem 1.1rem', borderRadius: '999px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
            ⬇ CSVで保存
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem' }}>
          PC・タブレットどちらで書いても、ここに出ます（データベースの最新）。いま開いている画面を読み込んだ時点の内容です
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '640px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={cell}>番号</th><th style={cell}>名前</th><th style={cell}>時刻</th><th style={cell}>⭐</th><th style={cell}>ふりかえり</th>
              </tr>
            </thead>
            <tbody>
              {shown.flatMap(r => r.items.length === 0
                ? [<tr key={r.id} style={{ color: '#b91c1c', background: '#fef2f2' }}>
                    <td style={cell}>{r.id}</td><td style={cell}>{r.name}</td><td style={cell}>—</td><td style={cell}>—</td><td style={cell}>（未提出）</td>
                  </tr>]
                : r.items.map((it, i) => (
                  <tr key={`${r.id}-${i}`}>
                    <td style={cell}>{i === 0 ? r.id : ''}</td>
                    <td style={cell}>{i === 0 ? r.name : ''}</td>
                    <td style={cell}>{it.time}</td>
                    <td style={cell}>{'★'.repeat(it.stars)}</td>
                    <td style={{ ...cell, whiteSpace: 'pre-wrap' }}>{it.comment}</td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};
