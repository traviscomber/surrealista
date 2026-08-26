alter table public.properties_external
  add column if not exists geocode_attempted_at timestamptz,
  add column if not exists geocode_attempt_count integer not null default 0,
  add column if not exists geocode_status text,
  add column if not exists geocode_confidence numeric,
  add column if not exists geocode_next_retry_at timestamptz,
  add column if not exists geocode_last_error text;

create index if not exists properties_external_geocode_retry_idx
  on public.properties_external (geocode_next_retry_at, geocode_attempted_at)
  where is_active = true and lat is null;
