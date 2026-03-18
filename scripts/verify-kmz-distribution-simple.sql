-- Verify actual KMZ region distribution in the database
-- This query shows how many KMZ files are assigned to each region

SELECT 
  region,
  COUNT(*) as file_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true), 2) as percentage
FROM kmz_collection
WHERE is_active = true
GROUP BY region
ORDER BY file_count DESC;
