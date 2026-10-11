-- ============================================================================
-- ROLLBACK for scripts/rls_lockdown.sql — restores the previous OPEN state
-- (anyone with the public key can read/write tickets and profiles).
-- Use ONLY if real users are locked out and you need the app back immediately;
-- then tell the developer so the policy can be fixed and re-applied.
-- ============================================================================
alter table public.tickets  disable row level security;
alter table public.profiles disable row level security;

grant select, insert, update, delete on public.tickets  to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;
