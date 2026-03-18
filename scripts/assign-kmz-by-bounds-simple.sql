-- Simple KMZ region assignment using bounds center latitude
-- Calculates average latitude from north/south bounds
BEGIN;

-- Assign regions based on bounds center latitude
UPDATE kmz_collection
SET region = CASE
  -- Calculate center latitude from bounds (north + south) / 2
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -18.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -17.5 THEN 'Arica y Parinacota'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -20.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -18.5 THEN 'Tarapacá'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -25 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -20.5 THEN 'Antofagasta'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -28 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -25 THEN 'Atacama'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -32 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -28 THEN 'Coquimbo'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -33.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -32 THEN 'Valparaíso'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -34.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -33.5 THEN 'Metropolitana'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -36 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -34.5 THEN 'Libertador General Bernardo O''Higgins'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -37 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -36 THEN 'Región del Maule'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -38 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -37 THEN 'Ñuble'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -40.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -38 THEN 'Biobío'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -40.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -39 THEN 'Los Ríos'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -43.5 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -38 THEN 'Los Lagos'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 >= -48 AND ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -43.5 THEN 'Región de Aysén del General Carlos Ibáñez del Campo'
  WHEN ((bounds->>'north')::numeric + (bounds->>'south')::numeric) / 2 < -48 THEN 'Magallanes y de la Antártica Chilena'
  ELSE region  -- Keep existing region if bounds are null or invalid
END
WHERE bounds IS NOT NULL AND region IS NULL;

COMMIT;

-- Report final results
SELECT 
  COUNT(*) as total_kmz,
  COUNT(CASE WHEN region IS NOT NULL THEN 1 END) as assigned,
  COUNT(CASE WHEN region IS NULL THEN 1 END) as unassigned,
  ROUND(100.0 * COUNT(CASE WHEN region IS NOT NULL THEN 1 END) / COUNT(*), 2) as assignment_percentage
FROM kmz_collection;
