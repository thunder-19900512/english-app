import { useEffect, useRef, useSyncExternalStore } from 'react';

// 先生のロック画面が出ている間は、タイムを計るモードの時計を止める（子どもの声 2026-10-03）。
// GlobalLockScreen がかぶさっている間だけ LockActiveMarker が置かれ、「ロック中」になる。
let activeCount = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const LockActiveMarker = () => {
  useEffect(() => {
    activeCount++; emit();
    return () => { activeCount--; emit(); };
  }, []);
  return null;
};

export const useLockActive = () => useSyncExternalStore(subscribe, () => activeCount > 0);

// ロックが解けたら、止まっていた分だけ startTime を後ろにずらす（＝ロック中の時間はタイムに入らない）。
export const useLockPause = (setStartTime: (f: (prev: number | null) => number | null) => void) => {
  const locked = useLockActive();
  const pausedAt = useRef<number | null>(null);
  useEffect(() => {
    if (locked) {
      pausedAt.current = Date.now();
    } else if (pausedAt.current !== null) {
      const gap = Date.now() - pausedAt.current;
      pausedAt.current = null;
      setStartTime(prev => (prev === null ? prev : prev + gap));
    }
  }, [locked, setStartTime]);
  return locked;
};
