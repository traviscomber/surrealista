create or replace view public.kmz_ciren_enrichment_queue
with (security_invoker = true)
as
select
  k.id,
  k.file_name,
  k.region,
  k.rol_numbers,
  k.bounds,
  k.coordinates,
  k.updated_at
from public.kmz_collection k
where coalesce(k.is_active, true)
  and coalesce(array_length(k.rol_numbers, 1), 0) > 0
  and not exists (
    select 1
    from public.kmz_enrichment_evidence e
    where e.kmz_id = k.id
      and e.source = 'CIREN IDE MINAGRI'
      and e.field_name = 'ciren_parcel_match'
      and coalesce(e.metadata->>'pipeline','') = 'kmz-ciren-backfill-v2'
      and (
        (e.status in ('matched', 'ambiguous', 'not_found') and e.observed_at >= now() - interval '180 days')
        or
        (e.status = 'partial' and e.observed_at >= now() - interval '1 day')
      )
  )
order by k.updated_at nulls first, k.created_at nulls first, k.id;

revoke all on public.kmz_ciren_enrichment_queue from anon, authenticated;
grant select on public.kmz_ciren_enrichment_queue to service_role;

comment on view public.kmz_ciren_enrichment_queue is
  'Server-only queue for KMZ CIREN v2 hybrid ROL + spatial enrichment. Canonical KMZ rows remain unchanged.';
