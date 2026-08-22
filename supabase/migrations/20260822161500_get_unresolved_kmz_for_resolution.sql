create or replace function public.get_unresolved_kmz_for_resolution(p_limit integer default 12)
returns table (
  id uuid,
  file_name text,
  region text,
  bounds jsonb,
  metadata jsonb
)
language sql
security definer
set search_path = public
as $$
  select k.id, k.file_name, k.region, k.bounds, k.metadata
  from public.kmz_collection k
  where k.is_active = true
    and coalesce(nullif(trim(k.metadata #>> '{sii_point_resolution,record,comuna}'), ''), '') = ''
    and k.region in ('Los Lagos', 'Los Ríos', 'Región de Aysén del General Carlos Ibáñez del Campo')
  order by k.updated_at asc nulls first, k.created_at asc
  limit least(greatest(coalesce(p_limit, 12), 1), 20);
$$;

revoke all on function public.get_unresolved_kmz_for_resolution(integer) from public, anon, authenticated;
grant execute on function public.get_unresolved_kmz_for_resolution(integer) to service_role;
