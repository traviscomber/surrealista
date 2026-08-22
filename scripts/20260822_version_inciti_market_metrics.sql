-- Version existing Inciti public metrics and normalize their canonical metric names.
-- Production migration applied on 2026-08-22.

update public.market_public_metrics
set metadata = jsonb_set(metadata, '{parserVersion}', '1'::jsonb, true)
where source = 'inciti_public'
  and not (metadata ? 'parserVersion');

update public.market_public_metrics
set metadata = jsonb_set(
  metadata,
  '{canonicalMetric}',
  to_jsonb(
    case
      when metric in ('comuna_enero_2025', 'comuna_enero_2026') then 'stock_units'
      when metric = 'variacion_anual' then 'annual_change_pct'
      when metric in ('superficie_promedio_m', 'superficie_prom_m') then 'avg_surface_m2'
      when metric in ('unidades', 'unidades_disponibles') then 'available_units'
      when metric = 'precio_del_m_uf' then 'price_uf_m2'
      when metric in ('hogares_arrendatarios', 'n_hogares_que_alquilan') then 'renter_households'
      when metric = 'gasto_comun_promedio' then 'avg_common_expense_clp'
      when metric = 'alza_en_contactos' then 'contact_growth_pct'
      else metric
    end
  ),
  true
)
where source = 'inciti_public'
  and coalesce(metadata->>'parserVersion', '1') = '1';

create or replace function public.market_public_metrics_set_v2_metadata()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.source = 'inciti_public' then
    if not (new.metadata ? 'parserVersion') then
      new.metadata := jsonb_set(new.metadata, '{parserVersion}', '2'::jsonb, true);
    end if;
    if not (new.metadata ? 'canonicalMetric') then
      new.metadata := jsonb_set(new.metadata, '{canonicalMetric}', to_jsonb(new.metric), true);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists market_public_metrics_set_v2_metadata on public.market_public_metrics;
create trigger market_public_metrics_set_v2_metadata
before insert on public.market_public_metrics
for each row
execute function public.market_public_metrics_set_v2_metadata();
