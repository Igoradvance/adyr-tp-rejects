-- Per-user opt-in for email notifications (ticket open + status change)
alter table public.profiles
  add column if not exists email_notifications boolean not null default false;
