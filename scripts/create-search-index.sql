-- Create a clean search index table without the problematic type constraint
CREATE TABLE IF NOT EXISTS kmz_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmz_id UUID NOT NULL REFERENCES kmz_collection(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  region TEXT,
  city TEXT,
  address TEXT,
  searchable_text TEXT,
  placemark_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clear if exists
TRUNCATE TABLE kmz_search_index;

-- Insert all KMZ coordinates into the new search table
INSERT INTO kmz_search_index (id, kmz_id, name, latitude, longitude, region, city, address, searchable_text, placemark_count, created_at, updated_at)
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
  NOW()
FROM kmz_collection kc
WHERE kc.is_active = true
  AND kc.coordinates IS NOT NULL
  AND jsonb_array_length(kc.coordinates) > 0;

-- Enable RLS
ALTER TABLE kmz_search_index ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
CREATE POLICY "allow_public_read" ON kmz_search_index
  FOR SELECT USING (true);

-- Create index for searches
CREATE INDEX IF NOT EXISTS idx_kmz_search_index_searchable_text 
  ON kmz_search_index USING GIN (searchable_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_kmz_search_index_region 
  ON kmz_search_index (region);

-- Verify results
SELECT 
  COUNT(*) as total_locations,
  COUNT(DISTINCT kmz_id) as kmz_files,
  COUNT(DISTINCT region) as regions,
  STRING_AGG(DISTINCT region, ', ') as all_regions
FROM kmz_search_index;
