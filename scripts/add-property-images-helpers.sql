-- Helper views and functions for property_images table
-- Run this AFTER create-property-images-table.sql

-- Drop view if exists to recreate it
DROP VIEW IF EXISTS properties_with_images;

-- Use is_main instead of is_primary to match actual schema
-- Create view for properties with their images
CREATE OR REPLACE VIEW properties_with_images AS
SELECT 
    p.*,
    pi.main_image_url,
    pi.total_images
FROM properties p
LEFT JOIN (
    SELECT 
        property_id,
        MAX(CASE WHEN is_main = true THEN url END) as main_image_url,
        COUNT(*) as total_images
    FROM property_images
    GROUP BY property_id
) pi ON p.id = pi.property_id;

-- Grant permissions on view
GRANT SELECT ON properties_with_images TO authenticated;

-- Success message
SELECT 'Property images helper views created successfully' AS status;
