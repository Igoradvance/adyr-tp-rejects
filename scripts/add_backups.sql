-- Automatic backup snapshots (nightly + manual)
create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ticket_count int not null default 0,
  trigger text not null default 'auto',   -- 'auto' | 'manual'
  data jsonb not null
);

alter table public.backups enable row level security;

-- Only super_admin may read backups (writes go through the service-role API)
drop policy if exists backups_read on public.backups;
create policy backups_read on public.backups
  for select using (
    exists (select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin')
  );

-- Explicit privileges (Supabase stops granting them by default to new tables
-- from 2026-10-30). RLS above still limits reads to super_admin.
revoke all on public.backups from anon;
grant select on public.backups to authenticated;
-- The /api/backup/* routes (service key): list/get read, run inserts and
-- prunes old 'auto' snapshots.
grant select, insert, delete on public.backups to service_role;
