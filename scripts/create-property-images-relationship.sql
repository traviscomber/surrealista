-- Create property_images table if it doesn't exist (matching actual schema)
CREATE TABLE IF NOT EXISTS property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url CHARACTER VARYING NOT NULL,
    file_type TEXT,
    alt_text TEXT,
    image_title TEXT,
    image_description TEXT,
    height INTEGER,
    width INTEGER,
    file_size INTEGER,
    display_order INTEGER DEFAULT 0,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Add is_main column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_images' 
        AND column_name = 'is_main'
    ) THEN
        ALTER TABLE property_images ADD COLUMN is_main BOOLEAN DEFAULT false;
    END IF;
    
    -- Add display_order column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_images' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE property_images ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON property_images(display_order);
CREATE INDEX IF NOT EXISTS idx_property_images_is_main ON property_images(is_main);

-- Enable RLS (Row Level Security)
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON property_images;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON property_images;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON property_images;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON property_images;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON property_images FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON property_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON property_images FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON property_images FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample data using correct column names (url instead of image_url, is_main instead of is_primary)
DO $$
DECLARE
    prop_record RECORD;
BEGIN
    -- Only insert sample images if we have properties and no images exist
    IF EXISTS (SELECT 1 FROM properties) AND NOT EXISTS (SELECT 1 FROM property_images) THEN
        FOR prop_record IN SELECT id, images FROM properties WHERE images IS NOT NULL AND array_length(images, 1) > 0 LOOP
            -- Insert images from the images array in properties table
            FOR i IN 1..array_length(prop_record.images, 1) LOOP
                INSERT INTO property_images (property_id, url, display_order, is_main)
                VALUES (
                    prop_record.id,
                    prop_record.images[i],
                    i - 1,
                    i = 1  -- First image is main
                );
            END LOOP;
        END LOOP;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE property_images IS 'Stores individual images for properties with metadata';
COMMENT ON COLUMN property_images.property_id IS 'Foreign key reference to properties table';
COMMENT ON COLUMN property_images.url IS 'URL or path to the image file';
COMMENT ON COLUMN property_images.display_order IS 'Order in which images should be displayed (0-based)';
COMMENT ON COLUMN property_images.is_main IS 'Whether this is the main/featured image for the property';
