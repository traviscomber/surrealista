-- Check if the square_meters column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'square_meters'
    ) THEN
        -- Add square_meters column if it doesn't exist
        ALTER TABLE properties ADD COLUMN square_meters NUMERIC;
        
        -- Copy data from area column if it exists
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'properties'
            AND column_name = 'area'
        ) THEN
            UPDATE properties SET square_meters = area;
        END IF;
    END IF;
END $$;

-- Make sure we have all the necessary columns
DO $$
BEGIN
    -- Add any missing columns
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'land_area'
    ) THEN
        ALTER TABLE properties ADD COLUMN land_area NUMERIC;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'featured'
    ) THEN
        ALTER TABLE properties ADD COLUMN featured BOOLEAN DEFAULT false;
    END IF;
END $$;
