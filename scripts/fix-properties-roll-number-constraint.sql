-- Fix the properties table to add unique constraint on roll_number
-- This will allow the ON CONFLICT operations in the trigger function to work properly

-- First, remove any duplicate roll_numbers if they exist
WITH duplicates AS (
    SELECT roll_number, 
           (SELECT id FROM properties p2 
            WHERE p2.roll_number = p1.roll_number 
            ORDER BY created_at ASC LIMIT 1) as keep_id
    FROM properties p1
    WHERE roll_number IS NOT NULL
    GROUP BY roll_number
    HAVING COUNT(*) > 1
)
DELETE FROM properties 
WHERE roll_number IN (SELECT roll_number FROM duplicates)
AND id NOT IN (SELECT keep_id FROM duplicates);

-- Add unique constraint to roll_number column
ALTER TABLE properties 
ADD CONSTRAINT properties_roll_number_unique 
UNIQUE (roll_number);

-- Update the trigger function to handle the case where roll_number might be null
CREATE OR REPLACE FUNCTION update_property_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if roll_number is not null
    IF NEW.roll_number IS NOT NULL THEN
        -- Update properties table when new SII extraction is added
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
