create table if not exists public.operator_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_name text not null,
  actor_role text not null default 'operator',
  action text not null,
  entity_type text not null,
  entity_id text,
  request_path text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.operator_audit_log enable row level security;

revoke all on table public.operator_audit_log from anon, authenticated;
grant select, insert on table public.operator_audit_log to service_role;

create index if not exists operator_audit_log_created_at_idx
  on public.operator_audit_log (created_at desc);
create index if not exists operator_audit_log_entity_idx
  on public.operator_audit_log (entity_type, entity_id, created_at desc);
create index if not exists operator_audit_log_actor_idx
  on public.operator_audit_log (actor_id, created_at desc);

comment on table public.operator_audit_log is 'Append-only operator activity ledger for privileged Sur Realista changes.';
