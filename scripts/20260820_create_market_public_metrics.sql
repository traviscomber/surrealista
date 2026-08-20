-- Public market intelligence extracted from publicly accessible sources.
-- This migration is intentionally not auto-applied by the scraper.

create table if not exists public.market_public_metrics (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  article_url text not null,
  article_title text,
  published_at date,
  region text,
  commune text,
  dataset text not null,
  metric text not null,
  period date,
  value numeric,
  unit text,
  raw_label text,
  metadata jsonb not null default '{}'::jsonb,
  fingerprint text not null unique,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists market_public_metrics_source_period_idx
  on public.market_public_metrics (source, period desc);

create index if not exists market_public_metrics_commune_metric_idx
  on public.market_public_metrics (commune, metric);

alter table public.market_public_metrics enable row level security;

comment on table public.market_public_metrics is
  'Structured market metrics extracted from publicly accessible market intelligence pages. Writes are server-side via service role.';
