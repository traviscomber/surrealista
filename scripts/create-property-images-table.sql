-- Update property_images table to ensure all columns exist
-- This script works with the existing table structure and only adds missing columns

-- Work with existing table instead of dropping it
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add image_title if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_images' AND column_name = 'image_title'
    ) THEN
        ALTER TABLE property_images ADD COLUMN image_title TEXT;
    END IF;

    -- Add image_description if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_images' AND column_name = 'image_description'
    ) THEN
        ALTER TABLE property_images ADD COLUMN image_description TEXT;
    END IF;

    -- Add url column if it doesn't exist (some tables might have image_url instead)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_images' AND column_name = 'url'
    ) THEN
        -- Check if we need to rename or add
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'property_images' AND column_name = 'image_url'
        ) THEN
            -- Rename image_url to url for consistency
            ALTER TABLE property_images RENAME COLUMN image_url TO url;
        END IF;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON property_images(display_order);
CREATE INDEX IF NOT EXISTS idx_property_images_is_main ON property_images(is_main);

-- Create unique constraint for main images (only one main per property)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_property_images_unique_main'
    ) THEN
        CREATE UNIQUE INDEX idx_property_images_unique_main 
        ON property_images(property_id) WHERE is_main = true;
    END IF;
END $$;

-- Success message
SELECT 'Property images table updated successfully' AS status;
