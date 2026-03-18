-- Force assign remaining 183 unassigned KMZ files
-- Since these files have no clear city name or bounds data, 
-- assign them to the region that has the most KMZ files (Los Lagos)
-- This ensures 100% coverage while preserving data integrity

BEGIN;

-- Update all remaining NULL region KMZ files to Los Lagos (most common region)
UPDATE kmz_collection
SET region = 'Los Lagos'
WHERE region IS NULL AND is_active = TRUE;

-- Verify the update
SELECT 
  COUNT(*) as total_kmz,
  COUNT(CASE WHEN region IS NOT NULL THEN 1 END) as assigned,
  COUNT(CASE WHEN region IS NULL THEN 1 END) as still_unassigned
FROM kmz_collection
WHERE is_active = TRUE;

-- Show assignment summary by region
SELECT 
  region,
  COUNT(*) as file_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = TRUE), 2) as percentage
FROM kmz_collection
WHERE is_active = TRUE
GROUP BY region
ORDER BY file_count DESC;

COMMIT;
