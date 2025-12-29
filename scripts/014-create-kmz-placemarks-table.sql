-- Removed PostGIS GEOMETRY type, using simple latitude/longitude for compatibility
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
  -- Using simple decimal coordinates instead of PostGIS GEOMETRY type
  center_lat DECIMAL(10, 8),
  center_lng DECIMAL(11, 8),
  region TEXT, -- Region name for faster queries
  bounds JSONB, -- Geographic bounds {north, south, east, west}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_type CHECK (type IN ('Point', 'LineString', 'Polygon')),
  CONSTRAINT valid_latitude CHECK (center_lat IS NULL OR (center_lat >= -90 AND center_lat <= 90)),
  CONSTRAINT valid_longitude CHECK (center_lng IS NULL OR (center_lng >= -180 AND center_lng <= 180))
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_kmz_id ON kmz_placemarks(kmz_id);
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_region ON kmz_placemarks(region);
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_type ON kmz_placemarks(type);
-- Using simple coordinate indexes instead of PostGIS spatial index
CREATE INDEX IF NOT EXISTS idx_kmz_placemarks_center_coords ON kmz_placemarks(center_lat, center_lng);

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
COMMENT ON TABLE kmz_placemarks IS 'Individual placemarks extracted from KMZ files for fast querying and filtering';
COMMENT ON COLUMN kmz_placemarks.center_lat IS 'Latitude of placemark center point';
COMMENT ON COLUMN kmz_placemarks.center_lng IS 'Longitude of placemark center point';
COMMENT ON COLUMN kmz_placemarks.region IS 'Cached region for faster filtering';
