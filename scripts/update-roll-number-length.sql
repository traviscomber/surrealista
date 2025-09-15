-- Update the roll_number column to allow longer values
ALTER TABLE sii_coordinate_extractions 
ALTER COLUMN roll_number TYPE VARCHAR(50);

-- Add comment explaining the new format
COMMENT ON COLUMN sii_coordinate_extractions.roll_number IS 'Composite roll number in format: COMUNAHASH-MZA-PRD';
