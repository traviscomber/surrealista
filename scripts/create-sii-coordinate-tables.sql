-- Create tables for SII coordinate extraction functionality

-- Table to store SII coordinate extractions
CREATE TABLE IF NOT EXISTS sii_coordinate_extractions (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    coordinates JSONB NOT NULL,
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'sii_website',
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to log all coordinate extraction attempts
CREATE TABLE IF NOT EXISTS coordinate_extraction_log (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    coordinates JSONB,
    source VARCHAR(50),
    extracted_at TIMESTAMP WITH TIME ZONE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sii_extractions_roll ON sii_coordinate_extractions(roll_number);
CREATE INDEX IF NOT EXISTS idx_sii_extractions_created ON sii_coordinate_extractions(created_at);
CREATE INDEX IF NOT EXISTS idx_extraction_log_roll ON coordinate_extraction_log(roll_number);
CREATE INDEX IF NOT EXISTS idx_extraction_log_date ON coordinate_extraction_log(saved_at);

-- Add coordinate columns to properties table if they don't exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS coordinate_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS coordinate_extracted_at TIMESTAMP WITH TIME ZONE;

-- Create function to update coordinates from SII data
CREATE OR REPLACE FUNCTION update_property_coordinates()
RETURNS TRIGGER AS $$
BEGIN
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update properties when coordinates are extracted
DROP TRIGGER IF EXISTS trigger_update_property_coordinates ON sii_coordinate_extractions;
CREATE TRIGGER trigger_update_property_coordinates
    AFTER INSERT OR UPDATE ON sii_coordinate_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_property_coordinates();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON sii_coordinate_extractions TO authenticated;
GRANT SELECT, INSERT ON coordinate_extraction_log TO authenticated;
GRANT USAGE ON SEQUENCE sii_coordinate_extractions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE coordinate_extraction_log_id_seq TO authenticated;
