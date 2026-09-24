import { CORS_HEADERS, adminClient, consumeQuota, envNumber, json, requireUser } from '../_shared/common.ts';

// Azure Speech のキーはSecretsにだけ置き、ブラウザには10分で切れる使い捨てトークンだけを渡す。
// 発音チェック1回につき1トークン発行する＝サーバー側の上限はここで数える。
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const key = Deno.env.get('AZURE_SPEECH_KEY');
  const region = Deno.env.get('AZURE_SPEECH_REGION');
  if (!key || !region) return json({ error: '発音チェックのじゅんびができていません（スタッフに伝えてね）' }, 503);

  const admin = adminClient();
  const user = await requireUser(req, admin);
  if (!user) return json({ error: 'ログインしなおしてね' }, 401);

  if (!(await consumeQuota(admin, 'azure', envNumber('AZURE_DAILY_CAP', 2000)))) {
    return json({ error: '今日はクラス全体の発音チェックの上限に達したよ。また明日ためしてね！', code: 'cap' }, 429);
  }

  const res = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Length': '0' },
  });
  if (!res.ok) {
    console.warn(`azure issueToken failed: ${res.status} ${await res.text()}`);
    return json({ error: '発音チェックの準備に失敗したよ（スタッフに伝えてね）' }, 502);
  }
  return json({ token: await res.text(), region });
});
