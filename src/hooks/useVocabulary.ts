import { useState, useEffect } from 'react';
import { vocabulary as staticVocab, type Vocabulary } from '../data/vocabulary';
import { supabase } from '../lib/supabase';

// 「マイ単語」（先生・子どもが追加した地域固有語など）を、もとの単語リストに合流させて返す。
// 追加データは設定行 app_settings_v1 の dictionary_progress.customVocab に共有で保存し、
// 全端末でリアルタイムに反映する（みんなで作る単語バンク）。

const SETTINGS_ID = 'app_settings_v1';

let cache: Vocabulary[] = staticVocab;
let loaded = false;
const listeners = new Set<() => void>();

const toVocab = (custom: any[]): Vocabulary[] =>
  (custom || []).map((c: any, i: number) => ({
    id: c.id || `custom_${i}`,
    english: c.english || '',
    japanese: c.japanese || '',
    category: c.category || 'マイ単語',
    page: 0,
    emoji: c.emoji || '✏️',
    keyPhrase: c.keyPhrase || '',
    imageUrl: c.imageUrl || undefined,
    custom: true,
  }));

const apply = (custom: any[]) => {
  cache = [...staticVocab, ...toVocab(custom)];
  listeners.forEach((l) => l());
};

const loadOnce = async () => {
  if (loaded || !supabase) return;
  loaded = true;
  try {
    const { data } = await supabase
      .from('students')
      .select('dictionary_progress')
      .eq('id', SETTINGS_ID)
      .single();
    apply(data?.dictionary_progress?.customVocab || []);
    // 追加・変更をリアルタイム反映
    supabase
      .channel('custom-vocab')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students', filter: `id=eq.${SETTINGS_ID}` },
        (payload: any) => apply(payload.new?.dictionary_progress?.customVocab || [])
      )
      .subscribe();
  } catch (e) {
    // 取得失敗時はもとの単語だけで動かす
  }
};

// もとの単語＋マイ単語を合流したリストを返すフック（追加されると自動で更新）
export const useVocabulary = (): Vocabulary[] => {
  const [, force] = useState(0);
  useEffect(() => {
    loadOnce();
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return cache;
};

// マイ単語を1件追加する（設定行の customVocab に追記。既存のAPIキー等はそのまま保持）
export const addCustomWord = async (w: {
  english: string;
  japanese: string;
  category: string;
  emoji?: string;
  imageUrl?: string;
}): Promise<{ error: any }> => {
  if (!supabase) return { error: new Error('no supabase') };
  const { data } = await supabase
    .from('students')
    .select('dictionary_progress')
    .eq('id', SETTINGS_ID)
    .single();
  const dp = data?.dictionary_progress || {};
  const list = dp.customVocab || [];
  const entry = {
    id: `custom_${Date.now()}`,
    english: w.english.trim(),
    japanese: w.japanese.trim(),
    category: w.category.trim() || 'マイ単語',
    emoji: (w.emoji || '✏️').trim() || '✏️',
    ...(w.imageUrl && w.imageUrl.trim() ? { imageUrl: w.imageUrl.trim() } : {}),
  };
  const { error } = await supabase
    .from('students')
    .upsert({ id: SETTINGS_ID, name: 'System Settings', dictionary_progress: { ...dp, customVocab: [...list, entry] } }, { onConflict: 'id' });
  return { error };
};
