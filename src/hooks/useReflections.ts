import { useState, useCallback, useEffect } from 'react';
import { pushToSupabase, pullFromSupabase } from '../lib/sync';

export interface Reflection {
  id: string;
  date: string; // ISO string
  stars: number; // 1-5
  comment: string;
  teacherComment?: string; // 先生からの一言（双方向）
  teacherStamp?: string;   // 先生のスタンプ（絵文字）
  autoStamp?: boolean;     // 👍が自動で付いたもの（先生が押し直すと false）
  noStamp?: boolean;       // ポイントが付かなかったもの（でたらめな文字列等）。自動👍を付けない
}

export const useReflections = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    if (!studentId) return;
    const key = `reflections_${studentId}`;
    const load = () => {
      const data = localStorage.getItem(key);
      if (!data) return;
      try {
        const list = JSON.parse(data);
        setReflections(Array.isArray(list) ? list.filter(Boolean) : []);
      } catch (e) {
        console.error('Failed to parse reflections', e);
      }
    };
    load();
    // 別の端末で書いた分や先生のコメントを取り込む（表示されない・二重加点を防ぐ）
    pullFromSupabase(studentId).then(load).catch(() => {});
  }, [studentId]);

  // noStamp: でたらめな文字列などポイントが付かないふりかえり。自動の👍を付けない印（DBトリガーが見る）
  const saveReflection = useCallback((stars: number, comment: string, noStamp = false) => {
    if (!studentId) return;
    
    const newReflection: Reflection = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      stars,
      comment,
      ...(noStamp ? { noStamp: true } : {}),
    };

    setReflections(prev => {
      const updated = [newReflection, ...prev];
      localStorage.setItem(`reflections_${studentId}`, JSON.stringify(updated));
      
      // Sync to Supabase in the background
      pushToSupabase(studentId);

      return updated;
    });
  }, [studentId]);

  return {
    reflections,
    saveReflection
  };
};
