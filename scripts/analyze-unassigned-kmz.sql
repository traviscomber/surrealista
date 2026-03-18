-- Script to identify the 203 unassigned KMZ files and analyze their names
-- This helps us understand what locations they contain so we can add them to the mapping

SELECT 
  id,
  file_name,
  region,
  placemarks_count,
  LENGTH(file_name) as name_length,
  -- Extract potential city names from file names
  CASE 
    WHEN file_name ~* 'lote|lot' THEN 'Contains LOTE'
    WHEN file_name ~* 'propuesto|propuesta' THEN 'Contains PROPUESTO'
    WHEN file_name ~* 'sector|zona' THEN 'Contains SECTOR/ZONA'
    WHEN file_name ~* 'fundo|campo' THEN 'Contains FUNDO/CAMPO'
    WHEN file_name ~* '\d+' THEN 'Contains NUMBERS'
    ELSE 'Generic name'
  END as name_pattern
FROM kmz_collection
WHERE region IS NULL
ORDER BY file_name
LIMIT 203;

-- Get statistics on unassigned KMZ naming patterns
SELECT 
  CASE 
    WHEN file_name ~* 'lote|lot' THEN 'Contains LOTE'
    WHEN file_name ~* 'propuesto|propuesta' THEN 'Contains PROPUESTO'
    WHEN file_name ~* 'sector|zona' THEN 'Contains SECTOR/ZONA'
    WHEN file_name ~* 'fundo|campo' THEN 'Contains FUNDO/CAMPO'
    WHEN file_name ~* '\d+' THEN 'Contains NUMBERS'
    ELSE 'Generic name'
  END as name_pattern,
  COUNT(*) as count
FROM kmz_collection
WHERE region IS NULL
GROUP BY name_pattern
ORDER BY count DESC;
