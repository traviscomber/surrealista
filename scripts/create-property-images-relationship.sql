-- Create property_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_title TEXT,
    image_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON property_images(display_order);
CREATE INDEX IF NOT EXISTS idx_property_images_is_primary ON property_images(is_primary);

-- Enable RLS (Row Level Security)
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

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
                INSERT INTO property_images (property_id, image_url, display_order, is_primary)
                VALUES (
                    prop_record.id,
                    prop_record.images[i],
                    i - 1,
                    i = 1  -- First image is primary
                );
            END LOOP;
        END LOOP;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE property_images IS 'Stores individual images for properties with metadata';
COMMENT ON COLUMN property_images.property_id IS 'Foreign key reference to properties table';
COMMENT ON COLUMN property_images.image_url IS 'URL or path to the image file';
COMMENT ON COLUMN property_images.display_order IS 'Order in which images should be displayed (0-based)';
COMMENT ON COLUMN property_images.is_primary IS 'Whether this is the primary/featured image for the property';
