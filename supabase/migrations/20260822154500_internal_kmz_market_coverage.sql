create or replace function public.get_internal_kmz_market_coverage()
returns table (
  commune text,
  kmz_count bigint,
  inciti_metric_count bigint,
  has_inciti_data boolean,
  last_inciti_scrape timestamptz
)
language sql
security definer
set search_path = public
as $$
  with kmz as (
    select upper(trim(metadata #>> '{sii_point_resolution,record,comuna}')) as commune,
           count(*)::bigint as kmz_count
    from public.kmz_collection
    where nullif(trim(metadata #>> '{sii_point_resolution,record,comuna}'),'') is not null
    group by 1
  ), inciti as (
    select upper(trim(commune)) as commune,
           count(*)::bigint as metric_count,
           max(scraped_at) as last_scrape
    from public.market_public_metrics
    where source = 'inciti_data_hub_public'
      and nullif(trim(commune),'') is not null
    group by 1
  )
  select k.commune,
         k.kmz_count,
         coalesce(i.metric_count,0)::bigint,
         (coalesce(i.metric_count,0) > 0),
         i.last_scrape
  from kmz k
  left join inciti i using (commune)
  order by k.kmz_count desc, k.commune;
$$;

revoke all on function public.get_internal_kmz_market_coverage() from public, anon, authenticated;
grant execute on function public.get_internal_kmz_market_coverage() to service_role;

comment on function public.get_internal_kmz_market_coverage() is
  'Internal Sur Realista KMZ inventory coverage by commune against Inciti Data Hub metrics. Server/service-role only.';