-- Add checklist column to tickets (list of notes/tasks to close one by one)
alter table public.tickets
  add column if not exists checklist jsonb not null default '[]'::jsonb;
