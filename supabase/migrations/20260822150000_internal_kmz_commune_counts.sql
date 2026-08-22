create or replace function public.get_internal_kmz_commune_counts()
returns table (commune text, kmz_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    upper(trim(k.metadata->'sii_point_resolution'->'record'->>'comuna')) as commune,
    count(*)::bigint as kmz_count
  from public.kmz_collection k
  where k.metadata->'sii_point_resolution'->'record'->>'comuna' is not null
  group by 1;
$$;

revoke all on function public.get_internal_kmz_commune_counts() from public, anon, authenticated;
grant execute on function public.get_internal_kmz_commune_counts() to service_role;

comment on function public.get_internal_kmz_commune_counts() is
  'Internal-only aggregation of KMZ inventory by SII-resolved commune for Sur Realista territorial intelligence.';
