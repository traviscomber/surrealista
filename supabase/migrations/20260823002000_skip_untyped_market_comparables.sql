create or replace function public.recompute_market_comparables(
  p_region text default null::text,
  p_operation text default 'venta'::text
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer := 0;
begin
  insert into public.market_comparable_data
    (region, commune, property_type, operation, period_date,
     sample_count, avg_price_clp, median_price_clp, p25_price_clp, p75_price_clp,
     avg_price_m2_clp, median_price_m2_clp, avg_area_m2, avg_days_active, sources, computed_at)
  select
    pe.region,
    coalesce(pe.commune, '') as commune,
    pe.property_type,
    pe.operation,
    current_date as period_date,
    count(*) as sample_count,
    round(avg(pe.price_clp))::bigint,
    percentile_cont(0.5) within group (order by pe.price_clp)::bigint,
    percentile_cont(0.25) within group (order by pe.price_clp)::bigint,
    percentile_cont(0.75) within group (order by pe.price_clp)::bigint,
    round(avg(pe.price_per_m2_clp))::bigint,
    percentile_cont(0.5) within group (order by pe.price_per_m2_clp)::bigint,
    round(avg(pe.area_m2), 2),
    round(avg(pe.days_active), 2),
    array_agg(distinct pe.source),
    now()
  from public.properties_external pe
  where pe.is_active = true
    and pe.price_clp > 0
    and pe.area_m2 > 0
    and pe.operation = p_operation
    and nullif(trim(pe.property_type), '') is not null
    and (p_region is null or pe.region = p_region)
    and pe.scraped_at > now() - interval '90 days'
  group by pe.region, coalesce(pe.commune,''), pe.property_type, pe.operation
  on conflict (region, commune, property_type, operation, period_date)
  do update set
    sample_count     = excluded.sample_count,
    avg_price_clp    = excluded.avg_price_clp,
    median_price_clp = excluded.median_price_clp,
    p25_price_clp    = excluded.p25_price_clp,
    p75_price_clp    = excluded.p75_price_clp,
    avg_price_m2_clp = excluded.avg_price_m2_clp,
    median_price_m2_clp = excluded.median_price_m2_clp,
    avg_area_m2      = excluded.avg_area_m2,
    avg_days_active  = excluded.avg_days_active,
    sources          = excluded.sources,
    computed_at      = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;
