-- Read-only check of table privileges for the app's tables (changes nothing).
-- Expected:
--   anon           → no rows at all
--   authenticated  → tickets: SELECT/INSERT/UPDATE/DELETE · profiles: SELECT
--                    app_settings: SELECT/INSERT/UPDATE · backups: SELECT
--   service_role   → at least: profiles SELECT/INSERT/UPDATE/DELETE,
--                    tickets SELECT, backups SELECT/INSERT/DELETE
-- RLS must be enabled (rowsecurity = true) on all four.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('tickets', 'profiles', 'app_settings', 'backups')
  and grantee in ('anon', 'authenticated', 'service_role')
group by table_name, grantee
order by table_name, grantee;

select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('tickets', 'profiles', 'app_settings', 'backups');
