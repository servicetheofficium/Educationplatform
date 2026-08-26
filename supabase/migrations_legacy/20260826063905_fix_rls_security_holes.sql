-- Security fix: receipts RLS policy had USING(true)/WITH CHECK(true), exposing
-- all receipts (PII + payment data) to any client using the public anon key.
drop policy if exists "Admin full access" on public.receipts;
create policy "Admin full access" on public.receipts
  for all
  to authenticated
  using ( (select is_admin()) )
  with check ( (select is_admin()) );

-- Security fix: "Users can update own profile" only checked auth.uid() = id,
-- with no column restriction, so any authenticated user could set their own
-- user_type to 'admin' and gain full admin access across the whole schema
-- (every admin policy in this project gates on is_admin(), which reads
-- profiles.user_type). Row-level policy is unchanged; column-level grants
-- now restrict the API to only full_name.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;
