-- Creating database helper functions
-- Database helper functions for property management
-- Version: 001

-- Function to calculate property price per square meter
CREATE OR REPLACE FUNCTION calculate_price_per_sqm(property_price BIGINT, property_area DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF property_area IS NULL OR property_area = 0 THEN
        RETURN NULL;
    END IF;
    RETURN property_price / property_area;
END;
$$ LANGUAGE plpgsql;

-- Function to get properties within radius
CREATE OR REPLACE FUNCTION get_properties_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price BIGINT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.price,
        ST_Distance(
            ST_Point(center_lng, center_lat)::geography,
            ST_Point(ST_X(p.coordinates), ST_Y(p.coordinates))::geography
        ) / 1000 AS distance_km
    FROM properties p
    WHERE p.coordinates IS NOT NULL
    AND ST_DWithin(
        ST_Point(center_lng, center_lat)::geography,
        ST_Point(ST_X(p.coordinates), ST_Y(p.coordinates))::geography,
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
