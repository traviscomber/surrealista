create or replace function public.get_internal_kmz_by_commune(p_commune text, p_limit integer default 50)
returns table (
  id uuid,
  file_name text,
  region text,
  rol_numbers text[],
  owner text,
  pic text,
  updated_at timestamptz,
  sii_commune text,
  sii_commune_code text,
  sii_destination text,
  sii_total_assessment numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    k.id,
    k.file_name,
    k.region,
    k.rol_numbers,
    k.owner,
    k.pic,
    k.updated_at,
    k.metadata->'sii_point_resolution'->'record'->>'comuna' as sii_commune,
    k.metadata->'sii_point_resolution'->'record'->>'comunaCodigo' as sii_commune_code,
    k.metadata->'sii_point_resolution'->'record'->>'destino' as sii_destination,
    nullif(k.metadata->'sii_point_resolution'->'record'->>'avaluoTotal','')::numeric as sii_total_assessment
  from public.kmz_collection k
  where upper(trim(k.metadata->'sii_point_resolution'->'record'->>'comuna')) = upper(trim(p_commune))
    and coalesce(k.is_active, true) = true
  order by k.updated_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

revoke all on function public.get_internal_kmz_by_commune(text, integer) from public, anon, authenticated;
grant execute on function public.get_internal_kmz_by_commune(text, integer) to service_role;

comment on function public.get_internal_kmz_by_commune(text, integer) is
  'Internal-only limited KMZ drilldown by SII-resolved commune for Sur Realista territorial intelligence.';
