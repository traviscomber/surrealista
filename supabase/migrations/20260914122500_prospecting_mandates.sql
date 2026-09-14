create table if not exists public.prospecting_mandates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  commune text,
  species text,
  min_ha numeric,
  max_ha numeric,
  status text not null default 'active' check (status in ('active','paused','closed')),
  last_candidate_count integer not null default 0,
  last_new_candidate_count integer not null default 0,
  last_candidate_ids uuid[] not null default '{}',
  last_run_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prospecting_mandates_area_range check (min_ha is null or max_ha is null or min_ha <= max_ha)
);

comment on table public.prospecting_mandates is 'Internal Sur Realista prospecting mandates used to monitor matching rural properties over time.';

create index if not exists prospecting_mandates_status_idx on public.prospecting_mandates(status);
create index if not exists prospecting_mandates_location_idx on public.prospecting_mandates(region, commune);

alter table public.prospecting_mandates enable row level security;

-- Internal server routes use the service role. Intentionally no public RLS policy.
