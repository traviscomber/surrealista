-- Find and fix Rancagua files incorrectly assigned to Metropolitana
-- Then reassign all regions with corrected boundaries focusing on Metropolitana/O'Higgins separation

BEGIN;

-- First, show which Rancagua files are in Metropolitana (diagnostic)
SELECT 
  'Rancagua files in Metropolitana' as diagnostic,
  id,
  file_name,
  region,
  ROUND(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2, 2) as center_lat
FROM kmz_collection
WHERE is_active = true 
  AND region = 'Metropolitana'
  AND file_name ILIKE '%Rancagua%'
LIMIT 20;

-- Now reassign ALL regions using MORE PRECISE boundaries
-- The issue: Metropolitana should be MUCH narrower (only -33.0 to -33.15)
-- O'Higgins (Rancagua) starts at -33.15 and goes to -35.5

UPDATE kmz_collection
SET region = CASE
  -- Northern regions (far north)
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -21.5 THEN 'Arica y Parinacota'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -23 THEN 'Tarapacá'
  
  -- Northern-Central regions
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -26.5 THEN 'Antofagasta'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -29.5 THEN 'Atacama'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -32.5 THEN 'Coquimbo'
  
  -- Central regions - VERY NARROW for Metropolitana
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -33.0 THEN 'Valparaíso'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 > -33.15 THEN 'Metropolitana'  -- VERY TIGHT: only -33.0 to -33.15
  
  -- O'Higgins (Rancagua) starts at -33.15
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

-- Verify the fix
SELECT 
  'Final Distribution' as report_type,
  region,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true)::numeric, 2) as percentage,
  ROUND(MIN(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2), 2) as min_lat,
  ROUND(MAX(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2), 2) as max_lat
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL AND bounds IS NOT NULL
GROUP BY region
ORDER BY ROUND(MAX(((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2), 2) DESC;

-- Verify NO Rancagua files in Metropolitana
SELECT 
  'Rancagua files verification' as report,
  COUNT(*) as rancagua_in_metropolitana
FROM kmz_collection
WHERE is_active = true 
  AND region = 'Metropolitana'
  AND file_name ILIKE '%Rancagua%';
