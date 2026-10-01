-- Prospecting candidate identities are external canonical IDs (for example
-- ciren:2024:507-45), not UUIDs. The route already compares and stores them
-- as strings, so align the database contract with the application contract.

alter table public.prospecting_mandates
  alter column last_candidate_ids drop default;

alter table public.prospecting_mandates
  alter column last_candidate_ids type text[]
  using last_candidate_ids::text[];

alter table public.prospecting_mandates
  alter column last_candidate_ids set default '{}'::text[];
