import { CORS_HEADERS, adminClient, consumeQuota, envNumber, json, requireUser } from '../_shared/common.ts';

// Geminiを呼ぶ中継役。キー（GEMINI_API_KEY）はSupabaseのSecretsにだけ置き、ブラウザには渡さない。
const API = 'https://generativelanguage.googleapis.com/v1beta';
// コスト固定のため flash-lite を優先。使えない/混雑時は新しいflashへフォールバック。
const PREFERRED = ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.0-flash-lite'];
const FALLBACK = [...PREFERRED, 'gemini-2.5-flash', 'gemini-flash-latest'];

const MAX_CONTENTS = 80;
const MAX_TOTAL_CHARS = 40000;
const MAX_SYSTEM_CHARS = 10000;

let modelCache: { list: string[]; at: number } | null = null;

const getModels = async (key: string): Promise<string[]> => {
  if (modelCache && Date.now() - modelCache.at < 60 * 60 * 1000) return modelCache.list;
  try {
    const res = await fetch(`${API}/models?pageSize=1000`, { headers: { 'x-goog-api-key': key } });
    if (!res.ok) return FALLBACK;
    const data = await res.json();
    const flash: string[] = (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash'))
      .map((m: any) => m.name.replace('models/', ''))
      .sort((a: string, b: string) => b.localeCompare(a));
    const textOnly = flash.filter(m => !/image|tts|audio|live/.test(m));
    const list = [...PREFERRED.filter(m => textOnly.includes(m)), ...textOnly.filter(m => !PREFERRED.includes(m))].slice(0, 5);
    modelCache = { list: list.length ? list : FALLBACK, at: Date.now() };
    return modelCache.list;
  } catch {
    return FALLBACK;
  }
};

type Content = { role: 'user' | 'model'; parts: { text: string }[] };

const parseBody = (body: any) => {
  if (!body || !Array.isArray(body.contents)) return null;
  const contents: Content[] = body.contents;
  if (contents.length === 0 || contents.length > MAX_CONTENTS) return null;
  let total = 0;
  for (const c of contents) {
    if ((c?.role !== 'user' && c?.role !== 'model') || !Array.isArray(c.parts)) return null;
    for (const p of c.parts) {
      if (typeof p?.text !== 'string') return null;
      total += p.text.length;
    }
  }
  const system = typeof body.system === 'string' ? body.system : '';
  if (total > MAX_TOTAL_CHARS || system.length > MAX_SYSTEM_CHARS) return null;
  const maxOutputTokens = Math.min(Math.max(Number(body.maxOutputTokens) || 1024, 1), 2048);
  const temperature = Math.min(Math.max(Number(body.temperature ?? 0.7), 0), 1.5);
  return {
    contents: contents.map(c => ({ role: c.role, parts: c.parts.map(p => ({ text: p.text })) })),
    system,
    maxOutputTokens,
    temperature,
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return json({ error: 'AIのじゅんびができていません（スタッフに伝えてね）' }, 503);

  const admin = adminClient();
  const user = await requireUser(req, admin);
  if (!user) return json({ error: 'ログインしなおしてね' }, 401);

  const parsed = parseBody(await req.json().catch(() => null));
  if (!parsed) return json({ error: 'リクエストの形がおかしいよ' }, 400);

  if (!(await consumeQuota(admin, 'gemini', envNumber('GEMINI_DAILY_CAP', 1500)))) {
    return json({ error: '今日はクラス全体のAIの上限に達したよ。また明日ね！', code: 'cap' }, 429);
  }

  const payload = JSON.stringify({
    contents: parsed.contents,
    ...(parsed.system ? { systemInstruction: { parts: [{ text: parsed.system }] } } : {}),
    generationConfig: { maxOutputTokens: parsed.maxOutputTokens, temperature: parsed.temperature },
  });

  for (const model of await getModels(key)) {
    const res = await fetch(`${API}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: payload,
    });
    if (res.ok) {
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
      return json({ text, model });
    }
    console.warn(`gemini ${model} failed: ${res.status} ${await res.text()}`);
    // 400/401/403 はモデルを変えても直らない（キーやリクエストの問題）
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return json({ error: 'AIとの通信でエラーが起きたよ（スタッフに伝えてね）' }, 502);
    }
  }
  return json({ error: 'AIが混み合っているみたい。少し待ってからもう一度ためしてね' }, 503);
});
