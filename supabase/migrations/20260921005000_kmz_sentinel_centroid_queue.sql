create or replace view public.kmz_sentinel_centroid_queue
with (security_invoker = true)
as
select
  k.id,
  k.file_name,
  k.region,
  k.rol_numbers,
  k.metadata,
  k.updated_at
from public.kmz_collection k
where coalesce(k.is_active, true)
  and nullif(k.metadata->'sii_point_resolution'->'record'->>'rol', '') is not null
  and coalesce(
    nullif(k.metadata->'sii_point_resolution'->'record'->>'comuna', ''),
    nullif(k.metadata->'sii_point_resolution'->'record'->'raw'->>'nombreComuna', '')
  ) is not null
  and nullif(k.metadata->'sii_point_resolution'->'record'->'coordinates'->>'lat', '') is not null
  and nullif(k.metadata->'sii_point_resolution'->'record'->'coordinates'->>'lng', '') is not null
  and exists (
    select 1
    from public.kmz_enrichment_evidence c
    where c.kmz_id = k.id
      and c.source = 'CIREN IDE MINAGRI'
      and c.field_name = 'ciren_parcel_match'
      and c.metadata->>'pipeline' = 'kmz-ciren-backfill-v4'
      and c.status = 'not_found'
      and c.metadata->>'coverageReason' = 'no_ciren_feature_at_geometry'
  )
  and not exists (
    select 1
    from public.kmz_enrichment_evidence s
    where s.kmz_id = k.id
      and s.source = 'Copernicus Data Space / Sentinel-2 L2A'
      and s.field_name = 'sentinel_centroid_fallback'
      and s.metadata->>'pipeline' = 'kmz-sentinel-centroid-v1'
      and (
        (s.status = 'available' and s.observed_at >= now() - interval '180 days')
        or
        (s.status in ('unavailable', 'unconfigured') and s.observed_at >= now() - interval '1 day')
      )
  )
order by k.updated_at nulls first, k.created_at nulls first, k.id;

revoke all on public.kmz_sentinel_centroid_queue from anon, authenticated;
grant select on public.kmz_sentinel_centroid_queue to service_role;

comment on view public.kmz_sentinel_centroid_queue is
  'Server-only queue for ROLs with no CIREN fruit-cadastre feature but a verified SII point. Feeds Sentinel-2 centroid fallback without converting provider unavailability into a negative property fact.';
