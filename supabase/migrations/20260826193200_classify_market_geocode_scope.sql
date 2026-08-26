create or replace function public.classify_market_geocode_scope()
returns trigger
language plpgsql
as $$
begin
  if new.lat is not null and new.lng is not null then
    return new;
  end if;

  if new.source = 'portal_inmobiliario'
     and lower(coalesce(new.title,'')) ~ '(edificio|departamento|torre|oficina|local comercial|casa)'
     and not (lower(coalesce(new.title,'')) ~ '(terreno|parcela|sitio|lote|fundo|campo|predio)') then
    new.geocode_status := 'skipped_non_land';
    new.geocode_attempted_at := coalesce(new.geocode_attempted_at, now());
    new.geocode_next_retry_at := now() + interval '90 days';
    new.geocode_last_error := null;
    new.geocode_precision := null;
    return new;
  end if;

  if lower(coalesce(new.property_type,'')) ~ '^(departamento|oficina|local comercial|bodega)$' then
    new.geocode_status := 'skipped_non_land';
    new.geocode_attempted_at := coalesce(new.geocode_attempted_at, now());
    new.geocode_next_retry_at := now() + interval '90 days';
    new.geocode_last_error := null;
    new.geocode_precision := null;
    return new;
  end if;

  if old.geocode_status = 'skipped_non_land' and new.geocode_status = 'skipped_non_land' then
    if (lower(coalesce(new.title,'')) ~ '(terreno|parcela|sitio|lote|fundo|campo|predio)')
       or (lower(coalesce(new.property_type,'')) ~ '(terreno|parcela|sitio|lote|fundo|campo|predio|rural|agr[ií]cola)') then
      new.geocode_status := null;
      new.geocode_attempted_at := null;
      new.geocode_next_retry_at := null;
      new.geocode_last_error := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_classify_market_geocode_scope on public.properties_external;
create trigger trg_classify_market_geocode_scope
before insert or update of source,title,property_type,lat,lng on public.properties_external
for each row execute function public.classify_market_geocode_scope();
