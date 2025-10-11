-- Create property_images table with full relationship support
CREATE TABLE IF NOT EXISTS property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE, -- Changed property_id from UUID to BIGINT to match properties.id type
    url TEXT NOT NULL,
    image_title TEXT,
    image_description TEXT,
    display_order INTEGER DEFAULT 1,
    is_main BOOLEAN DEFAULT false,
    file_size INTEGER,
    file_type TEXT,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing table
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS image_title TEXT;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS image_description TEXT;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON property_images(display_order);
CREATE INDEX IF NOT EXISTS idx_property_images_is_main ON property_images(is_main);

-- Ensure only one main image per property
DROP INDEX IF EXISTS idx_property_images_unique_primary;
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_unique_main 
ON property_images(property_id) WHERE is_main = true;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_property_images_updated_at ON property_images;
CREATE TRIGGER trigger_update_property_images_updated_at
    BEFORE UPDATE ON property_images
    FOR EACH ROW
    EXECUTE FUNCTION update_property_images_updated_at();

-- Create view for properties with their images
CREATE OR REPLACE VIEW properties_with_images AS
SELECT 
    p.*,
    pi.primary_image_url,
    pi.total_images
FROM properties p
LEFT JOIN (
    SELECT 
        property_id,
        MAX(CASE WHEN is_main = true THEN url END) as primary_image_url,
        COUNT(*) as total_images
    FROM property_images
    GROUP BY property_id
) pi ON p.id = pi.property_id;

-- Create summary view for property images
CREATE OR REPLACE VIEW property_images_summary AS
SELECT 
    p.id as property_id,
    p.title as property_title,
    COUNT(pi.id) as total_images,
    COUNT(CASE WHEN pi.is_main = true THEN 1 END) as main_images,
    STRING_AGG(pi.url, ', ' ORDER BY pi.display_order) as all_image_urls
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id, p.title;

-- Create function to get property with images as JSON
CREATE OR REPLACE FUNCTION get_property_with_images(property_bigint BIGINT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'property', row_to_json(p),
        'images', COALESCE(
            json_agg(
                json_build_object(
                    'id', pi.id,
                    'url', pi.url,
                    'title', pi.image_title,
                    'description', pi.image_description,
                    'display_order', pi.display_order,
                    'is_main', pi.is_main,
                    'alt_text', pi.alt_text
                ) ORDER BY pi.display_order
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
        )
    ) INTO result
    FROM properties p
    LEFT JOIN property_images pi ON p.id = pi.property_id
    WHERE p.id = property_bigint
    GROUP BY p.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert sample images for existing properties (only if none exist)
DO $$
DECLARE
    prop_record RECORD;
    image_counter INTEGER := 1;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM property_images LIMIT 1) THEN
        FOR prop_record IN 
            SELECT id, title FROM properties LIMIT 6
        LOOP
            INSERT INTO property_images (
                property_id, 
                url, 
                image_title, 
                display_order, 
                is_main,
                alt_text
            ) VALUES (
                prop_record.id,
                '/images/property-sample-' || image_counter || '.png',
                'Vista principal - ' || COALESCE(prop_record.title, 'Propiedad'),
                1,
                true,
                'Vista principal de ' || COALESCE(prop_record.title, 'la propiedad')
            );
            
            INSERT INTO property_images (
                property_id, 
                url, 
                image_title, 
                display_order, 
                is_main,
                alt_text
            ) VALUES 
            (
                prop_record.id,
                '/images/property-detail-' || image_counter || '-1.png',
                'Vista aérea - ' || COALESCE(prop_record.title, 'Propiedad'),
                2,
                false,
                'Vista aérea de ' || COALESCE(prop_record.title, 'la propiedad')
            ),
            (
                prop_record.id,
                '/images/property-detail-' || image_counter || '-2.png',
                'Detalles interiores - ' || COALESCE(prop_record.title, 'Propiedad'),
                3,
                false,
                'Detalles interiores de ' || COALESCE(prop_record.title, 'la propiedad')
            );
            
            image_counter := image_counter + 1;
        END LOOP;
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON property_images TO authenticated;
GRANT SELECT ON properties_with_images TO authenticated;
GRANT SELECT ON property_images_summary TO authenticated;

-- Add helpful comments
COMMENT ON TABLE property_images IS 'Stores images associated with properties, supporting multiple images per property with ordering and main image designation';
COMMENT ON COLUMN property_images.display_order IS 'Order in which images should be displayed (1 = first)';
COMMENT ON COLUMN property_images.is_main IS 'Indicates if this is the main/featured image for the property';
COMMENT ON VIEW properties_with_images IS 'Convenient view that joins properties with their image information';
COMMENT ON FUNCTION get_property_with_images(BIGINT) IS 'Returns a property with all its images as a JSON object';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Property images table updated successfully with:';
    RAISE NOTICE '- Full relationship support with properties table';
    RAISE NOTICE '- Performance indexes on key columns';
    RAISE NOTICE '- Unique constraint for main images';
    RAISE NOTICE '- Automatic timestamp updates';
    RAISE NOTICE '- Helper views and functions';
    RAISE NOTICE '- Sample data inserted for existing properties (if needed)';
END $$;
