-- Verify all Chilean regions and identify boundary overlaps
-- Show sample KMZ files from each region to verify correct assignment
-- Identify Metropolitana/Valparaíso overlap issue

BEGIN;

-- Show current region distribution with sample files
SELECT 
  region,
  COUNT(*) as total_files,
  MIN((bounds->>'center_lat')::numeric) as min_lat,
  MAX((bounds->>'center_lat')::numeric) as max_lat,
  AVG((bounds->>'center_lat')::numeric) as avg_lat
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL
GROUP BY region
ORDER BY AVG((bounds->>'center_lat')::numeric) DESC;

-- Show KMZ files in Metropolitana that might be Valparaíso (names with "Valparaiso")
SELECT 
  file_name,
  region,
  bounds->>'center_lat' as center_lat,
  bounds->>'north' as north_lat,
  bounds->>'south' as south_lat
FROM kmz_collection
WHERE is_active = true AND region = 'Metropolitana'
AND (file_name ILIKE '%valparaiso%' OR file_name ILIKE '%valpo%' OR file_name ILIKE '%quinta region%')
ORDER BY (bounds->>'center_lat')::numeric DESC;

-- Show files on Metropolitana/Valparaíso boundary (latitude -34 to -32.5)
SELECT 
  file_name,
  region,
  (bounds->>'center_lat')::numeric as center_lat
FROM kmz_collection
WHERE is_active = true
AND (bounds->>'center_lat')::numeric >= -34.5 
AND (bounds->>'center_lat')::numeric <= -32
ORDER BY (bounds->>'center_lat')::numeric DESC;

-- Count unassigned files still
SELECT 
  COUNT(*) as unassigned_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true)::numeric, 2) as percentage
FROM kmz_collection
WHERE is_active = true AND (region IS NULL OR region = '');

COMMIT;
