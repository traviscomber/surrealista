-- Extend canonical Inciti metric names while preserving the raw metric field.
-- Production migration applied on 2026-08-22.

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
      when metric in ('n_dormitorios', 'n_de_dormitorios') then 'bedroom_count'
      when metric = 'jefas_de_hogar_mujeres' then 'female_headed_households_pct'
      when metric = 'jefes_de_hogar_hombres' then 'male_headed_households_pct'
      when metric = 'gasto_comun_promedio' then 'avg_common_expense_clp'
      when metric = 'alza_en_contactos' then 'contact_growth_pct'
      when metric = 'solicitudes' then 'applications_count'
      else coalesce(metadata->>'canonicalMetric', metric)
    end
  ),
  true
)
where source = 'inciti_public';

create or replace function public.market_public_metrics_set_v2_metadata()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  canonical_metric text;
begin
  if new.source = 'inciti_public' then
    if not (new.metadata ? 'parserVersion') then
      new.metadata := jsonb_set(new.metadata, '{parserVersion}', '2'::jsonb, true);
    end if;

    canonical_metric := case
      when new.metric in ('comuna_enero_2025', 'comuna_enero_2026') then 'stock_units'
      when new.metric = 'variacion_anual' then 'annual_change_pct'
      when new.metric in ('superficie_promedio_m', 'superficie_prom_m') then 'avg_surface_m2'
      when new.metric in ('unidades', 'unidades_disponibles') then 'available_units'
      when new.metric = 'precio_del_m_uf' then 'price_uf_m2'
      when new.metric in ('hogares_arrendatarios', 'n_hogares_que_alquilan') then 'renter_households'
      when new.metric in ('n_dormitorios', 'n_de_dormitorios') then 'bedroom_count'
      when new.metric = 'jefas_de_hogar_mujeres' then 'female_headed_households_pct'
      when new.metric = 'jefes_de_hogar_hombres' then 'male_headed_households_pct'
      when new.metric = 'gasto_comun_promedio' then 'avg_common_expense_clp'
      when new.metric = 'alza_en_contactos' then 'contact_growth_pct'
      when new.metric = 'solicitudes' then 'applications_count'
      else new.metric
    end;

    new.metadata := jsonb_set(new.metadata, '{canonicalMetric}', to_jsonb(canonical_metric), true);
  end if;
  return new;
end;
$$;
