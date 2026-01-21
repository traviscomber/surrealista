-- Delete duplicate KMZ files, keeping only the oldest version of each normalized name
-- This script removes files with name variants like (1), _1, etc.

WITH normalized_names AS (
  -- Normalize file names by removing variants like (1), _1, etc.
  SELECT 
    id,
    file_name,
    created_at,
    REGEXP_REPLACE(file_name, '\s*\(\d+\)\.kmz$', '.kmz') as normalized_name
  FROM kmz_collection
),
duplicates_to_remove AS (
  -- Find all duplicates except the oldest one for each normalized name
  SELECT 
    nn.id,
    nn.file_name,
    nn.normalized_name,
    ROW_NUMBER() OVER (PARTITION BY nn.normalized_name ORDER BY nn.created_at ASC) as rn
  FROM normalized_names nn
  WHERE EXISTS (
    SELECT 1 FROM normalized_names nn2
    WHERE nn.normalized_name = nn2.normalized_name
    GROUP BY nn2.normalized_name
    HAVING COUNT(*) > 1
  )
)
DELETE FROM kmz_collection
WHERE id IN (
  SELECT id FROM duplicates_to_remove
  WHERE rn > 1  -- Keep only rn=1 (oldest), delete all others
);

-- Verify results
SELECT 
  COUNT(*) as total_kmz_files,
  COUNT(DISTINCT REGEXP_REPLACE(file_name, '\s*\(\d+\)\.kmz$', '.kmz')) as unique_files
FROM kmz_collection;

COMMIT;
