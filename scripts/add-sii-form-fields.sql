-- Add missing columns to sii_coordinate_extractions table for Comuna, Manzana, Predio structure
ALTER TABLE sii_coordinate_extractions 
ADD COLUMN IF NOT EXISTS comuna character varying(100),
ADD COLUMN IF NOT EXISTS manzana character varying(10),
ADD COLUMN IF NOT EXISTS predio character varying(10);

-- Create index for faster lookups by the new composite key
CREATE INDEX IF NOT EXISTS idx_sii_extractions_composite 
ON sii_coordinate_extractions (comuna, manzana, predio);

-- Update existing records to have default values if needed
UPDATE sii_coordinate_extractions 
SET comuna = 'UNKNOWN', manzana = '0', predio = '0' 
WHERE comuna IS NULL OR manzana IS NULL OR predio IS NULL;
