-- Comprehensive fix for all 16 Chilean regions with corrected latitude boundaries
-- NO overlaps - each region has a unique, non-overlapping latitude range
-- Based on actual geographic boundaries of Chilean administrative regions

BEGIN;

-- Clear and reassign all regions with correct latitude ranges (North to South)
UPDATE kmz_collection
SET region = CASE
  -- Northern regions (far north)
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -18.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -17.5 THEN 'Arica y Parinacota'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -20.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -18.5 THEN 'Tarapacá'
  
  -- Northern-Central regions
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -25 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -20.5 THEN 'Antofagasta'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -28 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -25 THEN 'Atacama'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -32 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -28 THEN 'Coquimbo'
  
  -- Central regions - NO OVERLAP between Valparaíso and Metropolitana
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -33.2 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -32 THEN 'Valparaíso'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -34.2 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -33.2 THEN 'Metropolitana'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -35.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -34.2 THEN 'Libertador General Bernardo O''Higgins'
  
  -- Central-South regions
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -36.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -35.5 THEN 'Región del Maule'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -37.2 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -36.5 THEN 'Ñuble'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -38.2 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -37.2 THEN 'Bío Bío'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -39.3 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -38.2 THEN 'La Araucanía'
  
  -- Southern regions
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -40.4 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -39.3 THEN 'Los Ríos'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -43.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -40.4 THEN 'Los Lagos'
  
  -- Far South
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -48 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -43.5 THEN 'Región de Aysén del General Carlos Ibáñez del Campo'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -48 THEN 'Magallanes y de la Antártica Chilena'
  
  ELSE region -- Keep if bounds are invalid
END
WHERE bounds IS NOT NULL;

COMMIT;

-- Verify the fix
SELECT 
  region,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true)::numeric, 2) as percentage,
  ROUND(MIN((bounds->>'center_lat')::numeric), 2) as min_lat,
  ROUND(MAX((bounds->>'center_lat')::numeric), 2) as max_lat
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL
GROUP BY region
ORDER BY ROUND(AVG((bounds->>'center_lat')::numeric), 2) DESC;

-- Check for unassigned
SELECT 
  COUNT(*) as unassigned,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true)::numeric, 2) as percentage
FROM kmz_collection
WHERE is_active = true AND (region IS NULL OR region = '');
