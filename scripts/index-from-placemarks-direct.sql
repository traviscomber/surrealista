-- Direct indexing from kmz_placemarks table
-- This extracts placemarks and creates searchable location entries

-- Clear existing index to start fresh
TRUNCATE TABLE kmz_location_index;

-- Insert all placemarks from kmz_placemarks into kmz_location_index
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
  kp.kmz_id,
  kp.name,
  kp.center_lat,
  kp.center_lng,
  kp.type,
  COALESCE(kp.region, kc.region, 'Unknown'),
  COALESCE(kp.properties->>'city', kc.region),
  kp.description,
  LOWER(CONCAT(COALESCE(kp.name, ''), ' ', COALESCE(kp.description, ''), ' ', COALESCE(kc.file_name, ''))),
  kp.properties,
  1,
  kp.bounds,
  NOW(),
  NOW()
FROM kmz_placemarks kp
LEFT JOIN kmz_collection kc ON kp.kmz_id = kc.id
WHERE kp.center_lat IS NOT NULL 
  AND kp.center_lng IS NOT NULL;

-- Verify results
SELECT 
  COUNT(*) as total_locations,
  COUNT(DISTINCT kmz_id) as kmz_files,
  COUNT(DISTINCT region) as regions
FROM kmz_location_index;
