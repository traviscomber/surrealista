-- Assign regions to remaining 203 KMZ files using geographic bounds
-- This script maps latitude/longitude coordinates to Chilean regions

-- Chilean regional latitude ranges (approximate)
-- Región de Arica y Parinacota: -17.5° to -18.5°
-- Región de Tarapacá: -18.5° to -21°
-- Región de Antofagasta: -21° to -26°
-- Región de Atacama: -26° to -29°
-- Región de Coquimbo: -29° to -32°
-- Región de Valparaíso: -32° to -33.5°
-- Región del Libertador General Bernardo O'Higgins: -33.5° to -35°
-- Región del Maule: -35° to -36.5°
-- Región de Ñuble: -36.5° to -37°
-- Región de La Araucanía: -37° to -39°
-- Región de Los Lagos: -39° to -43.5°
-- Región de Los Ríos: -39.5° to -40.5°
-- Región de Aysén: -43.5° to -48°
-- Región de Magallanes: -48° to -56°

UPDATE kmz_collection
SET region = CASE
  WHEN bounds IS NOT NULL THEN
    CASE
      -- Los Lagos region (most data concentration based on debug logs)
      WHEN (bounds->'max_lat')::float BETWEEN -39 AND -40.5 OR
           (bounds->'min_lat')::float BETWEEN -39 AND -40.5 OR
           (bounds->'center_lat')::float BETWEEN -39 AND -40.5
      THEN 'Los Lagos'
      
      -- La Araucanía
      WHEN (bounds->'max_lat')::float BETWEEN -37 AND -39 OR
           (bounds->'min_lat')::float BETWEEN -37 AND -39 OR
           (bounds->'center_lat')::float BETWEEN -37 AND -39
      THEN 'La Araucanía'
      
      -- Aysén
      WHEN (bounds->'max_lat')::float BETWEEN -43.5 AND -48 OR
           (bounds->'min_lat')::float BETWEEN -43.5 AND -48 OR
           (bounds->'center_lat')::float BETWEEN -43.5 AND -48
      THEN 'Aysén'
      
      -- Magallanes
      WHEN (bounds->'max_lat')::float BETWEEN -48 AND -56 OR
           (bounds->'min_lat')::float BETWEEN -48 AND -56 OR
           (bounds->'center_lat')::float BETWEEN -48 AND -56
      THEN 'Magallanes'
      
      -- El Maule
      WHEN (bounds->'max_lat')::float BETWEEN -35 AND -36.5 OR
           (bounds->'min_lat')::float BETWEEN -35 AND -36.5 OR
           (bounds->'center_lat')::float BETWEEN -35 AND -36.5
      THEN 'El Maule'
      
      -- Ñuble
      WHEN (bounds->'max_lat')::float BETWEEN -36.5 AND -37 OR
           (bounds->'min_lat')::float BETWEEN -36.5 AND -37 OR
           (bounds->'center_lat')::float BETWEEN -36.5 AND -37
      THEN 'Ñuble'
      
      -- O'Higgins
      WHEN (bounds->'max_lat')::float BETWEEN -33.5 AND -35 OR
           (bounds->'min_lat')::float BETWEEN -33.5 AND -35 OR
           (bounds->'center_lat')::float BETWEEN -33.5 AND -35
      THEN 'Libertad (O''Higgins)'
      
      -- Valparaíso
      WHEN (bounds->'max_lat')::float BETWEEN -32 AND -33.5 OR
           (bounds->'min_lat')::float BETWEEN -32 AND -33.5 OR
           (bounds->'center_lat')::float BETWEEN -32 AND -33.5
      THEN 'Valparaíso'
      
      -- Coquimbo
      WHEN (bounds->'max_lat')::float BETWEEN -29 AND -32 OR
           (bounds->'min_lat')::float BETWEEN -29 AND -32 OR
           (bounds->'center_lat')::float BETWEEN -29 AND -32
      THEN 'Coquimbo'
      
      -- Default to Los Lagos for any remaining files
      ELSE 'Los Lagos'
    END
  ELSE 'Los Lagos'  -- Default if no bounds data
END
WHERE region IS NULL;

-- Show results
SELECT 
  COUNT(*) as total_updated,
  COUNT(CASE WHEN region IS NOT NULL THEN 1 END) as now_assigned,
  COUNT(CASE WHEN region IS NULL THEN 1 END) as still_unassigned
FROM kmz_collection;
