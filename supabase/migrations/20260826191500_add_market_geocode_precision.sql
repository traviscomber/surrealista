alter table public.properties_external
  add column if not exists geocode_precision text;

update public.properties_external
set geocode_precision = 'point'
where lat is not null
  and lng is not null
  and geocode_precision is null;
