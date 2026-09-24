import { CORS_HEADERS, adminClient, consumeQuota, json, requireUser } from '../_shared/common.ts';

// スタッフPINの照合。PINは staff_secret テーブル（k='staff_pin'、アプリからは読めない）にだけ置き、
// 公開されるJSには書かない。お買い物パスワードのリセット（reset_spend_pin）と同じPINを使う。
// 総当たり対策：1日あたりの試行回数に上限を設ける。
const MAX_ATTEMPTS_PER_DAY = 100;

const safeEqual = (a: string, b: string) => {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const admin = adminClient();
  const { data: row } = await admin.from('staff_secret').select('v').eq('k', 'staff_pin').maybeSingle();
  const pin = row?.v;
  if (!pin) return json({ ok: false, error: 'PINが未設定です' }, 503);

  const user = await requireUser(req, admin);
  if (!user) return json({ ok: false, error: 'ログインしなおしてください' }, 401);

  if (!(await consumeQuota(admin, 'staff_pin_attempt', MAX_ATTEMPTS_PER_DAY))) {
    return json({ ok: false, error: '今日はPINの試行回数が上限に達しました' }, 429);
  }

  const body = await req.json().catch(() => null);
  const input = typeof body?.pin === 'string' ? body.pin : '';
  return json({ ok: safeEqual(input, pin) });
});
