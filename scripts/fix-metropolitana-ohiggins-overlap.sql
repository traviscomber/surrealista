-- Fix overlapping Metropolitana and O'Higgins regions
-- Corrected latitude ranges to properly separate all Chilean regions

BEGIN;

-- Reassign ALL KMZ files with corrected, non-overlapping latitude ranges
UPDATE kmz_collection
SET region = CASE
  -- North to South: No overlaps, each region has exclusive range
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -17.5 THEN 'Arica y Parinacota'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -18.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -17.5 THEN 'Tarapacá'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -20.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -18.5 THEN 'Antofagasta'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -25 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -20.5 THEN 'Atacama'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -28 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -25 THEN 'Coquimbo'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -32.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -28 THEN 'Valparaíso'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -34 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -32.5 THEN 'Metropolitana'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -36 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -34 THEN 'Libertador General Bernardo O''Higgins'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -37 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -36 THEN 'Región del Maule'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -37.8 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -37 THEN 'Ñuble'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -38.8 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -37.8 THEN 'Bío Bío'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -39.6 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -38.8 THEN 'La Araucanía'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -40.4 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -39.6 THEN 'Los Ríos'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -43.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -40.4 THEN 'Los Lagos'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -48 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -43.5 THEN 'Región de Aysén del General Carlos Ibáñez del Campo'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -48 THEN 'Magallanes y de la Antártica Chilena'
  ELSE region
END
WHERE bounds IS NOT NULL;

COMMIT;

-- Verify the fix
SELECT 
  region,
  COUNT(*) as file_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true), 2) as percentage
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL
GROUP BY region
ORDER BY region;

-- Check for unassigned files
SELECT COUNT(*) as unassigned_count FROM kmz_collection WHERE is_active = true AND region IS NULL;
