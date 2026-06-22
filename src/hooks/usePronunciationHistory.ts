import { useCallback, useEffect, useState } from 'react';
import { pushToSupabase } from '../lib/sync';

export type ScoreMode = 'battle' | 'story' | 'textbook';

export interface ScoreRecord {
  ts: number;       // 記録時刻（ミリ秒）
  mode: ScoreMode;  // どの活動で出たスコアか
  score: number;    // 0-100
  label: string;    // 単語・フレーズ・単元名など
}

const MAX_RECORDS = 300;

const keyFor = (studentId: string) => `pronHistory_${studentId}`;

const readHistory = (studentId: string): ScoreRecord[] => {
  const str = localStorage.getItem(keyFor(studentId));
  return str ? JSON.parse(str) : [];
};

/**
 * 発音スコアの履歴を貯める・読むフック。
 * VoiceBattle / StoryMode / TextbookMode から addScore で記録し、
 * MyProgress（じぶんの記録）で推移グラフに使う。localStorage＋Supabaseに同期。
 */
export const usePronunciationHistory = () => {
  const studentId = localStorage.getItem('studentId');
  const [history, setHistory] = useState<ScoreRecord[]>(() =>
    studentId ? readHistory(studentId) : []
  );

  useEffect(() => {
    const refresh = () => {
      if (studentId) setHistory(readHistory(studentId));
    };
    window.addEventListener('pronHistoryUpdated', refresh);
    return () => window.removeEventListener('pronHistoryUpdated', refresh);
  }, [studentId]);

  const addScore = useCallback(
    (mode: ScoreMode, score: number, label: string) => {
      if (!studentId) return;
      const record: ScoreRecord = { ts: Date.now(), mode, score: Math.round(score), label };
      const next = [...readHistory(studentId), record].slice(-MAX_RECORDS);
      localStorage.setItem(keyFor(studentId), JSON.stringify(next));
      setHistory(next);
      window.dispatchEvent(new Event('pronHistoryUpdated'));
      pushToSupabase(studentId);
    },
    [studentId]
  );

  return { history, addScore };
};
