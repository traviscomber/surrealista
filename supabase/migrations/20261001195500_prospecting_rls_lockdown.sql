-- Lock down prospecting operational tables that are only accessed through
-- authenticated server routes/service-role clients. Browser access is proxied
-- through /api/supabase-rest, which validates the canonical internal session.

alter table public.prospecting_cases enable row level security;
alter table public.prospecting_case_events enable row level security;
alter table public.prospecting_memory enable row level security;

revoke all on table public.prospecting_cases from anon, authenticated;
revoke all on table public.prospecting_case_events from anon, authenticated;
revoke all on table public.prospecting_memory from anon, authenticated;
