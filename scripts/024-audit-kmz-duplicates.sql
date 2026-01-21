-- Audit script to identify duplicate KMZ files by name
-- This will show all files with their counts

SELECT 
  file_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT file_path) as unique_paths,
  array_agg(DISTINCT id ORDER BY id) as ids,
  array_agg(DISTINCT created_at ORDER BY created_at) as creation_dates
FROM kmz_collection
GROUP BY file_name
HAVING COUNT(*) > 1
ORDER BY total_count DESC;

-- Show exact duplicates (same name AND same path)
SELECT 
  file_name,
  file_path,
  COUNT(*) as count,
  array_agg(id) as ids
FROM kmz_collection
GROUP BY file_name, file_path
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- List all files to see the current state
SELECT 
  file_name,
  COUNT(*) as count
FROM kmz_collection
GROUP BY file_name
ORDER BY file_name;
