-- Add owner field to kmz_collection if it doesn't exist
ALTER TABLE kmz_collection
ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT NULL;

-- Add comment to document the owner field
COMMENT ON COLUMN kmz_collection.owner IS 'Property owner name - automatically filled or searchable when KMZ is clicked';

-- Create index on owner for faster searches
CREATE INDEX IF NOT EXISTS idx_kmz_owner ON kmz_collection(owner);

-- Show all columns to verify
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'kmz_collection' 
ORDER BY ordinal_position;
