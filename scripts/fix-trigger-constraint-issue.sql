-- Fix the ON CONFLICT constraint issue by ensuring all required constraints exist
-- This script will add missing constraints and handle any existing data conflicts

-- Step 1: Add unique constraint to properties table if it doesn't exist
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'properties_roll_number_unique' 
        AND table_name = 'properties'
    ) THEN
        -- Remove duplicates first
        WITH duplicates AS (
            SELECT roll_number, 
                   (SELECT id FROM properties p2 
                    WHERE p2.roll_number = p1.roll_number 
                    AND p2.roll_number IS NOT NULL
                    ORDER BY created_at ASC LIMIT 1) as keep_id
            FROM properties p1
            WHERE roll_number IS NOT NULL
            GROUP BY roll_number
            HAVING COUNT(*) > 1
        )
        DELETE FROM properties 
        WHERE roll_number IN (SELECT roll_number FROM duplicates)
        AND id NOT IN (SELECT keep_id FROM duplicates);
        
        -- Add the unique constraint
        ALTER TABLE properties 
        ADD CONSTRAINT properties_roll_number_unique 
        UNIQUE (roll_number);
    END IF;
END $$;

-- Step 2: Add unique constraint to sii_coordinate_extractions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sii_coordinate_extractions_roll_number_unique' 
        AND table_name = 'sii_coordinate_extractions'
    ) THEN
        -- Remove duplicates first
        WITH duplicates AS (
            SELECT roll_number, 
                   (SELECT id FROM sii_coordinate_extractions s2 
                    WHERE s2.roll_number = s1.roll_number 
                    ORDER BY created_at ASC LIMIT 1) as keep_id
            FROM sii_coordinate_extractions s1
            GROUP BY roll_number
            HAVING COUNT(*) > 1
        )
        DELETE FROM sii_coordinate_extractions 
        WHERE roll_number IN (SELECT roll_number FROM duplicates)
        AND id NOT IN (SELECT keep_id FROM duplicates);
        
        -- Add the unique constraint
        ALTER TABLE sii_coordinate_extractions 
        ADD CONSTRAINT sii_coordinate_extractions_roll_number_unique 
        UNIQUE (roll_number);
    END IF;
END $$;

-- Step 3: Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION update_property_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if roll_number is not null and coordinates exist
    IF NEW.roll_number IS NOT NULL AND NEW.coordinates IS NOT NULL THEN
        BEGIN
            -- Try to insert/update the property
            INSERT INTO properties (
                roll_number, 
                latitude, 
                longitude, 
                address, 
                city, 
                region,
                coordinate_source,
                coordinate_extracted_at,
                updated_at
            ) VALUES (
                NEW.roll_number,
                (NEW.coordinates->>'lat')::NUMERIC,
                (NEW.coordinates->>'lng')::NUMERIC,
                NEW.address,
                NEW.city,
                NEW.region,
                NEW.source,
                NEW.extracted_at,
                NOW()
            )
            ON CONFLICT (roll_number) 
            DO UPDATE SET
                latitude = (NEW.coordinates->>'lat')::NUMERIC,
                longitude = (NEW.coordinates->>'lng')::NUMERIC,
                address = COALESCE(NEW.address, properties.address),
                city = COALESCE(NEW.city, properties.city),
                region = COALESCE(NEW.region, properties.region),
                coordinate_source = NEW.source,
                coordinate_extracted_at = NEW.extracted_at,
                updated_at = NOW();
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but don't fail the entire operation
            RAISE NOTICE 'Error updating property coordinates for roll_number %: %', NEW.roll_number, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
