-- Index coordinates from kmz_collection into kmz_location_index
-- This populates the search index with all extracted locations

-- Clear existing index
TRUNCATE TABLE kmz_location_index;

-- For each KMZ with coordinates, create location index entries
INSERT INTO kmz_location_index (
  kmz_id,
  name,
  latitude,
  longitude,
  type,
  region,
  city,
  address,
  searchable_text,
  location_data,
  placemark_count,
  bounds,
  created_at,
  updated_at
)
SELECT
  kc.id,
  COALESCE(coord->>'name', kc.file_name),
  (coord->>'latitude')::FLOAT,
  (coord->>'longitude')::FLOAT,
  COALESCE(coord->>'type', 'Point'),
  COALESCE(kc.region, 'Unknown'),
  COALESCE(coord->>'city', ''),
  COALESCE(coord->>'description', ''),
  LOWER(CONCAT(COALESCE(coord->>'name', ''), ' ', kc.file_name)),
  coord,
  1,
  coord->'bounds',
  NOW(),
  NOW()
FROM kmz_collection kc,
LATERAL jsonb_array_elements(kc.coordinates) AS coord
WHERE kc.coordinates IS NOT NULL 
  AND jsonb_array_length(kc.coordinates) > 0
  AND (coord->>'latitude') IS NOT NULL
  AND (coord->>'longitude') IS NOT NULL;

-- Verify results
SELECT 
  COUNT(*) as total_locations,
  COUNT(DISTINCT kmz_id) as kmz_with_locations,
  COUNT(DISTINCT region) as unique_regions,
  STRING_AGG(DISTINCT region, ', ') as regions
FROM kmz_location_index;
