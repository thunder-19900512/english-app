import { supabase } from './supabase';

// Gemini / Azure / スタッフPIN はすべて Supabase Edge Function 経由で呼ぶ。
// キーやPINはサーバー（Secrets）にだけあり、このアプリのコードには入らない。

// status: 429=上限 / 502=キーが拒否された / 503=キー未設定 など。呼び出し側の切り替え判断に使う。
export class ProxyError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const invoke = async <T>(name: string, body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const res = (error as { context?: Response }).context;
    let msg = 'つうしんに しっぱいしたよ。もういちど ためしてね';
    let code: string | undefined;
    try {
      const j = await res?.json();
      if (j?.error) msg = j.error;
      code = j?.code;
    } catch { /* 本文なし */ }
    throw new ProxyError(msg, res?.status ?? 0, code);
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
  invoke<{ token: string; region: string; endpoint?: string }>('azure-token', {});

export const checkStaffPin = async (pin: string): Promise<boolean> => {
  try {
    const { ok } = await invoke<{ ok: boolean }>('staff-check', { pin });
    return ok;
  } catch {
    return false;
  }
};
