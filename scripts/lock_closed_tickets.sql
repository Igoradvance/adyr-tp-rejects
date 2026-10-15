-- ============================================================================
-- Build 86 — a CLOSED ticket can be reopened only by QC / super_admin.
-- Run ONCE in Supabase → SQL Editor (after rls_lockdown.sql, which defines
-- public.app_role()). The app already hides the option; this makes it binding
-- even for requests that bypass the UI.
--
-- Contractor users can still chat on a closed ticket; only the status change
-- away from 'סגור' is refused. Server-side/service-key writes (auth.uid() is
-- null, e.g. SQL Editor) are not affected.
--
-- Undo:
--   drop trigger if exists tickets_lock_closed on public.tickets;
--   drop function if exists public.tickets_lock_closed();
-- ============================================================================

create or replace function public.tickets_lock_closed() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if old.status = 'סגור'
     and new.status is distinct from 'סגור'
     and auth.uid() is not null
     and coalesce(public.app_role(), '') not in ('super_admin', 'quality_control')
  then
    raise exception 'רק צוות בקרת האיכות יכול לפתוח מחדש תקלה סגורה'
      using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists tickets_lock_closed on public.tickets;
create trigger tickets_lock_closed
  before update of status on public.tickets
  for each row execute function public.tickets_lock_closed();

-- Verify: should return one row
select tgname from pg_trigger where tgname = 'tickets_lock_closed';
