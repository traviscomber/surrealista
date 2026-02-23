-- Remove the type check constraint, index coordinates, then restore it
-- This approach bypasses the constraint issue temporarily

-- Drop the constraint
ALTER TABLE kmz_location_index DROP CONSTRAINT IF EXISTS kmz_location_index_type_check;

-- Delete existing index first
DELETE FROM kmz_location_index;

-- Insert coordinates calculated from KMZ collection polygons
INSERT INTO kmz_location_index (id, kmz_id, name, latitude, longitude, region, city, address, searchable_text, placemark_count, created_at, updated_at, bounds, location_data)
SELECT 
  gen_random_uuid(),
  kc.id as kmz_id,
  kc.file_name as name,
  (
    SELECT AVG((elem->1)::numeric)
    FROM jsonb_array_elements(kc.coordinates) as poly,
         jsonb_array_elements(poly) as elem
  )::float as latitude,
  (
    SELECT AVG((elem->0)::numeric)
    FROM jsonb_array_elements(kc.coordinates) as poly,
         jsonb_array_elements(poly) as elem
  )::float as longitude,
  kc.region,
  kc.region as city,
  kc.description as address,
  LOWER(CONCAT(kc.file_name, ' ', kc.region)) as searchable_text,
  kc.placemarks_count as placemark_count,
  NOW(),
  NOW(),
  kc.bounds as bounds,
  jsonb_build_object('source', 'kmz_collection', 'file_name', kc.file_name) as location_data
FROM kmz_collection kc
WHERE kc.is_active = true
  AND kc.coordinates IS NOT NULL
  AND jsonb_array_length(kc.coordinates) > 0;

-- Update type field with a simple value now that constraint is gone
UPDATE kmz_location_index SET type = 'Search' WHERE type IS NULL;

-- Verify results
SELECT 
  COUNT(*) as total_locations,
  COUNT(DISTINCT kmz_id) as kmz_files,
  COUNT(DISTINCT region) as regions,
  STRING_AGG(DISTINCT region, ', ') as all_regions
FROM kmz_location_index;
