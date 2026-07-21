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
  // 今日のミッション（複数対応）。旧データの todayMission（単数）も読めるようにする。
  const [todayMissions, setTodayMissions] = useState<TodayMission[]>([]);
  const [geminiDailyCap, setGeminiDailyCap] = useState<number>(getCap('gemini'));
  const [azureDailyCap, setAzureDailyCap] = useState<number>(getCap('azure'));
  // マイ単語ついか機能を子どもに見せるか（既定OFF。先生が運用を決めてからONにする）
  const [customVocabEnabled, setCustomVocabEnabled] = useState<boolean>(false);
  // AI英会話の各Unitゴールの上書き（先生がダッシュボードで編集）。{ [unitId]: { goal, missionJa } }
  const [freetalkGoals, setFreetalkGoals] = useState<Record<string, { goal?: string; missionJa?: string }>>({});
  // クラスの木のグループ分け（'cls'=56A対56B / 'grade'=5年対6年）。既定はcls。
  const [treeMode, setTreeMode] = useState<'cls' | 'grade'>('cls');

  useEffect(() => {
    if (!supabase) return;

    const applySettings = (progress: any) => {
      if (!progress) return;
      if (progress.geminiApiKey !== undefined) setApiKey(progress.geminiApiKey);
      if (progress.azureSpeechKey !== undefined) setAzureSpeechKey(progress.azureSpeechKey);
      if (progress.azureSpeechRegion !== undefined) setAzureSpeechRegion(progress.azureSpeechRegion);
      if (progress.isScreenLocked !== undefined) setIsScreenLocked(progress.isScreenLocked);
      // 複数ミッション（新形式）を優先。無ければ旧形式（単数）を配列に包んで互換維持
      if (progress.todayMissions !== undefined) setTodayMissions(progress.todayMissions || []);
      else if (progress.todayMission !== undefined) setTodayMissions(progress.todayMission ? [progress.todayMission] : []);
      // APIの1日上限を localStorage にミラーして、各画面の使用量チェックから参照できるようにする。
      if (progress.geminiDailyCap !== undefined) { setCap('gemini', progress.geminiDailyCap); setGeminiDailyCap(progress.geminiDailyCap); }
      if (progress.azureDailyCap !== undefined) { setCap('azure', progress.azureDailyCap); setAzureDailyCap(progress.azureDailyCap); }
      if (progress.customVocabEnabled !== undefined) setCustomVocabEnabled(progress.customVocabEnabled);
      if (progress.freetalkGoals !== undefined) setFreetalkGoals(progress.freetalkGoals || {});
      if (progress.treeMode !== undefined) setTreeMode(progress.treeMode || 'cls');
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

  return { geminiApiKey: apiKey, azureSpeechKey, azureSpeechRegion, isScreenLocked, todayMissions, geminiDailyCap, azureDailyCap, customVocabEnabled, freetalkGoals, treeMode };
};
