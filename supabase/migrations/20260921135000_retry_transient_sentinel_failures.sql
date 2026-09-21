create or replace view public.kmz_sentinel_centroid_queue
with (security_invoker = true)
as
with candidates as (
  select
    k.id,
    k.file_name,
    k.region,
    k.rol_numbers,
    k.metadata,
    k.updated_at,
    k.created_at,
    upper(regexp_replace(nullif(k.metadata->'sii_point_resolution'->'record'->>'rol', ''), '\s+', '', 'g')) as rol_key,
    round((k.metadata->'sii_point_resolution'->'record'->'coordinates'->>'lat')::numeric, 6)::double precision as lat,
    round((k.metadata->'sii_point_resolution'->'record'->'coordinates'->>'lng')::numeric, 6)::double precision as lng
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
          (
            s.status = 'unconfigured'
            and s.observed_at >= now() - interval '1 day'
          )
          or
          (
            s.status = 'unavailable'
            and s.observed_at >= now() - interval '1 day'
            and not (
              coalesce(s.value_json->>'note', '') ~* 'HTTP (429|5[0-9]{2})'
              or coalesce(s.value_json->>'note', '') ~* '(fetch failed|network|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up)'
            )
          )
        )
    )
),
fingerprinted as (
  select
    candidates.*,
    encode(
      digest(
        convert_to(
          '{"type":"PointFallback","lat":' || lat::text || ',"lng":' || lng::text || '}',
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    ) as geometry_fingerprint
  from candidates
),
pending as (
  select *
  from fingerprinted f
  where not exists (
    select 1
    from public.prospecting_sentinel_observations s
    where s.rol_key = f.rol_key
      and s.source = 'copernicus-sentinel-2-l2a'
      and s.geometry_mode = 'centroid_fallback'
      and s.geometry_fingerprint = f.geometry_fingerprint
      and s.fetched_at >= now() - interval '180 days'
  )
),
ranked as (
  select
    pending.*,
    row_number() over (
      partition by rol_key, geometry_fingerprint
      order by updated_at nulls first, created_at nulls first, id
    ) as target_rank
  from pending
)
select
  id,
  file_name,
  region,
  rol_numbers,
  metadata,
  updated_at
from ranked
where target_rank = 1
order by updated_at nulls first, created_at nulls first, id;

revoke all on public.kmz_sentinel_centroid_queue from anon, authenticated;
grant select on public.kmz_sentinel_centroid_queue to service_role;

comment on view public.kmz_sentinel_centroid_queue is
  'Server-only queue of unique Sentinel centroid targets. Deduplicates exact ROL + SII point fingerprints, reuses recent canonical Sentinel memory, and keeps transient provider failures retryable instead of treating them as negative evidence.';
