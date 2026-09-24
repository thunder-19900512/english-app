import { supabase } from './supabase';

// Gemini / Azure / スタッフPIN はすべて Supabase Edge Function 経由で呼ぶ。
// キーやPINはサーバー（Secrets）にだけあり、このアプリのコードには入らない。

const invoke = async <T>(name: string, body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let msg = 'つうしんに しっぱいしたよ。もういちど ためしてね';
    try {
      const j = await (error as { context?: Response }).context?.json();
      if (j?.error) msg = j.error;
    } catch { /* 本文なし */ }
    throw new Error(msg);
  }
  return data as T;
};

export type GeminiContent = { role: 'user' | 'model'; parts: { text: string }[] };

export const generateWithGemini = async (req: {
  contents: GeminiContent[];
  system?: string;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<string> => {
  const { text } = await invoke<{ text: string }>('gemini', req);
  return text;
};

export const fetchAzureSpeechToken = () =>
  invoke<{ token: string; region: string }>('azure-token', {});

export const checkStaffPin = async (pin: string): Promise<boolean> => {
  try {
    const { ok } = await invoke<{ ok: boolean }>('staff-check', { pin });
    return ok;
  } catch {
    return false;
  }
};
