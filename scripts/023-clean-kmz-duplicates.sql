-- Clean up duplicate KMZ files in the collection
-- Keeps only the oldest (first uploaded) version of each duplicate
-- Duplicates are identified by matching file_name

WITH duplicates AS (
  SELECT 
    id,
    file_name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY file_name ORDER BY created_at ASC) as rn
  FROM kmz_collection
  WHERE file_name IS NOT NULL
)
DELETE FROM kmz_collection
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Report results
SELECT COUNT(*) as remaining_files FROM kmz_collection;
