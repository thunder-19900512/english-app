import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAppSettings = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);

  useEffect(() => {
    if (!supabase) return;

    const fetchSettings = async () => {
      const { data } = await supabase
        .from('students')
        .select('dictionary_progress')
        .eq('id', 'app_settings_v1')
        .single();
        
      if (data && data.dictionary_progress) {
        if (data.dictionary_progress.geminiApiKey) {
          setApiKey(data.dictionary_progress.geminiApiKey);
        }
        if (data.dictionary_progress.isScreenLocked !== undefined) {
          setIsScreenLocked(data.dictionary_progress.isScreenLocked);
        }
      }
    };
    fetchSettings();

    // Listen to real-time changes
    const channelId = `global_controls_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'students',
        filter: "id=eq.app_settings_v1"
      }, (payload) => {
        const newProgress = payload.new.dictionary_progress;
        if (newProgress) {
          if (newProgress.geminiApiKey !== undefined) setApiKey(newProgress.geminiApiKey);
          if (newProgress.isScreenLocked !== undefined) setIsScreenLocked(newProgress.isScreenLocked);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { geminiApiKey: apiKey, isScreenLocked };
};
