create table if not exists public.prospecting_cases (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid references public.prospecting_mandates(id) on delete cascade,
  external_case_id text not null,
  case_kind text not null check (case_kind in ('market','off_market')),
  status text not null check (status in ('ready_to_contact','owner_identified','verify_owner','review_market','dismissed')),
  score integer not null default 0 check (score between 0 and 100),
  title text not null,
  location text,
  rol text,
  area_ha numeric,
  species_evidence jsonb not null default '{}'::jsonb,
  owner_evidence jsonb,
  contact_evidence jsonb,
  market_evidence jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  next_action text,
  source_fingerprint text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_revalidated_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mandate_id, external_case_id)
);

create index if not exists prospecting_cases_mandate_status_idx
  on public.prospecting_cases(mandate_id, status, score desc);

create index if not exists prospecting_cases_rol_idx
  on public.prospecting_cases(rol)
  where rol is not null;

create table if not exists public.prospecting_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.prospecting_cases(id) on delete cascade,
  mandate_id uuid references public.prospecting_mandates(id) on delete cascade,
  event_type text not null check (event_type in ('detected','revalidated','status_changed','owner_resolved','contact_resolved','dismissed')),
  previous_status text,
  current_status text,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists prospecting_case_events_case_idx
  on public.prospecting_case_events(case_id, created_at desc);

create table if not exists public.prospecting_memory (
  id uuid primary key default gen_random_uuid(),
  operator_id text not null default 'internal-operator',
  scope text not null default 'prospecting',
  memory_type text not null check (memory_type in ('preference','responsibility','terminology','stable_context')),
  memory_text text not null,
  confidence numeric not null default 0.8 check (confidence between 0 and 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospecting_memory_active_idx
  on public.prospecting_memory(operator_id, scope, active, updated_at desc);

comment on table public.prospecting_memory is
  'Non-canonical governed memory for stable user context only. Never store operational facts, case status, ownership, prices, or live market evidence here.';
