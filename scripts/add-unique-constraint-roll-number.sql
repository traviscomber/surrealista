-- Add unique constraint to roll_number column to support upsert operations
-- This will allow ON CONFLICT operations to work properly

ALTER TABLE sii_coordinate_extractions 
ADD CONSTRAINT sii_coordinate_extractions_roll_number_unique 
UNIQUE (roll_number);

-- Also add a composite unique constraint for the three fields
ALTER TABLE sii_coordinate_extractions 
ADD CONSTRAINT sii_coordinate_extractions_location_unique 
UNIQUE (comuna, manzana, predio);
