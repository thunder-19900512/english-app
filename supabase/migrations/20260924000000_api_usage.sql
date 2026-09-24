-- Gemini / Azure / スタッフPIN の「1日あたり回数」をサーバー側で数えるテーブル。
-- Edge Function（service_role）だけが触る。アプリ（anon / あいことばログイン）からは読み書き不可。
create table if not exists public.api_usage (
  day   date not null,
  api   text not null,
  count integer not null default 0,
  primary key (day, api)
);

alter table public.api_usage enable row level security;
revoke all on public.api_usage from anon, authenticated;

-- 1回ぶん数える。上限に達していたら数えずに false を返す（p_cap <= 0 は無制限）。
create or replace function public.consume_api_quota(p_api text, p_cap integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
  d date := (now() at time zone 'Asia/Tokyo')::date;
begin
  insert into public.api_usage (day, api, count)
  values (d, p_api, 1)
  on conflict (day, api) do update
    set count = public.api_usage.count + 1
    where p_cap <= 0 or public.api_usage.count < p_cap
  returning count into n;
  return n is not null;
end;
$$;

revoke execute on function public.consume_api_quota(text, integer) from public, anon, authenticated;
grant execute on function public.consume_api_quota(text, integer) to service_role;
