-- Populate kmz_location_index from existing kmz_placemarks data
-- This creates searchable location records from actual KMZ placemarks

INSERT INTO kmz_location_index (
  kmz_id,
  name,
  latitude,
  longitude,
  region,
  city,
  address,
  type,
  searchable_text,
  bounds,
  placemark_count,
  created_at,
  updated_at
)
SELECT 
  kp.kmz_id,
  kp.name,
  kp.center_lat,
  kp.center_lng,
  kp.region,
  COALESCE(kp.region, 'Unknown') as city,
  kp.description,
  kp.type,
  LOWER(CONCAT(COALESCE(kp.name, ''), ' ', COALESCE(kp.description, ''))) as searchable_text,
  kp.bounds,
  1 as placemark_count,
  NOW(),
  NOW()
FROM kmz_placemarks kp
WHERE kp.kmz_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM kmz_location_index kli 
  WHERE kli.kmz_id = kp.kmz_id AND kli.name = kp.name
)
ON CONFLICT DO NOTHING;
