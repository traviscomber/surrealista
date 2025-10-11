-- Create property_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    -- Changed image_url to url to match existing database schema
    url TEXT NOT NULL,
    image_title TEXT,
    image_description TEXT,
    display_order INTEGER DEFAULT 0,
    -- Changed is_primary to is_main to match existing database schema
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns to property_images table
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS image_title TEXT;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS image_description TEXT;

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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_property_images_updated_at ON property_images;
CREATE TRIGGER update_property_images_updated_at BEFORE UPDATE ON property_images FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample data if properties exist
DO $$
DECLARE
    prop_record RECORD;
BEGIN
    -- Only insert sample images if we have properties and no images exist
    IF EXISTS (SELECT 1 FROM properties) AND NOT EXISTS (SELECT 1 FROM property_images) THEN
        FOR prop_record IN SELECT id, images FROM properties WHERE images IS NOT NULL AND array_length(images, 1) > 0 LOOP
            -- Insert images from the images array in properties table
            FOR i IN 1..array_length(prop_record.images, 1) LOOP
                -- Changed image_url to url and is_primary to is_main
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
-- Updated comment to reference url column
COMMENT ON COLUMN property_images.url IS 'URL or path to the image file';
COMMENT ON COLUMN property_images.display_order IS 'Order in which images should be displayed (0-based)';
-- Updated comment to reference is_main column
COMMENT ON COLUMN property_images.is_main IS 'Whether this is the main/featured image for the property';
