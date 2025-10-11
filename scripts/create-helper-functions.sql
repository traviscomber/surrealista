-- Create helper function to get table columns information
CREATE OR REPLACE FUNCTION get_table_columns(table_name_param TEXT)
RETURNS TABLE(
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    column_default TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        c.column_default::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = table_name_param
    AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to format price in Chilean pesos
CREATE OR REPLACE FUNCTION format_clp_price(price NUMERIC)
RETURNS TEXT AS $$
BEGIN
    IF price >= 1000000000 THEN
        RETURN ROUND(price / 1000000000.0, 1) || 'B CLP';
    ELSIF price >= 1000000 THEN
        RETURN ROUND(price / 1000000.0, 0) || 'M CLP';
    ELSIF price >= 1000 THEN
        RETURN ROUND(price / 1000.0, 0) || 'K CLP';
    ELSE
        RETURN price || ' CLP';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate property age
CREATE OR REPLACE FUNCTION calculate_property_age(year_built INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF year_built IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN EXTRACT(YEAR FROM CURRENT_DATE) - year_built;
END;
$$ LANGUAGE plpgsql;

-- Function to get properties within distance
CREATE OR REPLACE FUNCTION get_properties_within_distance(
    center_lat NUMERIC,
    center_lng NUMERIC,
    max_distance_km NUMERIC DEFAULT 10
)
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    price NUMERIC,
    distance_km NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.price,
        (6371 * acos(
            cos(radians(center_lat)) * 
            cos(radians(p.latitude)) * 
            cos(radians(p.longitude) - radians(center_lng)) + 
            sin(radians(center_lat)) * 
            sin(radians(p.latitude))
        )) as distance_km
    FROM properties p
    WHERE p.latitude IS NOT NULL 
      AND p.longitude IS NOT NULL
      AND p.status = 'active'
      AND (6371 * acos(
            cos(radians(center_lat)) * 
            cos(radians(p.latitude)) * 
            cos(radians(p.longitude) - radians(center_lng)) + 
            sin(radians(center_lat)) * 
            sin(radians(p.latitude))
          )) <= max_distance_km
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to get property statistics by region
CREATE OR REPLACE FUNCTION get_region_stats(region_name TEXT)
RETURNS TABLE(
    total_properties BIGINT,
    avg_price NUMERIC,
    min_price NUMERIC,
    max_price NUMERIC,
    avg_bedrooms NUMERIC,
    avg_square_meters NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_properties,
        ROUND(AVG(p.price), 0) as avg_price,
        MIN(p.price) as min_price,
        MAX(p.price) as max_price,
        ROUND(AVG(p.bedrooms), 1) as avg_bedrooms,
        ROUND(AVG(p.square_meters), 0) as avg_square_meters
    FROM properties p
    WHERE p.region = region_name
      AND p.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function for full text search in Spanish
CREATE OR REPLACE FUNCTION search_properties(search_term TEXT)
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    description TEXT,
    price NUMERIC,
    location TEXT,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.location,
        (
            CASE WHEN p.title ILIKE '%' || search_term || '%' THEN 3.0 ELSE 0.0 END +
            CASE WHEN p.description ILIKE '%' || search_term || '%' THEN 2.0 ELSE 0.0 END +
            CASE WHEN p.location ILIKE '%' || search_term || '%' THEN 2.5 ELSE 0.0 END +
            CASE WHEN p.city ILIKE '%' || search_term || '%' THEN 2.0 ELSE 0.0 END +
            CASE WHEN p.region ILIKE '%' || search_term || '%' THEN 1.5 ELSE 0.0 END +
            CASE WHEN array_to_string(p.amenities, ' ') ILIKE '%' || search_term || '%' THEN 1.0 ELSE 0.0 END
        ) AS relevance
    FROM properties p
    WHERE p.status = 'active'
      AND (
        p.title ILIKE '%' || search_term || '%' OR
        p.description ILIKE '%' || search_term || '%' OR
        p.location ILIKE '%' || search_term || '%' OR
        p.city ILIKE '%' || search_term || '%' OR
        p.region ILIKE '%' || search_term || '%' OR
        array_to_string(p.amenities, ' ') ILIKE '%' || search_term || '%'
      )
    ORDER BY relevance DESC, p.featured DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar properties
CREATE OR REPLACE FUNCTION find_similar_properties(
    property_id BIGINT,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    price NUMERIC,
    similarity_score NUMERIC
) AS $$
DECLARE
    ref_property RECORD;
BEGIN
    -- Get reference property details
    SELECT * INTO ref_property 
    FROM properties 
    WHERE properties.id = property_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.price,
        (
            -- Property type match (40% weight)
            CASE WHEN p.property_type = ref_property.property_type THEN 40 ELSE 0 END +
            -- Region match (25% weight)
            CASE WHEN p.region = ref_property.region THEN 25 ELSE 0 END +
            -- Price similarity (20% weight)
            CASE 
                WHEN ABS(p.price - ref_property.price) / ref_property.price <= 0.2 THEN 20
                WHEN ABS(p.price - ref_property.price) / ref_property.price <= 0.5 THEN 10
                ELSE 0 
            END +
            -- Bedroom similarity (10% weight)
            CASE 
                WHEN p.bedrooms = ref_property.bedrooms THEN 10
                WHEN ABS(p.bedrooms - ref_property.bedrooms) <= 1 THEN 5
                ELSE 0 
            END +
            -- Size similarity (5% weight)
            CASE 
                WHEN p.square_meters IS NOT NULL AND ref_property.square_meters IS NOT NULL THEN
                    CASE 
                        WHEN ABS(p.square_meters - ref_property.square_meters) / ref_property.square_meters <= 0.3 THEN 5
                        ELSE 0 
                    END
                ELSE 0
            END
        ) AS similarity_score
    FROM properties p
    WHERE p.id != property_id
      AND p.status = 'active'
    ORDER BY similarity_score DESC, p.featured DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get table schema information (for verification)
CREATE OR REPLACE FUNCTION get_table_schema(table_name TEXT)
RETURNS TABLE(
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = get_table_schema.table_name
      AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_property_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.location, '')), 'C') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.region, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add search vector column if it doesn't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_properties_search_vector ON properties USING gin(search_vector);

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS update_property_search_vector_trigger ON properties;
CREATE TRIGGER update_property_search_vector_trigger
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_property_search_vector();

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_properties_search_title ON properties USING gin(to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_properties_search_description ON properties USING gin(to_tsvector('spanish', description));
CREATE INDEX IF NOT EXISTS idx_properties_search_location ON properties USING gin(to_tsvector('spanish', location));
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_region_price ON properties(region, price);
CREATE INDEX IF NOT EXISTS idx_properties_type_bedrooms ON properties(property_type, bedrooms);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION format_clp_price(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION format_clp_price(NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION calculate_property_age(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_property_age(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_properties_within_distance(NUMERIC, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_properties_within_distance(NUMERIC, NUMERIC, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION get_region_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_region_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION search_properties(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_properties(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION find_similar_properties(BIGINT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_properties(BIGINT, INTEGER) TO anon;
