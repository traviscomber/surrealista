drop function if exists public.get_unresolved_kmz_for_resolution(integer);

create function public.get_unresolved_kmz_for_resolution(p_limit integer default 20)
returns table (
  id uuid,
  file_name text,
  region text,
  bounds jsonb,
  coordinates jsonb,
  metadata jsonb
)
language sql
security definer
set search_path = public
as $$
  select k.id, k.file_name, k.region, k.bounds, k.coordinates, k.metadata
  from public.kmz_collection k
  where k.is_active = true
    and coalesce(
      nullif(trim(k.metadata #>> '{territorial_resolution,commune}'), ''),
      nullif(trim(k.metadata #>> '{sii_point_resolution,record,comuna}'), '')
    ) is null
    and k.region in ('Los Lagos', 'Los Ríos', 'Región de Aysén del General Carlos Ibáñez del Campo')
    and (
      nullif(k.metadata #>> '{territorial_resolution_attempt,attempted_at}', '') is null
      or (k.metadata #>> '{territorial_resolution_attempt,attempted_at}')::timestamptz < now() - interval '24 hours'
    )
  order by k.updated_at asc nulls first, k.created_at asc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke all on function public.get_unresolved_kmz_for_resolution(integer) from public, anon, authenticated;
grant execute on function public.get_unresolved_kmz_for_resolution(integer) to service_role;
