-- Direct indexing from kmz_placemarks table
-- This extracts placemarks and creates searchable location entries

-- First, clear existing index (optional, comment out if you want to preserve)
-- TRUNCATE TABLE kmz_location_index;

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
  created_at
)
SELECT
  kp.kmz_id,
  kp.name,
  kp.center_lat as latitude,
  kp.center_lng as longitude,
  kp.type,
  kp.region,
  kp.city,
  kp.description as address,
  LOWER(CONCAT(kp.name, ' ', COALESCE(kp.description, ''), ' ', COALESCE(kc.file_name, ''))) as searchable_text,
  kp.properties as location_data,
  1 as placemark_count,
  kp.bounds,
  NOW() as created_at
FROM kmz_placemarks kp
JOIN kmz_collection kc ON kp.kmz_id = kc.id
WHERE kc.is_active = true
  AND kp.center_lat IS NOT NULL
  AND kp.center_lng IS NOT NULL
ON CONFLICT (kmz_id, name) DO UPDATE SET
  region = EXCLUDED.region,
  city = EXCLUDED.city,
  searchable_text = EXCLUDED.searchable_text,
  updated_at = NOW();

-- Verify results
SELECT 
  COUNT(*) as total_locations,
  COUNT(DISTINCT kmz_id) as total_kmz,
  COUNT(DISTINCT region) as total_regions
FROM kmz_location_index;
