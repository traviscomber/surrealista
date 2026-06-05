-- Query to verify actual KMZ region distribution in database
SELECT 
  region,
  COUNT(*) as kmz_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true), 2) as percentage,
  MIN(id) as sample_id,
  STRING_AGG(DISTINCT file_name, ', ' ORDER BY file_name LIMIT 3) as sample_files
FROM kmz_collection
WHERE is_active = true
GROUP BY region
ORDER BY kmz_count DESC;

-- Also check for any NULL regions
SELECT 
  COUNT(*) as null_region_count
FROM kmz_collection
WHERE is_active = true AND region IS NULL;
