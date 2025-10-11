-- Check if constraints exist before adding them
-- Add unique constraint to roll_number column to support upsert operations
-- This will allow ON CONFLICT operations to work properly

DO $$
BEGIN
    -- Add unique constraint for roll_number if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sii_coordinate_extractions_roll_number_unique'
        AND table_name = 'sii_coordinate_extractions'
    ) THEN
        ALTER TABLE sii_coordinate_extractions 
        ADD CONSTRAINT sii_coordinate_extractions_roll_number_unique 
        UNIQUE (roll_number);
    END IF;

    -- Add composite unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sii_coordinate_extractions_location_unique'
        AND table_name = 'sii_coordinate_extractions'
    ) THEN
        ALTER TABLE sii_coordinate_extractions 
        ADD CONSTRAINT sii_coordinate_extractions_location_unique 
        UNIQUE (comuna, manzana, predio);
    END IF;
END $$;
