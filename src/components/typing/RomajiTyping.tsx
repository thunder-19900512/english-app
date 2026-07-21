import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoints } from '../../hooks/usePoints';
import { Button } from '../ui/Button';
import { ArrowLeft, RefreshCw, Trophy, Keyboard } from 'lucide-react';

// ローマ字タイピング練習（P2-2）：日本語（かな）→ローマ字入力の基礎練習。
// 英語タイピングへの橋渡し。ヘボン式・訓令式どちらの書き方も正解にする。
interface RomajiWord {
  kana: string;
  emoji: string;
  answers: string[]; // 正解として認めるローマ字（ゆれ含む）
}

interface Level {
  key: string;
  label: string;
  desc: string;
  words: RomajiWord[];
}

const LEVELS: Level[] = [
  {
    key: 'lv1', label: 'レベル1：みじかいことば', desc: '「ねこ → neko」のように打ってみよう',
    words: [
      { kana: 'ねこ', emoji: '🐱', answers: ['neko'] },
      { kana: 'いぬ', emoji: '🐶', answers: ['inu'] },
      { kana: 'やま', emoji: '⛰️', answers: ['yama'] },
      { kana: 'かわ', emoji: '🏞️', answers: ['kawa'] },
      { kana: 'そら', emoji: '🌌', answers: ['sora'] },
      { kana: 'うみ', emoji: '🌊', answers: ['umi'] },
      { kana: 'ほし', emoji: '⭐', answers: ['hoshi', 'hosi'] },
      { kana: 'つき', emoji: '🌙', answers: ['tsuki', 'tuki'] },
    ],
  },
  {
    key: 'lv2', label: 'レベル2：にごる音・小さい「っ」', desc: '「がっこう → gakkou」むずかしい音に挑戦！',
    words: [
      { kana: 'がっこう', emoji: '🏫', answers: ['gakkou', 'gakko', 'gakkoo'] },
      { kana: 'せんせい', emoji: '🧑‍🏫', answers: ['sensei', 'sensee'] },
      { kana: 'ざっし', emoji: '📖', answers: ['zasshi', 'zassi'] },
      { kana: 'きって', emoji: '📮', answers: ['kitte'] },
      { kana: 'らっぱ', emoji: '🎺', answers: ['rappa'] },
      { kana: 'でんしゃ', emoji: '🚃', answers: ['densha', 'densya'] },
      { kana: 'じてんしゃ', emoji: '🚲', answers: ['jitensha', 'jitensya', 'zitensya', 'zitensha'] },
      { kana: 'おちゃ', emoji: '🍵', answers: ['ocha', 'otya'] },
    ],
  },
  {
    key: 'lv3', label: 'レベル3：ながいことば', desc: '「きゅうしょく → kyuushoku」長い言葉もスラスラ！',
    words: [
      { kana: 'きゅうしょく', emoji: '🍱', answers: ['kyuushoku', 'kyushoku', 'kyuusyoku', 'kyusyoku'] },
      { kana: 'としょかん', emoji: '📚', answers: ['toshokan', 'tosyokan'] },
      { kana: 'しゅくだい', emoji: '📝', answers: ['shukudai', 'syukudai'] },
      { kana: 'きょうしつ', emoji: '🏫', answers: ['kyoushitsu', 'kyoshitsu', 'kyousitu', 'kyousitsu', 'kyoushitu'] },
      { kana: 'ちゅうしゃじょう', emoji: '🅿️', answers: ['chuushajou', 'chushajo', 'chuusyajou', 'tyuusyazyou', 'chuushajo'] },
      { kana: 'ひゃくえん', emoji: '💯', answers: ['hyakuen'] },
      { kana: 'りょこう', emoji: '🧳', answers: ['ryokou', 'ryoko', 'ryokoo'] },
      { kana: 'べんきょう', emoji: '✏️', answers: ['benkyou', 'benkyo', 'benkyoo'] },
    ],
  },
];

