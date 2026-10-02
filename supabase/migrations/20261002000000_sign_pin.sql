-- ミッションロックの「✍️サインのあと」を開く合言葉（スタッフ画面のPINとは別）。
-- 値は staff_secret（アプリから読めない）に k='sign_pin' で置く（値はここに書かない。Supabase で設定）。スタッフPINでも開ける。
create or replace function public.check_sign_pin(pin text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_secret
    where k in ('sign_pin', 'staff_pin') and v = coalesce(pin, '')
  );
$$;
revoke all on function public.check_sign_pin(text) from public, anon;
grant execute on function public.check_sign_pin(text) to authenticated;
