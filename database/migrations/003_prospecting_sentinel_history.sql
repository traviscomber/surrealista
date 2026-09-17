-- Persist Copernicus Sentinel-2 observations by ROL for longitudinal prospecting intelligence.
-- Server/service-role only: RLS is enabled intentionally without anon/authenticated policies.

create table if not exists public.prospecting_sentinel_observations (
  id uuid primary key default gen_random_uuid(),
  rol text not null,
  rol_key text not null,
  commune text not null default '',
  source text not null default 'copernicus-sentinel-2-l2a',
  geometry_mode text not null check (geometry_mode in ('ciren_polygon', 'centroid_fallback')),
  geometry_fingerprint text not null,
  period_from timestamptz not null,
  period_to timestamptz not null,
  ndvi numeric,
  ndre numeric,
  ndmi numeric,
  sample_count integer not null default 0 check (sample_count >= 0),
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prospecting_sentinel_observations_unique
    unique (rol_key, source, geometry_fingerprint, period_from, period_to)
);

create index if not exists prospecting_sentinel_observations_rol_period_idx
  on public.prospecting_sentinel_observations (rol_key, period_from desc);

create index if not exists prospecting_sentinel_observations_geometry_idx
  on public.prospecting_sentinel_observations (geometry_fingerprint, period_from desc);

comment on table public.prospecting_sentinel_observations is
  'Server-only longitudinal Sentinel-2 spectral observations for prospecting ROLs. Evidence only; not an agronomic diagnosis or species verification.';

alter table public.prospecting_sentinel_observations enable row level security;
