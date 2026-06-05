-- Check KMZ files without region assignment
SELECT 
  COUNT(*) as total_kmz,
  COUNT(CASE WHEN region IS NULL THEN 1 END) as kmz_without_region,
  COUNT(CASE WHEN region IS NOT NULL THEN 1 END) as kmz_with_region,
  ROUND(100.0 * COUNT(CASE WHEN region IS NULL THEN 1 END) / COUNT(*), 2) as percentage_without_region
FROM kmz_collection
WHERE is_active = true;

-- List KMZ files without region (first 100)
SELECT 
  id,
  file_name,
  created_at,
  placemarks_count,
  region
FROM kmz_collection
WHERE is_active = true AND region IS NULL
ORDER BY created_at DESC
LIMIT 100;

-- Summary by region
SELECT 
  region,
  COUNT(*) as file_count,
  SUM(placemarks_count) as total_placemarks
FROM kmz_collection
WHERE is_active = true
GROUP BY region
ORDER BY file_count DESC;
