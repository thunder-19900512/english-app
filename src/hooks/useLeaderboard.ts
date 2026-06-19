import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LeaderboardRecord {
  name: string;
  time: number;
}

export const useLeaderboard = (category: string, mode: string) => {
  const [classBest, setClassBest] = useState<LeaderboardRecord | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeaderboard = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('students').select('name, dictionary_progress');
      if (error || !data) return;

      let bestTime = Infinity;
      let bestName = '';

      for (const student of data) {
        if (student.dictionary_progress && student.dictionary_progress[category]) {
          const t = student.dictionary_progress[category][`${mode}_best_time`];
          if (t && typeof t === 'number' && t < bestTime) {
            bestTime = t;
            bestName = student.name;
          }
        }
      }

      if (isMounted && bestTime !== Infinity) {
        setClassBest({ name: bestName, time: bestTime });
      }
    };

    fetchLeaderboard();
    
    // Subscribe to realtime updates to keep the leaderboard fresh!
    const channel = supabase.channel(`leaderboard_${category}_${mode}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students' }, fetchLeaderboard)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, fetchLeaderboard)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [category, mode]);

  return { classBest };
};
