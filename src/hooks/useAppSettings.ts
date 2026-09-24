import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { setCap, getCap } from '../lib/apiUsage';
import { saveMissionCache } from '../lib/missionBonus';

export interface TodayMission {
  label: string;
  route: string;
  videoUrl?: string; // 教科書モードのとき、動画へのリンク
}

export const useAppSettings = () => {
  // カスタムドメインのエンドポイント（Azure AI Foundry / AI services のリソースはこれが要る）
  // ロック：none / screen（注目モード）/ reflection（ふりかえりだけ使える）。
  // 旧設定の isScreenLocked（真偽）も読める。lockMode があればそちらを優先
  // 先生が「発音チェックをオフ」にしたら、全端末でかんたんな聞き取り（Web Speech）に切り替える
  const [azureDisabled, setAzureDisabled] = useState<boolean>(false);
  const [lockMode, setLockMode] = useState<'none' | 'screen' | 'reflection'>('none');
  // 今日のミッション（複数対応）。旧データの todayMission（単数）も読めるようにする。
  const [todayMissions, setTodayMissions] = useState<TodayMission[]>([]);
  const [geminiDailyCap, setGeminiDailyCap] = useState<number>(getCap('gemini'));
  const [azureDailyCap, setAzureDailyCap] = useState<number>(getCap('azure'));
  // マイ単語ついか機能を子どもに見せるか（既定OFF。先生が運用を決めてからONにする）
  const [customVocabEnabled, setCustomVocabEnabled] = useState<boolean>(false);
  // AI英会話の各Unitゴールの上書き（先生がダッシュボードで編集）。{ [unitId]: { goal, missionJa, greetingEn, greetingJa } }
  const [freetalkGoals, setFreetalkGoals] = useState<Record<string, { goal?: string; missionJa?: string; greetingEn?: string; greetingJa?: string; clearAll?: string[]; bonusAny?: string[]; hints?: { en: string; ja: string }[] }>>({});
  // クラスの木のグループ分け（'cls'=56A対56B / 'grade'=5年対6年）。既定はcls。
  const [treeMode, setTreeMode] = useState<'cls' | 'grade'>('cls');
  // ポイントを使うときの合言葉の受付（lib/spendPin.ts）。読み込むまでは安全側＝止めておく
  const [spendMode, setSpendMode] = useState<'locked' | 'setup' | 'open'>('locked');
  // セールの日（ショップの値引き。0＝ふだん）。先生がスタッフ画面で決める
  const [salePercent, setSalePercent] = useState<number>(0);
  const [saleLabel, setSaleLabel] = useState<string>('');

  useEffect(() => {
    if (!supabase) return;

    const applySettings = (progress: any) => {
      if (!progress) return;
      setAzureDisabled(progress.azureDisabled === true);
      if (progress.lockMode !== undefined) setLockMode(progress.lockMode || 'none');
      else if (progress.isScreenLocked !== undefined) setLockMode(progress.isScreenLocked ? 'screen' : 'none');
      // 複数ミッション（新形式）を優先。無ければ旧形式（単数）を配列に包んで互換維持
      // ボーナス判定は加点の瞬間に端末側で行うので、受け取ったミッションを控えておく
      if (progress.todayMissions !== undefined) { setTodayMissions(progress.todayMissions || []); saveMissionCache(progress.todayMissions || []); }
      else if (progress.todayMission !== undefined) { const one = progress.todayMission ? [progress.todayMission] : []; setTodayMissions(one); saveMissionCache(one); }
      // APIの1日上限を localStorage にミラーして、各画面の使用量チェックから参照できるようにする。
      if (progress.geminiDailyCap !== undefined) { setCap('gemini', progress.geminiDailyCap); setGeminiDailyCap(progress.geminiDailyCap); }
      if (progress.azureDailyCap !== undefined) { setCap('azure', progress.azureDailyCap); setAzureDailyCap(progress.azureDailyCap); }
      if (progress.customVocabEnabled !== undefined) setCustomVocabEnabled(progress.customVocabEnabled);
      if (progress.freetalkGoals !== undefined) setFreetalkGoals(progress.freetalkGoals || {});
      if (progress.treeMode !== undefined) setTreeMode(progress.treeMode || 'cls');
      setSpendMode(progress.spendMode === 'setup' || progress.spendMode === 'open' ? progress.spendMode : 'locked');
      if (progress.salePercent !== undefined) setSalePercent(Math.min(80, Math.max(0, Number(progress.salePercent) || 0)));
      if (progress.saleLabel !== undefined) setSaleLabel(progress.saleLabel || '');
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

  return { azureDisabled, lockMode, todayMissions, geminiDailyCap, azureDailyCap, customVocabEnabled, freetalkGoals, treeMode, spendMode, salePercent, saleLabel };
};
