-- Add PIC (Person In Charge) and Google Docs Link fields to kmz_collection
-- These fields allow registering the owner/PIC contact and associated documentation

ALTER TABLE kmz_collection
ADD COLUMN IF NOT EXISTS pic TEXT,
ADD COLUMN IF NOT EXISTS pic_phone TEXT,
ADD COLUMN IF NOT EXISTS pic_email TEXT,
ADD COLUMN IF NOT EXISTS google_docs_link TEXT;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_kmz_pic ON kmz_collection(pic);
CREATE INDEX IF NOT EXISTS idx_kmz_google_docs ON kmz_collection(google_docs_link);
