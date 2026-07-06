-- Global app settings (single row, id = 1)
create table if not exists public.app_settings (
  id int primary key default 1,
  emails_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Seed the single row
insert into public.app_settings (id, emails_enabled)
values (1, true)
on conflict (id) do nothing;

-- RLS: any authenticated user can read; only super_admin can update
alter table public.app_settings enable row level security;

drop policy if exists "settings_read" on public.app_settings;
create policy "settings_read" on public.app_settings
  for select using (auth.role() = 'authenticated');

-- NOTE: INSERT (via upsert) needs a WITH CHECK clause, not just USING —
-- otherwise the upsert is silently rejected by RLS.
drop policy if exists "settings_write" on public.app_settings;
create policy "settings_write" on public.app_settings
  for all
  using (
    exists (select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin')
  )
  with check (
    exists (select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin')
  );

-- Enable realtime
alter publication supabase_realtime add table app_settings;
