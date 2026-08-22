import React, { useEffect, useRef, useState } from 'react';
import { useSafeBack } from '../../hooks/useSafeBack';
import { Button } from '../ui/Button';
import { ArrowLeft, Mic, Square, Play } from 'lucide-react';

// マイクテスト（P0-3）：「マイクが拾えてない」を子ども自身が確認できる画面。
// ①音量メーターでこえが届いているかを見る ②録音→自分の声を聞き返す。
export const MicTest: React.FC = () => {
  const goBack = useSafeBack();

  const [phase, setPhase] = useState<'idle' | 'testing' | 'error'>('idle');
  const [volume, setVolume] = useState(0);          // 0〜1
  const [peak, setPeak] = useState(0);              // セッション中の最大
  const [isRecording, setIsRecording] = useState(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (recTimerRef.current) clearTimeout(recTimerRef.current);
    try { recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach(t => t.stop());
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null;
    ctxRef.current = null;
  };

  useEffect(() => () => { cleanup(); if (recordUrl) URL.revokeObjectURL(recordUrl); }, []); // eslint-disable-line

  const startTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      setPhase('testing');
      setPeak(0);

      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const vol = Math.min(1, rms * 4); // 表示用に増幅
        setVolume(vol);
        setPeak(p => Math.max(p, vol));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setPhase('error');
      setErrMsg('マイクを使えませんでした。ブラウザのマイク許可（アドレスバーの🔒マーク→マイク→許可）をたしかめてね。それでもダメなら先生を呼ぼう！');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(streamRef.current);
    recorderRef.current = rec;
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
      setRecordUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
      setIsRecording(false);
    };
    rec.start();
    setIsRecording(true);
    // 最長5秒で自動停止
    recTimerRef.current = setTimeout(() => { try { rec.stop(); } catch { /* noop */ } }, 5000);
  };

  const stopRecording = () => {
    if (recTimerRef.current) clearTimeout(recTimerRef.current);
    try { recorderRef.current?.stop(); } catch { /* noop */ }
  };

  const loud = volume > 0.12;

  return (
    <div className="flex-col gap-lg" style={{ flex: 1, maxWidth: '640px', margin: '0 auto', width: '100%', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => { cleanup(); goBack(); }} icon={ArrowLeft}>もどる</Button>
        <h2 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', marginRight: '80px' }}>🎙️ マイクテスト</h2>
      </div>

      {phase === 'idle' && (
        <div className="glass-card flex-col flex-center gap-md" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem' }}>🎙️</div>
          <p style={{ fontSize: '1.2rem', margin: 0 }}>
            マイクがちゃんと動いているか、たしかめよう！<br />
            <span style={{ fontSize: '0.95rem', color: '#666' }}>（イヤホンマイクの人は、先にさしこんでからスタート）</span>
          </p>
          <Button size="lg" onClick={startTest} icon={Mic}>テストをはじめる</Button>
        </div>
      )}

      {phase === 'error' && (
        <div className="glass-card" style={{ padding: '2rem', border: '2px solid var(--color-error)', background: '#fef2f2' }}>
          <p style={{ margin: 0, fontSize: '1.1rem', color: '#b91c1c', fontWeight: 'bold' }}>{errMsg}</p>
          <div style={{ marginTop: '1rem' }}>
            <Button onClick={() => { setPhase('idle'); }}>もう一回ためす</Button>
          </div>
        </div>
      )}

      {phase === 'testing' && (
        <>
          {/* ①音量メーター */}
          <div className="glass-card flex-col gap-md" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ margin: 0 }}>① こえを出してみよう（"Hello!"）</h3>
            <div style={{ height: '34px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.round(volume * 100)}%`,
                background: loud ? 'var(--color-success)' : '#f59e0b',
                transition: 'width 0.08s linear', borderRadius: '999px',
              }} />
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: loud ? 'var(--color-success)' : '#94a3b8' }}>
              {loud
                ? '👍 こえが とどいているよ！'
                : peak > 0.12
                  ? 'こえを出すと みどりになるよ'
                  : '…まだ こえが きこえないよ。マイクにむかって話してみて'}
            </div>
            {peak <= 0.12 && (
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
                こえを出してもメーターが動かないときは、マイクがこわれているかも。先生を呼ぼう！
              </p>
            )}
          </div>

          {/* ②録音→聞き返し */}
          <div className="glass-card flex-col gap-md" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ margin: 0 }}>② 録音して、自分のこえを聞いてみよう</h3>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!isRecording ? (
                <Button onClick={startRecording} icon={Mic} style={{ background: 'var(--color-error)', color: 'white' }}>
                  録音する（5秒まで）
                </Button>
              ) : (
                <Button onClick={stopRecording} icon={Square} className="animate-recording">
                  とめる
                </Button>
              )}
              {recordUrl && !isRecording && (
                <Button variant="outline" onClick={() => new Audio(recordUrl).play()} icon={Play}>
                  自分のこえを聞く
                </Button>
              )}
            </div>
            {recordUrl && !isRecording && (
              <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>
                自分のこえが聞こえたら、マイクはバッチリ！発音チェックやAI英会話にすすもう🎉<br />
                聞こえなかったら、マイクのさしこみを見なおして先生を呼ぼう。
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
