create table if not exists public.internal_access_attempts (
  identifier_hash text primary key,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint internal_access_attempts_identifier_hash_check check (identifier_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists internal_access_attempts_updated_at_idx
  on public.internal_access_attempts (updated_at);

alter table public.internal_access_attempts enable row level security;
revoke all on table public.internal_access_attempts from anon, authenticated;
grant select, insert, update, delete on table public.internal_access_attempts to service_role;

create or replace function public.check_internal_access_rate_limit(p_identifier_hash text)
returns table(locked boolean, retry_after_seconds integer, failed_attempts integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.internal_access_attempts%rowtype;
  v_now timestamptz := now();
begin
  if p_identifier_hash is null or p_identifier_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid identifier hash';
  end if;

  delete from public.internal_access_attempts
  where updated_at < v_now - interval '24 hours';

  select * into v_row
  from public.internal_access_attempts
  where identifier_hash = p_identifier_hash
  for update;

  if not found then
    return query select false, 0, 0;
    return;
  end if;

  if v_row.locked_until is not null and v_row.locked_until > v_now then
    return query
      select true,
             greatest(1, ceil(extract(epoch from (v_row.locked_until - v_now)))::integer),
             v_row.failed_attempts;
    return;
  end if;

  if v_row.locked_until is not null and v_row.locked_until <= v_now then
    update public.internal_access_attempts
    set failed_attempts = 0,
        locked_until = null,
        updated_at = v_now
    where identifier_hash = p_identifier_hash;
    return query select false, 0, 0;
    return;
  end if;

  return query select false, 0, v_row.failed_attempts;
end;
$$;

create or replace function public.record_internal_access_attempt(
  p_identifier_hash text,
  p_success boolean
)
returns table(locked boolean, retry_after_seconds integer, failed_attempts integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.internal_access_attempts%rowtype;
  v_now timestamptz := now();
  v_attempts integer;
  v_locked_until timestamptz;
begin
  if p_identifier_hash is null or p_identifier_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid identifier hash';
  end if;

  if p_success then
    delete from public.internal_access_attempts
    where identifier_hash = p_identifier_hash;
    return query select false, 0, 0;
    return;
  end if;

  select * into v_row
  from public.internal_access_attempts
  where identifier_hash = p_identifier_hash
  for update;

  if not found then
    v_attempts := 1;
    v_locked_until := null;
    insert into public.internal_access_attempts(identifier_hash, failed_attempts, locked_until, updated_at)
    values (p_identifier_hash, v_attempts, v_locked_until, v_now);
  elsif v_row.locked_until is not null and v_row.locked_until > v_now then
    v_attempts := v_row.failed_attempts;
    v_locked_until := v_row.locked_until;
  else
    v_attempts := case
      when v_row.locked_until is not null and v_row.locked_until <= v_now then 1
      else v_row.failed_attempts + 1
    end;
    v_locked_until := case
      when v_attempts >= 5 then v_now + interval '15 minutes'
      else null
    end;

    update public.internal_access_attempts
    set failed_attempts = v_attempts,
        locked_until = v_locked_until,
        updated_at = v_now
    where identifier_hash = p_identifier_hash;
  end if;

  return query
    select (v_locked_until is not null and v_locked_until > v_now),
           case
             when v_locked_until is not null and v_locked_until > v_now
             then greatest(1, ceil(extract(epoch from (v_locked_until - v_now)))::integer)
             else 0
           end,
           v_attempts;
end;
$$;

revoke all on function public.check_internal_access_rate_limit(text) from public, anon, authenticated;
revoke all on function public.record_internal_access_attempt(text, boolean) from public, anon, authenticated;
grant execute on function public.check_internal_access_rate_limit(text) to service_role;
grant execute on function public.record_internal_access_attempt(text, boolean) to service_role;
