alter table public.prospecting_mandates
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists prospecting_mandates_client_idx
  on public.prospecting_mandates(client_id)
  where client_id is not null;

comment on column public.prospecting_mandates.client_id is
  'Optional buyer/investor client whose commercial search intent this mandate represents.';
