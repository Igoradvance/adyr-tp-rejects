-- Add SAIPEM columns to tickets (Build 66)
alter table public.tickets
  add column if not exists saipem_status text check (saipem_status in ('לפני סייפם', 'אחרי סייפם'));

alter table public.tickets
  add column if not exists saipem_notes text;