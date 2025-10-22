-- Add region column to kmz_collection table for better organization
-- This will help organize 1500+ KMZ files by geographic region

ALTER TABLE kmz_collection 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Create index for faster region-based queries
CREATE INDEX IF NOT EXISTS idx_kmz_collection_region ON kmz_collection(region);

-- Update existing records to extract region from coordinates
-- Based on Chilean latitude ranges
UPDATE kmz_collection
SET region = CASE
  WHEN (bounds->>'south')::numeric BETWEEN -46 AND -43.5 THEN 'Región de Aysén'
  WHEN (bounds->>'south')::numeric BETWEEN -43.5 AND -41.5 THEN 'Región de Los Lagos'
  WHEN (bounds->>'south')::numeric BETWEEN -41.5 AND -39 THEN 'Región de Los Ríos'
  WHEN (bounds->>'south')::numeric BETWEEN -39 AND -37.5 THEN 'Región de La Araucanía'
  WHEN (bounds->>'south')::numeric BETWEEN -37.5 AND -36 THEN 'Región del Biobío'
  WHEN (bounds->>'south')::numeric BETWEEN -36 AND -34.5 THEN 'Región del Maule'
  WHEN (bounds->>'south')::numeric BETWEEN -34.5 AND -33 THEN 'Región de O''Higgins'
  WHEN (bounds->>'south')::numeric BETWEEN -33.5 AND -32.5 THEN 'Región Metropolitana'
  WHEN (bounds->>'south')::numeric BETWEEN -32.5 AND -31 THEN 'Región de Valparaíso'
  WHEN (bounds->>'south')::numeric BETWEEN -31 AND -29 THEN 'Región de Coquimbo'
  WHEN (bounds->>'south')::numeric BETWEEN -29 AND -26.5 THEN 'Región de Atacama'
  WHEN (bounds->>'south')::numeric BETWEEN -26.5 AND -23.5 THEN 'Región de Antofagasta'
  WHEN (bounds->>'south')::numeric BETWEEN -23.5 AND -18 THEN 'Región de Tarapacá'
  WHEN (bounds->>'south')::numeric < -18 THEN 'Región de Arica y Parinacota'
  ELSE 'Sin Región'
END
WHERE region IS NULL AND bounds IS NOT NULL;

-- Set default region for files without bounds
UPDATE kmz_collection
SET region = 'Sin Región'
WHERE region IS NULL;
