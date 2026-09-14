create table if not exists public.competitor_listings (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_key text not null,
  title text not null,
  commune text,
  region text,
  crop text,
  operation text,
  area_ha numeric,
  planted_ha numeric,
  water_lps numeric,
  water_raw text,
  price_amount numeric,
  price_currency text,
  price_unit text,
  source_url text not null,
  raw_text text,
  fingerprint text not null,
  is_active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source, external_key)
);

create index if not exists competitor_listings_source_active_idx on public.competitor_listings(source, is_active);
create index if not exists competitor_listings_location_idx on public.competitor_listings(region, commune);
create index if not exists competitor_listings_crop_idx on public.competitor_listings(crop);

create table if not exists public.competitor_listing_snapshots (
  id uuid primary key default gen_random_uuid(),
  competitor_listing_id uuid not null references public.competitor_listings(id) on delete cascade,
  fingerprint text not null,
  snapshot jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  unique(competitor_listing_id, fingerprint)
);

create index if not exists competitor_listing_snapshots_listing_idx on public.competitor_listing_snapshots(competitor_listing_id, observed_at desc);

create table if not exists public.competitor_demand_signals (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  fingerprint text not null unique,
  min_ha numeric,
  max_ha numeric,
  crop text,
  region text,
  commune text,
  transaction_type text,
  production_status text,
  raw_requirement text not null,
  raw_detail text not null,
  source_url text not null,
  is_active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists competitor_demand_source_active_idx on public.competitor_demand_signals(source, is_active);
create index if not exists competitor_demand_crop_idx on public.competitor_demand_signals(crop);
create index if not exists competitor_demand_location_idx on public.competitor_demand_signals(region, commune);

comment on table public.competitor_listings is 'Public competitor agricultural listings observed by Sur Realista. Facts only; historical changes live in snapshots.';
comment on table public.competitor_demand_signals is 'Public buyer-demand requirements published by agricultural brokers and competitors.';

alter table public.competitor_listings enable row level security;
alter table public.competitor_listing_snapshots enable row level security;
alter table public.competitor_demand_signals enable row level security;

-- Internal server routes use the service role. Intentionally no public RLS policies.
