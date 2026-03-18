-- Add missing Chilean regions: La Araucanía, Tarapacá, Arica y Parinacota
-- Reassign KMZ files to these regions based on geographic latitude bounds

BEGIN;

-- First, check which files should be in La Araucanía (-37.5 to -39)
-- Between Ñuble (-37 to -38) and Los Ríos (-39 to -40.4)
UPDATE kmz_collection
SET region = 'La Araucanía'
WHERE bounds IS NOT NULL 
  AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -37.5 
  AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -37
  AND region NOT IN ('La Araucanía');

-- Add files for Tarapacá (-20.5 to -18.5)
UPDATE kmz_collection
SET region = 'Tarapacá'
WHERE bounds IS NOT NULL 
  AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -20.5 
  AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -18.5;

-- Add files for Arica y Parinacota (-18.5 to -17.5)
UPDATE kmz_collection
SET region = 'Arica y Parinacota'
WHERE bounds IS NOT NULL 
  AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -18.5 
  AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -17.5;

COMMIT;

-- Verify all 16 regions are now present
SELECT 
  region,
  COUNT(*) as file_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true), 2) as percentage
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL
GROUP BY region
ORDER BY 
  CASE region
    WHEN 'Arica y Parinacota' THEN 1
    WHEN 'Tarapacá' THEN 2
    WHEN 'Antofagasta' THEN 3
    WHEN 'Atacama' THEN 4
    WHEN 'Coquimbo' THEN 5
    WHEN 'Valparaíso' THEN 6
    WHEN 'Metropolitana' THEN 7
    WHEN 'Libertador General Bernardo O''Higgins' THEN 8
    WHEN 'Región del Maule' THEN 9
    WHEN 'Ñuble' THEN 10
    WHEN 'Bío Bío' THEN 11
    WHEN 'La Araucanía' THEN 12
    WHEN 'Los Ríos' THEN 13
    WHEN 'Los Lagos' THEN 14
    WHEN 'Región de Aysén del General Carlos Ibáñez del Campo' THEN 15
    WHEN 'Magallanes y de la Antártica Chilena' THEN 16
    ELSE 99
  END;

-- Summary
SELECT 
  COUNT(DISTINCT region) as total_regions,
  COUNT(*) as total_kmz,
  COUNT(CASE WHEN region IS NULL THEN 1 END) as unassigned
FROM kmz_collection
WHERE is_active = true;
