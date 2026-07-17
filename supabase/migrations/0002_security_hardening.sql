-- Security hardening based on Supabase advisor findings.

-- 1. Pin search_path on set_updated_at to prevent search_path hijacking.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Pin search_path on handle_new_user (already security definer, used only
--    by the auth.users trigger) and revoke direct RPC execution by anon /
--    authenticated roles so it can't be called as a public endpoint.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
