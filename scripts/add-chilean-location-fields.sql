-- Add detailed Chilean administrative division fields to properties table
-- This adds provincia and comuna fields for maximum location detail

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS provincia TEXT,
ADD COLUMN IF NOT EXISTS comuna TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region);
CREATE INDEX IF NOT EXISTS idx_properties_provincia ON properties(provincia);
CREATE INDEX IF NOT EXISTS idx_properties_comuna ON properties(comuna);
CREATE INDEX IF NOT EXISTS idx_properties_roll_number ON properties(roll_number);

-- Add comment explaining the Chilean administrative structure
COMMENT ON COLUMN properties.region IS 'Chilean region (e.g., Región de Los Lagos)';
COMMENT ON COLUMN properties.provincia IS 'Chilean province (e.g., Llanquihue)';
COMMENT ON COLUMN properties.comuna IS 'Chilean municipality/comuna (e.g., Puerto Varas)';
COMMENT ON COLUMN properties.roll_number IS 'SII property roll number (Rol de Avalúo)';
