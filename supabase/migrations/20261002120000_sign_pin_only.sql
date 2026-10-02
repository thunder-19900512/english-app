-- サインの合言葉は sign_pin だけで照合する（スタッフPINでは開けない）。
-- スタッフPINはスタッフ画面に入る鍵なので、子どもの前で子どもの端末に入れない。空の入力は常に不一致。
create or replace function public.check_sign_pin(pin text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(pin, '') <> '' and exists (
    select 1 from staff_secret
    where k = 'sign_pin' and v = pin
  );
$$;
revoke all on function public.check_sign_pin(text) from public, anon;
grant execute on function public.check_sign_pin(text) to authenticated;