export const RomajiTyping: React.FC = () => {
  const navigate = useNavigate();
  const { addPoints } = usePoints();

  const [level, setLevel] = useState<Level | null>(null);
  const [order, setOrder] = useState<RomajiWord[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [misses, setMisses] = useState(0);       // この単語でのミス数
  const [firstTry, setFirstTry] = useState(0);   // 一発正解の数（加点対象）
  const [feedback, setFeedback] = useState<'ok' | 'ng' | null>(null);
  const [finished, setFinished] = useState(false);
  const [earned, setEarned] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = (lv: Level) => {
    setLevel(lv);
    setOrder([...lv.words].sort(() => 0.5 - Math.random()));
    setIndex(0); setInput(''); setMisses(0); setFirstTry(0);
    setFeedback(null); setFinished(false); setEarned(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const word = order[index];

  const submit = async () => {
    if (!word || feedback === 'ok') return;
    const norm = input.trim().toLowerCase().replace(/\s+/g, '');
    if (!norm) return;
    if (word.answers.includes(norm)) {
      setFeedback('ok');
      const newFirstTry = misses === 0 ? firstTry + 1 : firstTry;
      setFirstTry(newFirstTry);
      setTimeout(async () => {
        if (index + 1 >= order.length) {
          setFinished(true);
          // 加点は一発正解率でスケール・半分未満は0（ポイント設計ルール準拠）
          const ratio = newFirstTry / order.length;
          if (ratio >= 0.5) {
            const pts = await addPoints(`romaji_typing_${level!.key}`, {
              multiplier: ratio,
              isPerfect: newFirstTry === order.length,
            });
            setEarned(pts);
          } else {
            setEarned(0);
          }
        } else {
          setIndex(i => i + 1);
          setInput(''); setMisses(0); setFeedback(null);
          inputRef.current?.focus();
        }
      }, 700);
    } else {
      setMisses(m => m + 1);
      setFeedback('ng');
      setInput('');
      setTimeout(() => setFeedback(f => (f === 'ng' ? null : f)), 900);
    }
  };

  // レベルえらび
  if (!level) {
    return (
      <div className="flex-col gap-lg" style={{ flex: 1, maxWidth: '640px', margin: '0 auto', width: '100%', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>もどる</Button>
          <h2 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', marginRight: '80px' }}>⌨️ ローマ字タイピング</h2>
        </div>
        <p style={{ textAlign: 'center', color: '#666', margin: 0 }}>日本語をローマ字で打つ練習だよ。英語タイピングへの第一歩！</p>
        <div className="flex-col gap-md">
          {LEVELS.map(lv => (
            <div key={lv.key} className="glass-card hover-scale" style={{ padding: '1.2rem 1.5rem', cursor: 'pointer', border: '2px solid var(--color-primary)' }} onClick={() => start(lv)}>
              <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--color-primary)' }}>{lv.label}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{lv.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 結果
  if (finished) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ height: '100%', textAlign: 'center' }}>
        <h1 className="text-primary" style={{ fontSize: '2.6rem' }}>クリア！</h1>
        <div className="animate-float"><Trophy size={90} color="var(--color-accent)" /></div>
        <p style={{ fontSize: '1.4rem', margin: 0 }}>
          {order.length}問中 <strong>{firstTry}</strong>問 一発正解！
        </p>
        {earned !== null && (
          earned > 0
            ? <p className="animate-pop" style={{ fontSize: '1.3rem', color: 'var(--color-accent)', fontWeight: 'bold', margin: 0 }}>＋{earned} ポイント！✨</p>
            : <p style={{ fontSize: '1rem', color: '#94a3b8', margin: 0 }}>半分以上を一発正解するとポイントがもらえるよ</p>
        )}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={() => start(level)} variant="outline" icon={RefreshCw}>もう一回</Button>
          <Button onClick={() => setLevel(null)}>レベルをえらぶ</Button>
        </div>
      </div>
    );
  }

  if (!word) return null;

  return (
    <div className="flex-col gap-lg" style={{ flex: 1, maxWidth: '640px', margin: '0 auto', width: '100%', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => setLevel(null)} icon={ArrowLeft}>レベルえらびへ</Button>
        <h2 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '1.2rem', marginRight: '80px' }}>{level.label}</h2>
      </div>

      <div style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>
        {index + 1} / {order.length} 問目
      </div>

      <div className="glass-card flex-col flex-center gap-md" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem' }}>{word.emoji}</div>
        <div style={{ fontSize: '2.4rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>{word.kana}</div>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>ローマ字で打って Enter！</p>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !(e.nativeEvent as any).isComposing) submit(); }}
          autoFocus
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          style={{ fontSize: '1.8rem', textAlign: 'center', padding: '0.6rem 1rem', borderRadius: '12px', width: '90%', maxWidth: '360px', fontFamily: 'monospace', letterSpacing: '0.08em',
            border: `3px solid ${feedback === 'ok' ? 'var(--color-success)' : feedback === 'ng' ? 'var(--color-error)' : '#e2e8f0'}` }}
        />
        {feedback === 'ok' && <div className="animate-pop" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>⭕ せいかい！</div>}
        {feedback === 'ng' && (
          <div className="animate-pop" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-error)' }}>
            ❌ もう一回！{misses >= 2 && <span style={{ color: '#94a3b8' }}>（こたえ：{word.answers[0]}）</span>}
          </div>
        )}
        <Button onClick={submit} icon={Keyboard}>答える</Button>
      </div>
    </div>
  );
};
