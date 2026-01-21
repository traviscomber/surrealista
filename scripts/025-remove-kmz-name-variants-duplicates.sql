-- Remove KMZ duplicates by identifying files with similar names (ignoring (1), _1, etc.)
-- This query shows which files are likely duplicates
SELECT 
  REGEXP_REPLACE(file_name, ' \(1\)| _1$', '') as normalized_name,
  COUNT(*) as count,
  ARRAY_AGG(file_name ORDER BY created_at) as all_versions,
  ARRAY_AGG(id ORDER BY created_at) as ids
FROM kmz_collection
GROUP BY normalized_name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Now delete the duplicates, keeping only the oldest version of each
DELETE FROM kmz_collection
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY REGEXP_REPLACE(file_name, ' \(1\)| _1$', '')
        ORDER BY created_at ASC
      ) as rn
    FROM kmz_collection
  ) t
  WHERE rn > 1
);

-- Verify the cleanup
SELECT 
  COUNT(*) as remaining_files,
  COUNT(DISTINCT REGEXP_REPLACE(file_name, ' \(1\)| _1$', '')) as unique_files
FROM kmz_collection;
