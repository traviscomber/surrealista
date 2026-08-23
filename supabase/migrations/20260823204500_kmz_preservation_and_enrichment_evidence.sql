create table if not exists public.kmz_collection_snapshots (
  id uuid primary key default gen_random_uuid(),
  kmz_id uuid not null references public.kmz_collection(id) on delete restrict,
  snapshot_kind text not null default 'manual',
  row_data jsonb not null,
  captured_at timestamptz not null default now(),
  captured_by text null,
  note text null
);

create index if not exists kmz_collection_snapshots_kmz_id_idx
  on public.kmz_collection_snapshots(kmz_id, captured_at desc);

create unique index if not exists kmz_collection_snapshots_baseline_once_idx
  on public.kmz_collection_snapshots(kmz_id, snapshot_kind)
  where snapshot_kind = 'pre_enrichment_baseline_20260823';

create table if not exists public.kmz_enrichment_evidence (
  id uuid primary key default gen_random_uuid(),
  kmz_id uuid not null references public.kmz_collection(id) on delete restrict,
  source text not null,
  source_kind text not null default 'external',
  field_name text not null,
  value_json jsonb not null,
  confidence numeric(5,4) null check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status text not null default 'observed',
  source_ref text null,
  dataset_date date null,
  observed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  constraint kmz_enrichment_evidence_fingerprint_key unique (fingerprint)
);

create index if not exists kmz_enrichment_evidence_kmz_idx
  on public.kmz_enrichment_evidence(kmz_id, field_name, observed_at desc);

create index if not exists kmz_enrichment_evidence_source_idx
  on public.kmz_enrichment_evidence(source, observed_at desc);

comment on table public.kmz_collection_snapshots is
  'Immutable-style point-in-time copies of kmz_collection rows for preservation and rollback. No production enrichment should overwrite these snapshots.';

comment on table public.kmz_enrichment_evidence is
  'Append-only evidence from SII, CIREN historical, CBR, Drive, INCITI and future sources. Evidence does not overwrite kmz_collection automatically.';
