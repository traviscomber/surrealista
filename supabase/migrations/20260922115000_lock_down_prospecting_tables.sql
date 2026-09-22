-- Lock down persistent prospecting data from direct PostgREST access.
-- App access is server-side via SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

alter table public.prospecting_cases enable row level security;
alter table public.prospecting_case_events enable row level security;
alter table public.prospecting_memory enable row level security;

revoke all on table public.prospecting_cases from anon, authenticated;
revoke all on table public.prospecting_case_events from anon, authenticated;
revoke all on table public.prospecting_memory from anon, authenticated;
