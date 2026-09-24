import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

export const adminClient = (): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

// anonキーもJWTなので、verify_jwtだけでは「あいことばログイン済み」を保証できない。ユーザーの実在を確認する。
export const requireUser = async (req: Request, admin: SupabaseClient) => {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data?.user ?? null;
};

export const consumeQuota = async (admin: SupabaseClient, api: string, cap: number) => {
  const { data, error } = await admin.rpc('consume_api_quota', { p_api: api, p_cap: cap });
  if (error) throw error;
  return data === true;
};

export const envNumber = (name: string, fallback: number) => {
  const raw = Deno.env.get(name);
  const n = Number(raw);
  return raw && Number.isFinite(n) ? n : fallback;
};
