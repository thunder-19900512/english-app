import { useState, useCallback, useEffect } from 'react';
import { pushToSupabase } from '../lib/sync';

export interface Reflection {
  id: string;
  date: string; // ISO string
  stars: number; // 1-5
  comment: string;
}

export const useReflections = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    if (!studentId) return;
    const key = `reflections_${studentId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        setReflections(JSON.parse(data));
      } catch (e) {
        console.error('Failed to parse reflections', e);
      }
    }
  }, [studentId]);

  const saveReflection = useCallback((stars: number, comment: string) => {
    if (!studentId) return;
    
    const newReflection: Reflection = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      stars,
      comment
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
