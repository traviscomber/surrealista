create table if not exists public.kmz_reindex_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('dry_run', 'apply')),
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  batch_size integer not null default 50 check (batch_size between 1 and 200),
  concurrency integer not null default 5 check (concurrency between 1 and 20),
  cursor_created_at timestamptz,
  cursor_id uuid,
  total_items integer not null default 0,
  processed_items integer not null default 0,
  replaced_items integer not null default 0,
  unchanged_items integer not null default 0,
  rejected_items integer not null default 0,
  failed_items integer not null default 0,
  geometry_before integer not null default 0,
  geometry_after integer not null default 0,
  points_after integer not null default 0,
  lines_after integer not null default 0,
  polygons_after integer not null default 0,
  options jsonb not null default '{}'::jsonb,
  error_summary jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.kmz_reindex_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.kmz_reindex_runs(id) on delete cascade,
  kmz_id uuid not null references public.kmz_collection(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'unchanged', 'replace', 'rejected', 'failed', 'rolled_back')),
  proposal_hash text,
  source_kind text not null default 'database',
  snapshot jsonb,
  proposal jsonb,
  geometry_before integer not null default 0,
  geometry_after integer not null default 0,
  points_after integer not null default 0,
  lines_after integer not null default 0,
  polygons_after integer not null default 0,
  validation_errors jsonb not null default '[]'::jsonb,
  error_message text,
  attempts integer not null default 0,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, kmz_id)
);

create index if not exists idx_kmz_reindex_runs_status on public.kmz_reindex_runs(status, created_at desc);
create index if not exists idx_kmz_reindex_items_run_status on public.kmz_reindex_items(run_id, status);
create index if not exists idx_kmz_reindex_items_kmz on public.kmz_reindex_items(kmz_id, created_at desc);
create index if not exists idx_kmz_reindex_items_hash on public.kmz_reindex_items(proposal_hash);

alter table public.kmz_reindex_runs enable row level security;
alter table public.kmz_reindex_items enable row level security;

create or replace function public.apply_kmz_reindex_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.kmz_reindex_items%rowtype;
  v_kmz public.kmz_collection%rowtype;
  v_placemark jsonb;
  v_count integer := 0;
begin
  select * into v_item from public.kmz_reindex_items where id = p_item_id for update;
  if not found then raise exception 'Reindex item not found'; end if;
  if v_item.status not in ('replace', 'unchanged') then raise exception 'Item is not approved for apply: %', v_item.status; end if;
  if v_item.proposal is null then raise exception 'Item has no proposal'; end if;

  select * into v_kmz from public.kmz_collection where id = v_item.kmz_id for update;
  if not found then raise exception 'KMZ not found'; end if;

  if v_item.snapshot is null then
    update public.kmz_reindex_items
    set snapshot = jsonb_build_object(
      'collection', to_jsonb(v_kmz),
      'placemarks', coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at, p.id) from public.kmz_placemarks p where p.kmz_id = v_item.kmz_id), '[]'::jsonb)
    )
    where id = p_item_id;
  end if;

  delete from public.kmz_placemarks where kmz_id = v_item.kmz_id;

  for v_placemark in select value from jsonb_array_elements(coalesce(v_item.proposal->'placemarks', '[]'::jsonb))
  loop
    insert into public.kmz_placemarks (
      kmz_id, name, description, coordinates, type, style_url, properties,
      center_lat, center_lng, region, bounds, updated_at
    ) values (
      v_item.kmz_id,
      coalesce(v_placemark->>'name', 'Capa recuperada'),
      nullif(v_placemark->>'description', ''),
      v_placemark->'coordinates',
      v_placemark->>'type',
      nullif(v_placemark->>'styleUrl', ''),
      coalesce(v_placemark->'properties', '{}'::jsonb),
      nullif(v_placemark#>>'{center,lat}', '')::numeric,
      nullif(v_placemark#>>'{center,lng}', '')::numeric,
      nullif(v_placemark->>'region', ''),
      v_placemark->'bounds',
      now()
    );
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then raise exception 'Refusing to apply empty geometry proposal'; end if;

  update public.kmz_collection
  set coordinates = v_item.proposal->'coordinates',
      bounds = v_item.proposal->'bounds',
      placemarks_count = v_count,
      region = coalesce(nullif(v_item.proposal->>'region', ''), region),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'reindex', jsonb_build_object('runId', v_item.run_id, 'itemId', v_item.id, 'hash', v_item.proposal_hash, 'appliedAt', now())
      ),
      updated_at = now()
  where id = v_item.kmz_id;

  update public.kmz_reindex_items set applied_at = now(), updated_at = now() where id = p_item_id;
  return jsonb_build_object('kmzId', v_item.kmz_id, 'placemarks', v_count);
end;
$$;

create or replace function public.rollback_kmz_reindex_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.kmz_reindex_items%rowtype;
  v_collection jsonb;
  v_placemark jsonb;
begin
  select * into v_item from public.kmz_reindex_items where id = p_item_id for update;
  if not found or v_item.snapshot is null then raise exception 'Snapshot not found'; end if;
  v_collection := v_item.snapshot->'collection';

  delete from public.kmz_placemarks where kmz_id = v_item.kmz_id;
  for v_placemark in select value from jsonb_array_elements(coalesce(v_item.snapshot->'placemarks', '[]'::jsonb))
  loop
    insert into public.kmz_placemarks (id, kmz_id, name, description, coordinates, type, style_url, properties, center_lat, center_lng, region, bounds, created_at, updated_at)
    values ((v_placemark->>'id')::uuid, v_item.kmz_id, v_placemark->>'name', v_placemark->>'description', v_placemark->'coordinates', v_placemark->>'type', v_placemark->>'style_url', v_placemark->'properties', nullif(v_placemark->>'center_lat','')::numeric, nullif(v_placemark->>'center_lng','')::numeric, v_placemark->>'region', v_placemark->'bounds', coalesce((v_placemark->>'created_at')::timestamptz, now()), now());
  end loop;

  update public.kmz_collection set
    coordinates = v_collection->'coordinates', bounds = v_collection->'bounds',
    placemarks_count = coalesce((v_collection->>'placemarks_count')::integer, 0),
    region = v_collection->>'region', metadata = v_collection->'metadata', updated_at = now()
  where id = v_item.kmz_id;

  update public.kmz_reindex_items set status = 'rolled_back', updated_at = now() where id = p_item_id;
  return jsonb_build_object('kmzId', v_item.kmz_id, 'rolledBack', true);
end;
$$;

revoke all on function public.apply_kmz_reindex_item(uuid) from public, anon, authenticated;
revoke all on function public.rollback_kmz_reindex_item(uuid) from public, anon, authenticated;
