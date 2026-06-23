import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useAppSettings } from '../../hooks/useAppSettings';
import { usePronunciationAssessment } from '../../hooks/usePronunciationAssessment';
import { usePronunciationHistory } from '../../hooks/usePronunciationHistory';
import { DIALOGUES, type Dialogue, type DialogueLine } from './dialogueData';

// 発音採点に通すため {…} のスロット記号を外した素の文を作る
const cleanText = (en: string) => en.replace(/[{}]/g, '');
const PASS = 60;

// {slot} を色付きで表示する
const renderEn = (en: string) => {
  const parts = en.split(/(\{.*?\})/g);
  return parts.map((p, i) => {
    if (p.startsWith('{') && p.endsWith('}')) {
      return (
        <span key={i} style={{ color: '#0984e3', fontWeight: 'bold', borderBottom: '2px dashed #0984e3' }}>
          {p.slice(1, -1)}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
};

export const DialogueTrainer: React.FC = () => {
  const navigate = useNavigate();
  const { speak } = useSpeechSynthesis();
  const { azureSpeechKey, azureSpeechRegion } = useAppSettings();
  const { assess, isAssessing, isAvailable: azureAvailable, lastRecordingUrl } = usePronunciationAssessment(azureSpeechKey, azureSpeechRegion);
  const { addScore } = usePronunciationHistory();

  const [grade, setGrade] = useState<5 | 6 | null>(null);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [myRole, setMyRole] = useState<'A' | 'B'>('A');
  const [showJa, setShowJa] = useState(true);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const startDialogue = (d: Dialogue) => {
    setDialogue(d);
    setScores({});
    setActiveLine(null);
    setMyRole('A');
  };

  // URLパラメータ（?grade=5&id=g5-u1）で、特定のダイアログを直接ひらく（今日のミッション用）
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const g = searchParams.get('grade');
    const id = searchParams.get('id');
    if (id) {
      const d = DIALOGUES.find(x => x.id === id);
      if (d) { setGrade(d.grade); startDialogue(d); return; }
    }
    if (g === '5' || g === '6') setGrade(Number(g) as 5 | 6);
  }, [searchParams]);

  const handleSpeak = (line: DialogueLine) => speak(cleanText(line.en));

  const handlePractice = async (idx: number, line: DialogueLine) => {
    if (isAssessing) return;
    setActiveLine(idx);
    const result = await assess(cleanText(line.en));
    if (!result) return;
    setScores(prev => ({ ...prev, [idx]: result.pronunciationScore }));
    addScore('dialogue', result.pronunciationScore, cleanText(line.en));
  };

  // 学年えらび
  if (!grade) {
    return (
      <div className="flex-col flex-center gap-lg" style={{ flex: 1, padding: '2rem' }}>
        <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
          <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>もどる</Button>
        </div>
        <h1 className="text-primary" style={{ fontSize: '2.2rem' }}>🗣️ ダイアログ・トレーナー</h1>
        <p style={{ fontSize: '1.1rem', color: '#666', textAlign: 'center' }}>
          ペアで話す前のれんしゅう！<br/>A・Bの両方の役を、一人でれんしゅうできるよ。
        </p>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
          <div className="glass-card flex-col flex-center hover-scale" style={{ padding: '3rem 4rem', cursor: 'pointer', background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)' }} onClick={() => setGrade(5)}>
            <h2 style={{ fontSize: '3rem', margin: 0, color: '#d35400' }}>5年生</h2>
          </div>
          <div className="glass-card flex-col flex-center hover-scale" style={{ padding: '3rem 4rem', cursor: 'pointer', background: 'linear-gradient(135deg, #81ecec, #00cec9)' }} onClick={() => setGrade(6)}>
            <h2 style={{ fontSize: '3rem', margin: 0, color: '#0984e3' }}>6年生</h2>
          </div>
        </div>
      </div>
    );
  }

  // Unitえらび
  if (!dialogue) {
    const list = DIALOGUES.filter(d => d.grade === grade);
    return (
      <div className="flex-col gap-lg" style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" onClick={() => setGrade(null)} icon={ArrowLeft}>学年をえらびなおす</Button>
          <h2 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', marginRight: '120px' }}>🗣️ {grade}年生のダイアログ</h2>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {list.map(d => (
            <div key={d.id} className="glass-card hover-scale" style={{ padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0', background: 'white' }} onClick={() => startDialogue(d)}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>{d.unitName}</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>“{d.targetPhrase}”</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 練習画面
  return (
    <div className="flex-col gap-lg" style={{ flex: 1, padding: '2rem', maxWidth: '700px', margin: '0 auto', width: '100%', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => setDialogue(null)} icon={ArrowLeft}>一覧へ</Button>
        <h2 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '1.3rem', marginRight: '80px' }}>{dialogue.unitName}</h2>
      </div>

      {/* 役えらび＆訳トグル */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 'bold', color: '#555' }}>自分の役：</span>
          {(['A', 'B'] as const).map(r => (
            <button key={r} onClick={() => setMyRole(r)}
              style={{ padding: '0.5rem 1.2rem', borderRadius: '999px', border: `2px solid var(--color-primary)`, background: myRole === r ? 'var(--color-primary)' : 'white', color: myRole === r ? 'white' : 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer' }}>
              {r}
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={() => setShowJa(s => !s)} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
          {showJa ? '訳をかくす' : '訳を見る'}
        </Button>
      </div>

      <p style={{ textAlign: 'center', color: '#888', margin: 0, fontSize: '0.9rem' }}>
        相手のセリフは🔈で聞けるよ。自分（{myRole}）のセリフは🎤で読んで発音チェック！
      </p>

      {dialogue.note && (
        <div className="glass-card" style={{ padding: '0.8rem 1rem', background: 'rgba(253, 203, 110, 0.18)', border: '2px solid #fdcb6e', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.3rem' }}>💡</span>
          <span style={{ fontSize: '0.95rem', color: '#7a5a00' }}>{dialogue.note}</span>
        </div>
      )}

      {dialogue.relatedCategories && dialogue.relatedCategories.length > 0 && (
        <div className="glass-card" style={{ padding: '0.8rem 1rem', background: 'rgba(72, 219, 251, 0.12)', border: '2px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem' }}>
            📚 この会話で使う単語は、Picture Dictionaryでも練習できるよ！
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {dialogue.relatedCategories.map(cat => (
              <button
                key={cat}
                className="hover-scale"
                onClick={() => navigate(`/dictionary/${encodeURIComponent(cat)}`)}
                style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: '2px solid var(--color-primary)', background: 'white', color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                「{cat}」を練習する →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* セリフ一覧 */}
      <div className="flex-col gap-md">
        {dialogue.lines.map((line, idx) => {
          const isMine = line.speaker === myRole;
          const score = scores[idx];
          return (
            <div key={idx}
              className="glass-card"
              style={{
                padding: '1rem 1.2rem',
                alignSelf: line.speaker === 'A' ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                background: isMine ? 'rgba(72, 219, 251, 0.12)' : 'white',
                border: isMine ? '2px solid var(--color-primary)' : '2px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: line.speaker === 'A' ? '#e17055' : '#0984e3', marginBottom: '0.3rem' }}>
                {line.speaker} {isMine && '（あなた）'}
              </div>
              <div style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)' }}>{renderEn(line.en)}</div>
              {showJa && <div style={{ fontSize: '0.95rem', color: '#666', marginTop: '0.3rem' }}>{line.ja}</div>}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.6rem' }}>
                <button onClick={() => handleSpeak(line)} title="聞く"
                  style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>
                  🔈
                </button>

                {isMine && azureAvailable && (
                  <button
                    onClick={() => handlePractice(idx, line)}
                    disabled={isAssessing}
                    title="マイクで読む"
                    className={isAssessing && activeLine === idx ? 'animate-pulse' : ''}
                    style={{ background: (isAssessing && activeLine === idx) ? 'var(--color-error)' : 'var(--color-accent)', color: '#000', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: isAssessing ? 'default' : 'pointer', fontSize: '1.1rem', flexShrink: 0 }}
                  >
                    🎤
                  </button>
                )}

                {isMine && azureAvailable && lastRecordingUrl && activeLine === idx && !isAssessing && (
                  <button onClick={() => new Audio(lastRecordingUrl).play()} title="自分の声を聞く"
                    style={{ background: 'white', color: 'var(--color-primary)', border: '2px solid var(--color-primary)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>
                    🔊
                  </button>
                )}

                {score !== undefined && (
                  <span style={{ fontWeight: 'bold', color: score >= PASS ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {Math.round(score)}点 {score >= PASS ? '✅' : '（もう一回！）'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!azureAvailable && (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          ※ 発音チェックを使うには、先生がAzureの設定をすると使えるようになるよ。今は🔈で聞いて練習しよう！
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => setMyRole(myRole === 'A' ? 'B' : 'A')}>
          🔄 役を交代する（今：{myRole}）
        </Button>
      </div>
    </div>
  );
};
