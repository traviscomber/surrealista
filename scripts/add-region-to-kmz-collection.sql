-- Add region column to kmz_collection table for better organization
-- This will allow grouping KMZ files by Chilean regions

-- Add region column
ALTER TABLE kmz_collection 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Create index for faster region-based queries
CREATE INDEX IF NOT EXISTS idx_kmz_collection_region ON kmz_collection(region);

-- Add comment
COMMENT ON COLUMN kmz_collection.region IS 'Chilean region name (e.g., Los Lagos, Los Ríos, La Araucanía)';

-- Update existing records based on bounds
-- Los Lagos region (approximate bounds: -44.0 to -40.5 lat)
UPDATE kmz_collection
SET region = 'Región de Los Lagos'
WHERE region IS NULL 
  AND bounds IS NOT NULL
  AND (bounds->>'south')::float BETWEEN -44.0 AND -40.5;

-- Los Ríos region (approximate bounds: -40.5 to -39.0 lat)
UPDATE kmz_collection
SET region = 'Región de Los Ríos'
WHERE region IS NULL 
  AND bounds IS NOT NULL
  AND (bounds->>'south')::float BETWEEN -40.5 AND -39.0;

-- La Araucanía region (approximate bounds: -39.5 to -37.5 lat)
UPDATE kmz_collection
SET region = 'Región de La Araucanía'
WHERE region IS NULL 
  AND bounds IS NOT NULL
  AND (bounds->>'south')::float BETWEEN -39.5 AND -37.5;

-- Biobío region (approximate bounds: -38.5 to -36.5 lat)
UPDATE kmz_collection
SET region = 'Región del Biobío'
WHERE region IS NULL 
  AND bounds IS NOT NULL
  AND (bounds->>'south')::float BETWEEN -38.5 AND -36.5;

-- Maule region (approximate bounds: -36.5 to -35.0 lat)
UPDATE kmz_collection
SET region = 'Región del Maule'
WHERE region IS NULL 
  AND bounds IS NOT NULL
  AND (bounds->>'south')::float BETWEEN -36.5 AND -35.0;

-- O'Higgins region (approximate bounds: -35.0 to -33.5 lat)
UPDATE kmz_collection
SET region = 'Región de O''Higgins'
WHERE region IS NULL 
  AND bounds IS NOT NULL
  AND (bounds->>'south')::float BETWEEN -35.0 AND -33.5;

-- Set default region for any remaining records without bounds
UPDATE kmz_collection
SET region = 'Sin Región'
WHERE region IS NULL;
