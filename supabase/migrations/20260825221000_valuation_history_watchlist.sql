create table if not exists public.valuation_history (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid null,
  query_text text,
  resolved_address text,
  commune text,
  region text,
  lat double precision,
  lng double precision,
  area_m2 numeric,
  estimated_price bigint,
  range_min bigint,
  range_max bigint,
  confidence numeric,
  sample_count integer,
  model_used text,
  response_contract text,
  recommendation_verdict text,
  market_refresh_recommended boolean not null default false,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.valuation_watchlist (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  address text not null,
  commune text,
  region text,
  lat double precision,
  lng double precision,
  area_m2 numeric,
  baseline_price bigint,
  last_price bigint,
  last_confidence numeric,
  last_checked_at timestamptz,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.valuation_history add constraint valuation_history_watchlist_id_fkey foreign key (watchlist_id) references public.valuation_watchlist(id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists valuation_history_created_at_idx on public.valuation_history(created_at desc);
create index if not exists valuation_history_location_idx on public.valuation_history(commune, region);
create index if not exists valuation_watchlist_active_idx on public.valuation_watchlist(active, updated_at desc);
alter table public.valuation_history enable row level security;
alter table public.valuation_watchlist enable row level security;
comment on table public.valuation_history is 'Append-only internal Sur Realista valuation snapshots for trend and audit.';
comment on table public.valuation_watchlist is 'Internal Sur Realista land watchlist for repeated valuation and market monitoring.';