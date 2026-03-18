-- Find all KMZ files without region assignment or with NULL region
SELECT 
  id,
  file_name,
  region,
  is_active,
  file_path,
  CASE 
    WHEN file_name ILIKE '%.mp4' OR file_name ILIKE '%.mov' OR file_name ILIKE '%.avi' OR file_name ILIKE '%.mkv' 
    THEN 'VIDEO FILE'
    ELSE 'KMZ'
  END as file_type
FROM kmz_collection
WHERE region IS NULL 
   OR region = '' 
   OR region = 'Sin Región'
ORDER BY file_name
LIMIT 100;
