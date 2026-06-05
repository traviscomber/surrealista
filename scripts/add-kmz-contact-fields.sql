-- Add missing contact fields to kmz_collection table
ALTER TABLE kmz_collection
ADD COLUMN IF NOT EXISTS pic text,
ADD COLUMN IF NOT EXISTS pic_phone text,
ADD COLUMN IF NOT EXISTS pic_email text;

-- Comment the columns for documentation
COMMENT ON COLUMN kmz_collection.pic IS 'Person In Charge (Contact name)';
COMMENT ON COLUMN kmz_collection.pic_phone IS 'Person In Charge phone number';
COMMENT ON COLUMN kmz_collection.pic_email IS 'Person In Charge email address';
