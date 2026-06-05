-- Create KMZ Location Index table for searchable location data
-- This serves as a common search point for all KMZ-based locations

CREATE TABLE IF NOT EXISTS kmz_location_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmz_id UUID NOT NULL REFERENCES kmz_collection(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('region', 'city', 'property', 'landmark')),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  region TEXT NOT NULL,
  city TEXT,
  address TEXT,
  bounds JSONB,
  placemark_count INTEGER DEFAULT 0,
  location_data JSONB,
  searchable_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast searching
CREATE INDEX idx_kmz_location_region ON kmz_location_index(region);
CREATE INDEX idx_kmz_location_type ON kmz_location_index(type);
CREATE INDEX idx_kmz_location_searchable ON kmz_location_index USING GIN(to_tsvector('spanish', searchable_text));
CREATE INDEX idx_kmz_location_coordinates ON kmz_location_index(latitude, longitude);
CREATE INDEX idx_kmz_location_kmz_id ON kmz_location_index(kmz_id);

-- Create a view for easy global location searches
CREATE OR REPLACE VIEW kmz_locations_search AS
SELECT
  id,
  kmz_id,
  name,
  type,
  latitude,
  longitude,
  region,
  city,
  address,
  bounds,
  placemark_count,
  searchable_text,
  created_at
FROM kmz_location_index
ORDER BY type DESC, placemark_count DESC;

-- Add comments for documentation
COMMENT ON TABLE kmz_location_index IS 'Searchable index of all KMZ locations for global platform search';
COMMENT ON COLUMN kmz_location_index.searchable_text IS 'Full-text search field containing location name, region, and placemark names';
COMMENT ON COLUMN kmz_location_index.location_data IS 'Additional metadata including placemark names, bounds, and properties';
COMMENT ON COLUMN kmz_location_index.type IS 'Type of location: region (entire KMZ area), city, property, or landmark (individual points)';
