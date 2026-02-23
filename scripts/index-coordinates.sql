-- Index KMZ coordinates into kmz_location_index
-- Extracts polygon centroids and creates searchable locations

TRUNCATE TABLE kmz_location_index;

INSERT INTO kmz_location_index (
  kmz_id,
  name,
  latitude,
  longitude,
  region,
  city,
  address,
  searchable_text,
  type,
  placemark_count,
  created_at,
  updated_at
)
SELECT 
  kc.id as kmz_id,
  kc.file_name as name,
  -- Calculate centroid latitude from all coordinate points
  (
    SELECT AVG((elem->1)::numeric)
    FROM jsonb_array_elements(kc.coordinates) as poly,
         jsonb_array_elements(poly) as elem
  )::float as latitude,
  -- Calculate centroid longitude from all coordinate points
  (
    SELECT AVG((elem->0)::numeric)
    FROM jsonb_array_elements(kc.coordinates) as poly,
         jsonb_array_elements(poly) as elem
  )::float as longitude,
  kc.region,
  kc.region as city,
  CONCAT('Polígono en ', kc.region) as address,
  LOWER(CONCAT(kc.file_name, ' ', kc.region)) as searchable_text,
  '' as type,
  kc.placemarks_count as placemark_count,
  NOW(),
  NOW()
FROM kmz_collection kc
WHERE kc.is_active = true
  AND kc.coordinates IS NOT NULL
  AND jsonb_array_length(kc.coordinates) > 0;

-- Verify results
SELECT 
  COUNT(*) as total_locations,
  COUNT(DISTINCT kmz_id) as kmz_files,
  COUNT(DISTINCT region) as regions,
  STRING_AGG(DISTINCT region, ', ') as all_regions
FROM kmz_location_index;
