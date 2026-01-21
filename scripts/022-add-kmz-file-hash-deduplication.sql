-- Add file_size and file_hash columns to kmz_collection table for deduplication
ALTER TABLE kmz_collection ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE kmz_collection ADD COLUMN IF NOT EXISTS file_hash TEXT UNIQUE;

-- Create index on file_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_kmz_collection_file_hash ON kmz_collection(file_hash);

COMMIT;
