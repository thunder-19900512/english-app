import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { setCap, getCap } from '../lib/apiUsage';

export interface TodayMission {
  label: string;
  route: string;
  videoUrl?: string; // 教科書モードのとき、動画へのリンク
}

export const useAppSettings = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [azureSpeechKey, setAzureSpeechKey] = useState<string | null>(null);
  const [azureSpeechRegion, setAzureSpeechRegion] = useState<string | null>(null);
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const [todayMission, setTodayMission] = useState<TodayMission | null>(null);
  const [geminiDailyCap, setGeminiDailyCap] = useState<number>(getCap('gemini'));
  const [azureDailyCap, setAzureDailyCap] = useState<number>(getCap('azure'));

  useEffect(() => {
    if (!supabase) return;

    const applySettings = (progress: any) => {
      if (!progress) return;
      if (progress.geminiApiKey !== undefined) setApiKey(progress.geminiApiKey);
      if (progress.azureSpeechKey !== undefined) setAzureSpeechKey(progress.azureSpeechKey);
      if (progress.azureSpeechRegion !== undefined) setAzureSpeechRegion(progress.azureSpeechRegion);
      if (progress.isScreenLocked !== undefined) setIsScreenLocked(progress.isScreenLocked);
      if (progress.todayMission !== undefined) setTodayMission(progress.todayMission || null);
      // APIの1日上限を localStorage にミラーして、各画面の使用量チェックから参照できるようにする。
      if (progress.geminiDailyCap !== undefined) { setCap('gemini', progress.geminiDailyCap); setGeminiDailyCap(progress.geminiDailyCap); }
      if (progress.azureDailyCap !== undefined) { setCap('azure', progress.azureDailyCap); setAzureDailyCap(progress.azureDailyCap); }
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

  return { geminiApiKey: apiKey, azureSpeechKey, azureSpeechRegion, isScreenLocked, todayMission, geminiDailyCap, azureDailyCap };
};
