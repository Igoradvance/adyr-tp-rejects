-- ============================================================================
-- RLS lockdown (Build 85) — run ONCE in Supabase → SQL Editor.
-- Undo with scripts/rls_rollback.sql.
--
-- Before: anyone with the public key could read AND modify every ticket and
-- profile (including a profile's `role`) without logging in.
-- After:  nothing is reachable without a login, and each role only gets what
-- the app's UI already gives it. The /api routes use the service key and are
-- unaffected (they verify the caller themselves).
-- ============================================================================

-- 1) Role helpers. SECURITY DEFINER so policies can read `profiles` without
--    recursing into profiles' own RLS.
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.app_contractor() returns text
language sql stable security definer set search_path = public as
$$ select contractor from public.profiles where id = auth.uid() $$;

revoke all on function public.app_role() from public, anon;
revoke all on function public.app_contractor() from public, anon;
grant execute on function public.app_role() to authenticated;
grant execute on function public.app_contractor() to authenticated;

-- 2) Drop every existing policy on tickets/profiles (their current state is
--    unknown and clearly too open), then enable RLS.
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('tickets', 'profiles')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.tickets  enable row level security;
alter table public.profiles enable row level security;

-- 3) tickets
--    read:   admin / QC / viewer see all; contractor users see their contractor's
--    insert: admin / QC
--    update: admin / QC everything; contractor users only their contractor's
--            (and they cannot move a ticket to another contractor)
--    delete: admin only
create policy tickets_select on public.tickets for select to authenticated using (
  public.app_role() in ('super_admin', 'quality_control', 'viewer')
  or (public.app_role() in ('contractor_pm', 'contractor_employee')
      and contractor = public.app_contractor())
);

create policy tickets_insert on public.tickets for insert to authenticated with check (
  public.app_role() in ('super_admin', 'quality_control')
);

create policy tickets_update on public.tickets for update to authenticated
using (
  public.app_role() in ('super_admin', 'quality_control')
  or (public.app_role() in ('contractor_pm', 'contractor_employee')
      and contractor = public.app_contractor())
)
with check (
  public.app_role() in ('super_admin', 'quality_control')
  or (public.app_role() in ('contractor_pm', 'contractor_employee')
      and contractor = public.app_contractor())
);

create policy tickets_delete on public.tickets for delete to authenticated using (
  public.app_role() = 'super_admin'
);

-- 4) profiles: a user can read only their own row (admins read all). There is
--    deliberately NO insert/update/delete policy: profiles are written only by
--    the server (service key), so nobody can change a role from the browser.
create policy profiles_select_self  on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select to authenticated
  using (public.app_role() = 'super_admin');

-- 5) Privileges (defence in depth, independent of the policies)
revoke all on public.tickets, public.profiles, public.app_settings, public.backups from anon;
grant select, insert, update, delete on public.tickets to authenticated;
grant select on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from authenticated;

-- 6) Verify: should list exactly the policies above
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' and tablename in ('tickets', 'profiles', 'app_settings', 'backups')
order by tablename, policyname;
