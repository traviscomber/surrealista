-- First, identify and list the 42 files that cannot be assigned
SELECT 
  id,
  file_name,
  region,
  placemarks_count,
  bounds,
  created_at
FROM kmz_collection
WHERE region IS NULL OR region = ''
ORDER BY created_at DESC;

-- Count them
SELECT COUNT(*) as unassigned_count
FROM kmz_collection
WHERE region IS NULL OR region = '';

-- Delete the 42 problematic files that cannot be assigned
DELETE FROM kmz_collection
WHERE region IS NULL OR region = '';

-- Verify deletion
SELECT COUNT(*) as total_after_deletion
FROM kmz_collection
WHERE is_active = true;

-- Show final region distribution
SELECT 
  region,
  COUNT(*) as file_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true), 2) as percentage
FROM kmz_collection
WHERE is_active = true AND (region IS NOT NULL AND region != '')
GROUP BY region
ORDER BY file_count DESC;

-- Final summary
SELECT 
  (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true) as total_kmz,
  (SELECT COUNT(DISTINCT region) FROM kmz_collection WHERE is_active = true AND region IS NOT NULL AND region != '') as total_regions,
  (SELECT COUNT(*) FROM kmz_collection WHERE region IS NULL OR region = '') as remaining_unassigned;
