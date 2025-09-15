-- Add comprehensive property data columns to sii_coordinate_extractions table
ALTER TABLE sii_coordinate_extractions 
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS surface_area INTEGER,
ADD COLUMN IF NOT EXISTS built_area INTEGER,
ADD COLUMN IF NOT EXISTS tax_valuation INTEGER,
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS ownership_type TEXT,
ADD COLUMN IF NOT EXISTS zoning TEXT,
ADD COLUMN IF NOT EXISTS utilities JSONB;

-- Add indexes for better query performance on new fields
CREATE INDEX IF NOT EXISTS idx_sii_extractions_property_type ON sii_coordinate_extractions(property_type);
CREATE INDEX IF NOT EXISTS idx_sii_extractions_surface_area ON sii_coordinate_extractions(surface_area);
CREATE INDEX IF NOT EXISTS idx_sii_extractions_tax_valuation ON sii_coordinate_extractions(tax_valuation);
CREATE INDEX IF NOT EXISTS idx_sii_extractions_zoning ON sii_coordinate_extractions(zoning);

-- Update the trigger function to handle comprehensive property data
CREATE OR REPLACE FUNCTION update_property_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if we have valid coordinates and roll_number
  IF NEW.coordinates IS NOT NULL AND NEW.roll_number IS NOT NULL THEN
    INSERT INTO properties (
      roll_number, 
      title,
      price,
      coordinates, 
      address, 
      city, 
      region,
      property_type,
      surface_area,
      built_area,
      tax_valuation,
      year_built,
      ownership_type,
      zoning,
      utilities,
      created_at, 
      updated_at
    ) VALUES (
      NEW.roll_number,
      COALESCE(NEW.address, 'Propiedad ' || NEW.roll_number),
      COALESCE(NEW.tax_valuation, 0),
      NEW.coordinates,
      NEW.address,
      NEW.city,
      NEW.region,
      NEW.property_type,
      NEW.surface_area,
      NEW.built_area,
      NEW.tax_valuation,
      NEW.year_built,
      NEW.ownership_type,
      NEW.zoning,
      NEW.utilities,
      NOW(),
      NOW()
    )
    ON CONFLICT (roll_number) DO UPDATE SET
      coordinates = EXCLUDED.coordinates,
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      region = EXCLUDED.region,
      property_type = EXCLUDED.property_type,
      surface_area = EXCLUDED.surface_area,
      built_area = EXCLUDED.built_area,
      tax_valuation = EXCLUDED.tax_valuation,
      year_built = EXCLUDED.year_built,
      ownership_type = EXCLUDED.ownership_type,
      zoning = EXCLUDED.zoning,
      utilities = EXCLUDED.utilities,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Error updating properties table: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comprehensive property data columns to properties table if they don't exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS surface_area INTEGER,
ADD COLUMN IF NOT EXISTS built_area INTEGER,
ADD COLUMN IF NOT EXISTS tax_valuation INTEGER,
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS ownership_type TEXT,
ADD COLUMN IF NOT EXISTS zoning TEXT,
ADD COLUMN IF NOT EXISTS utilities JSONB;

-- Add indexes for better query performance on properties table
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_surface_area ON properties(surface_area);
CREATE INDEX IF NOT EXISTS idx_properties_tax_valuation ON properties(tax_valuation);
CREATE INDEX IF NOT EXISTS idx_properties_zoning ON properties(zoning);

-- Add comments to document the enhanced schema
COMMENT ON COLUMN sii_coordinate_extractions.property_type IS 'Type of property: Casa, Departamento, Terreno, etc.';
COMMENT ON COLUMN sii_coordinate_extractions.surface_area IS 'Total surface area in square meters';
COMMENT ON COLUMN sii_coordinate_extractions.built_area IS 'Built area in square meters';
COMMENT ON COLUMN sii_coordinate_extractions.tax_valuation IS 'Tax valuation in Chilean pesos';
COMMENT ON COLUMN sii_coordinate_extractions.year_built IS 'Year the property was built';
COMMENT ON COLUMN sii_coordinate_extractions.ownership_type IS 'Type of ownership: Individual, Copropiedad, etc.';
COMMENT ON COLUMN sii_coordinate_extractions.zoning IS 'Zoning classification: Residencial, Comercial, etc.';
COMMENT ON COLUMN sii_coordinate_extractions.utilities IS 'Available utilities as JSON object';
