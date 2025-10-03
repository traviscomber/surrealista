-- Create KMZ Collection table to store all KMZ files
-- This script is designed for Supabase PostgreSQL

CREATE TABLE IF NOT EXISTS kmz_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  drive_file_id TEXT,
  description TEXT,
  metadata JSONB,
  placemarks_count INTEGER DEFAULT 0,
  rol_numbers TEXT[],
  bounds JSONB,
  coordinates JSONB,
  tags TEXT[],
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(drive_file_id)
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_kmz_collection_file_name ON kmz_collection(file_name);
CREATE INDEX IF NOT EXISTS idx_kmz_collection_tags ON kmz_collection USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kmz_collection_rol_numbers ON kmz_collection USING GIN(rol_numbers);
CREATE INDEX IF NOT EXISTS idx_kmz_collection_category ON kmz_collection(category);
CREATE INDEX IF NOT EXISTS idx_kmz_collection_is_active ON kmz_collection(is_active);

-- Enable Row Level Security
ALTER TABLE kmz_collection ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read kmz_collection"
  ON kmz_collection FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert kmz_collection"
  ON kmz_collection FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update kmz_collection"
  ON kmz_collection FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete kmz_collection"
  ON kmz_collection FOR DELETE
  TO authenticated
  USING (true);

-- Add comments
COMMENT ON TABLE kmz_collection IS 'Storage for KMZ file collection with metadata and coordinates';
COMMENT ON COLUMN kmz_collection.file_name IS 'Original KMZ file name';
COMMENT ON COLUMN kmz_collection.file_path IS 'Full path in Google Drive';
COMMENT ON COLUMN kmz_collection.drive_file_id IS 'Google Drive file ID';
COMMENT ON COLUMN kmz_collection.metadata IS 'KMZ metadata including name, description, author';
COMMENT ON COLUMN kmz_collection.placemarks_count IS 'Number of placemarks in the KMZ file';
COMMENT ON COLUMN kmz_collection.rol_numbers IS 'Extracted property rol numbers';
COMMENT ON COLUMN kmz_collection.bounds IS 'Geographic bounds (north, south, east, west)';
COMMENT ON COLUMN kmz_collection.coordinates IS 'All coordinates from placemarks';
COMMENT ON COLUMN kmz_collection.tags IS 'Custom tags for organization';
COMMENT ON COLUMN kmz_collection.category IS 'Category (property, region, project, etc)';
