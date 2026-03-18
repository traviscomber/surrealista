-- Check current region distribution and identify problems
SELECT 
  region,
  COUNT(*) as count,
  MIN((bounds->>'south')::numeric) as min_south,
  MAX((bounds->>'north')::numeric) as max_north,
  ROUND(AVG(((((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2)))::numeric, 2) as avg_center_lat
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL AND region != ''
GROUP BY region
ORDER BY avg_center_lat DESC;

-- Find Valdivia specifically
SELECT 
  id,
  file_name,
  region,
  (bounds->>'south')::numeric as south,
  (bounds->>'north')::numeric as north,
  ROUND(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2, 2) as center_lat
FROM kmz_collection
WHERE file_name LIKE '%valdivia%' OR file_name LIKE '%Valdivia%' OR file_name LIKE '%VALDIVIA%'
ORDER BY file_name;

-- Show all unique regions currently in database
SELECT DISTINCT region
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL AND region != ''
ORDER BY region;
