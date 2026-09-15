create table if not exists public.prospecting_owner_research (
  id uuid primary key default gen_random_uuid(),
  rol text not null,
  rol_key text not null,
  commune text not null default '',
  commune_key text not null default '',
  result jsonb not null default '{}'::jsonb,
  decision text not null check (decision in ('contactar','validar_propietario','descartar')),
  researched_at timestamptz not null default now(),
  next_refresh_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rol_key, commune_key)
);

create index if not exists prospecting_owner_research_refresh_idx
  on public.prospecting_owner_research(next_refresh_at);

create index if not exists prospecting_owner_research_decision_idx
  on public.prospecting_owner_research(decision, updated_at desc);

alter table public.prospecting_owner_research enable row level security;

comment on table public.prospecting_owner_research is
  'Server-side cache of evidence-backed owner research by ROL and commune. Operational facts only; never use as governed memory.';
