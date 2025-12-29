-- Create KMZ Placemarks table for storing individual placemarks
-- Optimized for 10,000+ KMZ files with hundreds of thousands of placemarks

CREATE TABLE IF NOT EXISTS kmz_placemarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmz_id UUID NOT NULL REFERENCES kmz_collection(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coordinates JSONB NOT NULL, -- Array of [lng, lat, altitude?]
  type TEXT NOT NULL, -- Point, LineString, Polygon
  style_url TEXT,
  properties JSONB,
  center_point GEOMETRY(POINT, 4326), -- PostGIS point for spatial queries
  region TEXT, -- Derived from center_point for faster queries
  bounds JSONB, -- Geographic bounds {north, south, east, west}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_type CHECK (type IN ('Point', 'LineString', 'Polygon'))
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_kmz_id ON kmz_placemarks(kmz_id);
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_name ON kmz_placemarks USING GIN(name gin_trgm_ops); -- Full-text search
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_region ON kmz_placemarks(region);
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_type ON kmz_placemarks(type);
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_center_point ON kmz_placemarks USING GIST(center_point); -- Spatial index

-- Install PostGIS extension if not already installed
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search

-- Enable Row Level Security
ALTER TABLE kmz_placemarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read kmz_placemarks"
  ON kmz_placemarks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert kmz_placemarks"
  ON kmz_placemarks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE kmz_placemarks IS 'Individual placemarks extracted from KMZ files for fast querying and spatial analysis';
COMMENT ON COLUMN kmz_placemarks.center_point IS 'PostGIS POINT for spatial queries (ST_DWithin, ST_Contains, etc)';
COMMENT ON COLUMN kmz_placemarks.region IS 'Cached region for faster filtering without PostGIS queries';
