-- Comprehensive fix for all 16 Chilean regions with corrected latitude boundaries
-- NO overlaps - each region has a unique, non-overlapping latitude range
-- Based on actual geographic boundaries of Chilean administrative regions

BEGIN;

-- Clear and reassign all regions with correct latitude ranges (North to South)
UPDATE kmz_collection
SET region = CASE
  -- Northern regions (far north)
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -21.5 THEN 'Arica y Parinacota'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -23 THEN 'Tarapacá'
  
  -- Northern-Central regions
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -26.5 THEN 'Antofagasta'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -29.5 THEN 'Atacama'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -32.5 THEN 'Coquimbo'
  
  -- Central regions - NO OVERLAP between Valparaíso and Metropolitana
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -33.2 THEN 'Valparaíso'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -34.2 THEN 'Metropolitana'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -35.5 THEN 'Libertador General Bernardo O''Higgins'
  
  -- Central-South regions
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -36.5 THEN 'Región del Maule'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -37.2 THEN 'Ñuble'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -38.2 THEN 'Bío Bío'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -39.3 THEN 'La Araucanía'
  
  -- Southern regions
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -40.4 THEN 'Los Ríos'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -43.5 THEN 'Los Lagos'
  
  -- Far South
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -48 THEN 'Región de Aysén del General Carlos Ibáñez del Campo'
  ELSE 'Magallanes y de la Antártica Chilena'
END
WHERE bounds IS NOT NULL;

COMMIT;

-- Report final distribution with actual latitude ranges
SELECT 
  'Region Distribution' as report_type,
  region,
  COUNT(*) as total_files,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true)::numeric, 2) as percentage,
  ROUND(MIN(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2)::numeric, 2) as min_center_lat,
  ROUND(MAX(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2)::numeric, 2) as max_center_lat,
  ROUND(AVG(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2)::numeric, 2) as avg_center_lat
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL AND bounds IS NOT NULL
GROUP BY region
ORDER BY max_center_lat DESC;

-- Check for unassigned files
SELECT 
  'Unassigned Files' as report_type,
  COUNT(*) as unassigned_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true)::numeric, 2) as percentage
FROM kmz_collection
WHERE is_active = true AND (region IS NULL OR region = '');

-- Show specific files in Metropolitana to verify no Valparaíso files
SELECT 
  'Metropolitana Files Sample' as report_type,
  id,
  file_name,
  region,
  ROUND(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2, 2) as center_lat
FROM kmz_collection
WHERE is_active = true AND region = 'Metropolitana'
LIMIT 10;
