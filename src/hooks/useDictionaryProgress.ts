import { useState, useEffect } from 'react';
import { pushToSupabase } from '../lib/sync';

export interface DictCategoryProgress {
  practice: boolean;
  spelling: boolean;
  voice: boolean;
  wordsearch: boolean;
  wordsearch_best_time?: number;
}

export const useDictionaryProgress = () => {
  const [progress, setProgress] = useState<Record<string, DictCategoryProgress>>({});
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    if (!studentId) return;
    const dataStr = localStorage.getItem(`student_${studentId}`);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      setProgress(data.dictProgress || {});
    }
  }, [studentId]);

  const saveProgress = (category: string, updates: Partial<DictCategoryProgress>) => {
    if (!studentId) return;
    const dataStr = localStorage.getItem(`student_${studentId}`);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      const currentDictProgress = data.dictProgress || {};
      const categoryProgress = currentDictProgress[category] || {
        practice: false,
        spelling: false,
        voice: false,
        wordsearch: false
      };
      
      const newCategoryProgress = { ...categoryProgress, ...updates };

      currentDictProgress[category] = newCategoryProgress;
      data.dictProgress = currentDictProgress;
      
      localStorage.setItem(`student_${studentId}`, JSON.stringify(data));
      
      // Sync to Supabase in the background
      pushToSupabase(studentId);

      setProgress(currentDictProgress);
    }
  };

  return { progress, saveProgress };
};
