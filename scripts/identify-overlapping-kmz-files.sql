-- Find KMZ files on region boundaries that might be misassigned
-- This identifies overlapping files like Valparaíso KMZ in Metropolitana

SELECT 
  'Files on/near Metropolitana-Valparaíso boundary' as check_type,
  id,
  file_name,
  region,
  bounds->>'north' as north_lat,
  bounds->>'south' as south_lat,
  ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 as center_lat
FROM kmz_collection
WHERE is_active = true 
  AND bounds IS NOT NULL
  AND region IN ('Metropolitana', 'Valparaíso')
  AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 BETWEEN -34 AND -32.5
ORDER BY center_lat DESC
LIMIT 50;

-- Show actual latitude distribution to identify overlaps
SELECT 
  'Latitude distribution' as check_type,
  region,
  COUNT(*) as count,
  MIN(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2) as min_center_lat,
  MAX(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2) as max_center_lat,
  AVG(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2)::numeric(10,2) as avg_center_lat
FROM kmz_collection
WHERE is_active = true AND bounds IS NOT NULL
GROUP BY region
ORDER BY max_center_lat DESC;
