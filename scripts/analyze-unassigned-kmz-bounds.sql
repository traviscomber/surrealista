-- Check what data we have for the 203 unassigned KMZ files
-- Look at bounds and other geographic info that could help assign regions

SELECT 
  COUNT(*) as total_unassigned,
  COUNT(CASE WHEN bounds IS NOT NULL THEN 1 END) as with_bounds,
  COUNT(CASE WHEN file_path IS NOT NULL THEN 1 END) as with_file_path,
  COUNT(CASE WHEN tags IS NOT NULL THEN 1 END) as with_tags
FROM kmz_collection
WHERE region IS NULL;

-- Get sample unassigned KMZ files with their available data
SELECT 
  id,
  file_name,
  bounds,
  tags,
  placemarks_count,
  (bounds->>'south')::NUMERIC as south_lat,
  (bounds->>'north')::NUMERIC as north_lat,
  (bounds->>'west')::NUMERIC as west_lng,
  (bounds->>'east')::NUMERIC as east_lng
FROM kmz_collection
WHERE region IS NULL
LIMIT 20;

-- Check if we can determine region from geographic bounds
-- by comparing with known Chilean region coordinate ranges
SELECT 
  id,
  file_name,
  CASE
    -- Los Lagos: roughly -40.0 to -42.5 latitude, -71 to -75 longitude
    WHEN (bounds->>'south')::NUMERIC < -39 AND (bounds->>'south')::NUMERIC > -44 
      AND (bounds->>'west')::NUMERIC > -76 AND (bounds->>'west')::NUMERIC < -70
    THEN 'Los Lagos (by bounds)'
    -- La Araucanía: roughly -37.6 to -39.5 latitude, -71 to -74 longitude
    WHEN (bounds->>'south')::NUMERIC < -37 AND (bounds->>'south')::NUMERIC > -40
      AND (bounds->>'west')::NUMERIC > -75 AND (bounds->>'west')::NUMERIC < -70
    THEN 'La Araucanía (by bounds)'
    -- Aysén: roughly -42.5 to -46.5 latitude, -71 to -76 longitude
    WHEN (bounds->>'south')::NUMERIC < -42 AND (bounds->>'south')::NUMERIC > -47
      AND (bounds->>'west')::NUMERIC > -77 AND (bounds->>'west')::NUMERIC < -71
    THEN 'Aysén (by bounds)'
    -- Magallanes: roughly -50 to -56 latitude, -68 to -75 longitude
    WHEN (bounds->>'south')::NUMERIC < -49 AND (bounds->>'south')::NUMERIC > -57
      AND (bounds->>'west')::NUMERIC > -76 AND (bounds->>'west')::NUMERIC < -67
    THEN 'Magallanes (by bounds)'
    ELSE 'Region uncertain'
  END as potential_region,
  bounds
FROM kmz_collection
WHERE region IS NULL AND bounds IS NOT NULL
LIMIT 50;
