create table if not exists public.internal_one_shot_jobs (
  job_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','running','done','failed')),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  finished_at timestamptz,
  result jsonb,
  error text
);

alter table public.internal_one_shot_jobs enable row level security;
revoke all on table public.internal_one_shot_jobs from public, anon, authenticated;
grant select, insert, update, delete on table public.internal_one_shot_jobs to service_role;

create or replace function public.claim_internal_one_shot_job(p_job_key text)
returns table(job_key text, payload jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.internal_one_shot_jobs j
     set status='running', claimed_at=now(), error=null
   where j.job_key=p_job_key
     and j.status='pending'
  returning j.job_key, j.payload;
end;
$$;

revoke all on function public.claim_internal_one_shot_job(text) from public, anon, authenticated;
grant execute on function public.claim_internal_one_shot_job(text) to service_role;

comment on table public.internal_one_shot_jobs is
  'Server-only one-shot operational jobs for controlled production validation.';