-- Comprehensive verification of all Chilean regions
-- Lists all regions currently in the database with file counts
-- Checks for completeness and identifies any missing regions

SELECT 
  region,
  COUNT(*) as file_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true), 2) as percentage,
  MIN((bounds->>'north')::numeric) as northmost_lat,
  MAX((bounds->>'south')::numeric) as southmost_lat
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
    WHEN 'Biobío' THEN 11
    WHEN 'Los Ríos' THEN 12
    WHEN 'Los Lagos' THEN 13
    WHEN 'Región de Aysén del General Carlos Ibáñez del Campo' THEN 14
    WHEN 'Magallanes y de la Antártica Chilena' THEN 15
    ELSE 16
  END;

-- Verify total coverage
SELECT 
  COUNT(*) as total_active_kmz,
  COUNT(CASE WHEN region IS NOT NULL THEN 1 END) as assigned,
  COUNT(CASE WHEN region IS NULL THEN 1 END) as unassigned,
  ROUND(100.0 * COUNT(CASE WHEN region IS NOT NULL THEN 1 END) / COUNT(*), 2) as assignment_percentage
FROM kmz_collection
WHERE is_active = true;

-- Show all unique regions for comparison
SELECT 
  DISTINCT region,
  COUNT(*) OVER (PARTITION BY region) as count
FROM kmz_collection
WHERE is_active = true AND region IS NOT NULL
ORDER BY region;
