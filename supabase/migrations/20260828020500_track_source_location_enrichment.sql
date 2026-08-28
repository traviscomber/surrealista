alter table public.properties_external
  add column if not exists source_location_status text,
  add column if not exists source_location_attempted_at timestamptz,
  add column if not exists source_location_next_retry_at timestamptz,
  add column if not exists source_location_last_error text;

create index if not exists idx_properties_external_source_location_queue
  on public.properties_external (source, source_location_next_retry_at, source_location_attempted_at)
  where is_active = true and lat is null and source_url is not null;
