import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAppSettings = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [azureSpeechKey, setAzureSpeechKey] = useState<string | null>(null);
  const [azureSpeechRegion, setAzureSpeechRegion] = useState<string | null>(null);
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);

  useEffect(() => {
    if (!supabase) return;

    const applySettings = (progress: any) => {
      if (!progress) return;
      if (progress.geminiApiKey !== undefined) setApiKey(progress.geminiApiKey);
      if (progress.azureSpeechKey !== undefined) setAzureSpeechKey(progress.azureSpeechKey);
      if (progress.azureSpeechRegion !== undefined) setAzureSpeechRegion(progress.azureSpeechRegion);
      if (progress.isScreenLocked !== undefined) setIsScreenLocked(progress.isScreenLocked);
    };

    const fetchSettings = async () => {
      const { data } = await supabase
        .from('students')
        .select('dictionary_progress')
        .eq('id', 'app_settings_v1')
        .single();

      if (data && data.dictionary_progress) {
        applySettings(data.dictionary_progress);
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
        applySettings(payload.new.dictionary_progress);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { geminiApiKey: apiKey, azureSpeechKey, azureSpeechRegion, isScreenLocked };
};
