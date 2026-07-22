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

grant select on public.backups to authenticated;
