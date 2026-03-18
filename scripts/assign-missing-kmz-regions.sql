-- Automated region assignment for KMZ files based on location names in file names
-- This script maps Chilean cities/locations in KMZ file names to their corresponding regions

-- First, create a temporary table with city-to-region mappings
CREATE TEMP TABLE city_region_map (
  city_name TEXT,
  region TEXT
);

-- Insert known Chilean city/location mappings
INSERT INTO city_region_map (city_name, region) VALUES
  -- Los Lagos region
  ('Rio Puelo', 'Los Lagos'),
  ('Chonchi', 'Los Lagos'),
  ('Chiloé', 'Los Lagos'),
  ('Villarrica', 'La Araucanía'),
  ('Puyehue', 'Los Lagos'),
  ('Osorno', 'Los Lagos'),
  
  -- La Araucanía region
  ('Lonquimay', 'La Araucanía'),
  ('Temuco', 'La Araucanía'),
  ('Pucón', 'La Araucanía'),
  ('Villarrica', 'La Araucanía'),
  ('Curacautín', 'La Araucanía'),
  
  -- Magallanes region
  ('Punta Arenas', 'Magallanes y de la Antártica Chilena'),
  ('Puerto Natales', 'Magallanes y de la Antártica Chilena'),
  ('Aysén', 'Aysén del General Carlos Ibáñez del Campo'),
  ('Rio Bravo', 'Aysén del General Carlos Ibáñez del Campo'),
  ('Rio Yelcho', 'Aysén del General Carlos Ibáñez del Campo'),
  
  -- Central regions
  ('Curaçao', 'Región de O''Higgins'),
  ('Purranque', 'Los Lagos'),
  ('La Unión', 'Los Lagos'),
  
  -- Other common locations
  ('Valdivia', 'Los Ríos'),
  ('Riñihue', 'Los Ríos'),
  ('Muermos', 'Los Lagos'),
  ('Puerto Montt', 'Los Lagos'),
  ('Dalcahue', 'Los Lagos'),
  ('Achao', 'Los Lagos'),
  ('Quinchao', 'Los Lagos'),
  ('Queilen', 'Los Lagos'),
  ('Quellen', 'Los Lagos'),
  ('Quellon', 'Los Lagos'),
  ('Quemchi', 'Los Lagos');

-- Update kmz_collection with regions based on file name matching
UPDATE kmz_collection kc
SET region = crm.region,
    updated_at = NOW()
FROM city_region_map crm
WHERE kc.region IS NULL 
  AND kc.is_active = true
  AND (
    LOWER(kc.file_name) LIKE '%' || LOWER(crm.city_name) || '%'
    OR LOWER(kc.file_name) LIKE LOWER(crm.city_name) || '%'
  );

-- Log summary of updates
SELECT 
  COUNT(*) as total_unassigned_before,
  COUNT(CASE WHEN region IS NULL THEN 1 END) as still_unassigned,
  COUNT(CASE WHEN region IS NOT NULL THEN 1 END) as newly_assigned
FROM kmz_collection
WHERE is_active = true;

-- Show remaining unassigned files for manual review
SELECT 
  id,
  file_name,
  placemarks_count,
  created_at
FROM kmz_collection
WHERE region IS NULL 
  AND is_active = true
ORDER BY placemarks_count DESC
LIMIT 50;
