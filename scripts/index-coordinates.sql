-- Index coordinates from kmz_collection into kmz_location_index
-- This populates the search index with all extracted locations

-- Clear existing index
TRUNCATE TABLE kmz_location_index;

-- Insert all coordinates from kmz_collection into kmz_location_index
-- The coordinates field is JSONB, we need to handle its structure properly
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
  kc.id as kmz_id,
  COALESCE(kc.file_name, 'Location') as name,
  (kc.coordinates->>'latitude')::NUMERIC as latitude,
  (kc.coordinates->>'longitude')::NUMERIC as longitude,
  COALESCE(kc.coordinates->>'type', 'Point') as type,
  COALESCE(kc.region, 'Unknown') as region,
  COALESCE(kc.coordinates->>'city', '') as city,
  COALESCE(kc.coordinates->>'description', '') as address,
  LOWER(CONCAT(COALESCE(kc.file_name, ''), ' ', COALESCE(kc.region, ''))) as searchable_text,
  kc.coordinates as location_data,
  COALESCE(kc.placemarks_count, 1) as placemark_count,
  kc.bounds,
  NOW() as created_at,
  NOW() as updated_at
FROM kmz_collection kc
WHERE kc.coordinates IS NOT NULL 
  AND (kc.coordinates->>'latitude') IS NOT NULL
  AND (kc.coordinates->>'longitude') IS NOT NULL;

-- Verify results
SELECT 
  COUNT(*) as total_locations,
  COUNT(DISTINCT kmz_id) as kmz_with_locations,
  COUNT(DISTINCT region) as unique_regions,
  STRING_AGG(DISTINCT region, ', ') as regions,
  MIN(latitude) as min_lat,
  MAX(latitude) as max_lat,
  MIN(longitude) as min_lng,
  MAX(longitude) as max_lng
FROM kmz_location_index;
