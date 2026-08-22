create or replace function public.get_kmz_pending_sii_verification(p_limit integer default 10)
returns table(
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
  where coalesce(k.is_active, true) = true
    and coalesce(k.metadata #>> '{territorial_resolution,source}','') in ('subpesca-ide','minvu-dpa-2020','patrimonio-dpa')
    and nullif(trim(k.metadata #>> '{territorial_resolution,commune}'),'') is not null
    and coalesce((k.metadata #>> '{territorial_resolution,siiVerification,verified}')::boolean, false) = false
    and coalesce(k.metadata #>> '{territorial_resolution,siiVerification,status}','pending') in ('pending','error')
  order by coalesce(k.metadata #>> '{territorial_resolution,resolved_at}', k.created_at::text)
  limit greatest(1, least(coalesce(p_limit,10), 50));
$$;

revoke all on function public.get_kmz_pending_sii_verification(integer) from public, anon, authenticated;
grant execute on function public.get_kmz_pending_sii_verification(integer) to service_role;
