-- Fix type mismatch in property_images table
-- The property_images.property_id is UUID but properties.id is BIGINT

-- Drop existing foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'property_images_property_id_fkey'
        AND table_name = 'property_images'
    ) THEN
        ALTER TABLE property_images DROP CONSTRAINT property_images_property_id_fkey;
    END IF;
END $$;

-- Change property_id column type from UUID to BIGINT
ALTER TABLE property_images 
ALTER COLUMN property_id TYPE BIGINT USING NULL;

-- Re-add foreign key constraint with correct type
ALTER TABLE property_images
ADD CONSTRAINT property_images_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_property_images_property_id 
ON property_images(property_id);
