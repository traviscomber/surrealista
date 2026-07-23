-- Conservative second-pass audit for owner candidates inferred from KMZ filenames.
-- Read-only by design. It does not update kmz_collection.
--
-- Scoring policy:
--   0.93: explicit legal entity suffix or clear named entity in filename
--   0.88: strong organization marker such as Agricola, Inmobiliaria, Forestal,
--         Fruticola or Sociedad Agricola
--   below 0.88: review manually; do not persist automatically
--
-- Stored production metadata must remain explicitly unverified:
--   owner_name_candidate
--   owner_candidate_type
--   owner_candidate_score
--   owner_candidate_source = filename_second_pass
--   owner_candidate_status = unverified
--
-- Never overwrite documentary evidence or present filename inference as current
-- legal ownership.

with source as (
  select
    id,
    file_name,
    metadata,
    trim(
      regexp_replace(
        regexp_replace(file_name, '\\.kmz$', '', 'i'),
        '\\([0-9]+\\)$',
        '',
        'g'
      )
    ) as normalized_name
  from public.kmz_collection
  where is_active = true
), scored as (
  select
    id,
    file_name,
    normalized_name,
    case
      when normalized_name ~* '\\m(spa|ltda|limitada|sociedad anonima|s\\.?a\\.?)\\M'
        then 'company'
      when normalized_name ~* '\\m(agricola|inmobiliaria|forestal|fruticola|sociedad agricola)\\M'
        then 'company'
      else null
    end as candidate_type,
    case
      when normalized_name ~* '\\m(spa|ltda|limitada|sociedad anonima|s\\.?a\\.?)\\M'
        then 0.93
      when normalized_name ~* '\\m(agricola|inmobiliaria|forestal|fruticola|sociedad agricola)\\M'
        then 0.88
      else null
    end as candidate_score,
    metadata->>'owner_name_candidate' as existing_candidate,
    metadata->>'owner_candidate_status' as existing_status
  from source
)
select
  id,
  file_name,
  normalized_name,
  candidate_type,
  candidate_score,
  existing_candidate,
  existing_status
from scored
where candidate_score >= 0.88
order by candidate_score desc, normalized_name;
