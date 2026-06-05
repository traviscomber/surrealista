-- Check the actual structure of coordinates in kmz_collection
SELECT 
  id,
  file_name,
  region,
  coordinates,
  jsonb_typeof(coordinates) as coordinate_type
FROM kmz_collection
WHERE coordinates IS NOT NULL
LIMIT 5;
