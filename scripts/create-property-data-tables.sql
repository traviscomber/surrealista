-- Create import_batches table for tracking imports
CREATE TABLE IF NOT EXISTS import_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT NOT NULL,
  file_name TEXT,
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  import_status TEXT DEFAULT 'pending',
  error_log TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add import_source column to import_batches table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'import_batches' AND column_name = 'import_source') THEN
        ALTER TABLE import_batches ADD COLUMN import_source TEXT DEFAULT 'manual';
    END IF;
END $$;

-- Add missing columns to properties table if they don't exist
DO $$ 
BEGIN
    -- Add data_quality_score column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'data_quality_score') THEN
        ALTER TABLE properties ADD COLUMN data_quality_score INTEGER DEFAULT 0;
    END IF;
    
    -- Add import_batch_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'import_batch_id') THEN
        ALTER TABLE properties ADD COLUMN import_batch_id UUID;
    END IF;
    
    -- Add import_source column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'import_source') THEN
        ALTER TABLE properties ADD COLUMN import_source TEXT DEFAULT 'manual';
    END IF;
    
    -- Add contact_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'contact_name') THEN
        ALTER TABLE properties ADD COLUMN contact_name TEXT;
    END IF;
    
    -- Add contact_phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'contact_phone') THEN
        ALTER TABLE properties ADD COLUMN contact_phone TEXT;
    END IF;
    
    -- Add contact_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'contact_email') THEN
        ALTER TABLE properties ADD COLUMN contact_email TEXT;
    END IF;
    
    -- Add property_rol column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'property_rol') THEN
        ALTER TABLE properties ADD COLUMN property_rol TEXT;
    END IF;
    
    -- Add water_rights column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'water_rights') THEN
        ALTER TABLE properties ADD COLUMN water_rights BOOLEAN DEFAULT false;
    END IF;
    
    -- Add owner_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'owner_name') THEN
        ALTER TABLE properties ADD COLUMN owner_name TEXT;
    END IF;
    
    -- Add region column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'region') THEN
        ALTER TABLE properties ADD COLUMN region TEXT;
    END IF;
    
    -- Add address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'address') THEN
        ALTER TABLE properties ADD COLUMN address TEXT;
    END IF;
    
    -- Add city column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'city') THEN
        ALTER TABLE properties ADD COLUMN city TEXT;
    END IF;
    
    -- Add square_meters column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'square_meters') THEN
        ALTER TABLE properties ADD COLUMN square_meters INTEGER;
    END IF;
    
    -- Add lot_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lot_size') THEN
        ALTER TABLE properties ADD COLUMN lot_size INTEGER;
    END IF;
    
    -- Add bedrooms column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bedrooms') THEN
        ALTER TABLE properties ADD COLUMN bedrooms INTEGER DEFAULT 0;
    END IF;
    
    -- Add bathrooms column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bathrooms') THEN
        ALTER TABLE properties ADD COLUMN bathrooms INTEGER DEFAULT 0;
    END IF;
    
    -- Add year_built column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'year_built') THEN
        ALTER TABLE properties ADD COLUMN year_built INTEGER;
    END IF;
END $$;

-- Add foreign key constraint for import_batch_id after both tables exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_properties_import_batch'
    ) THEN
        ALTER TABLE properties 
        ADD CONSTRAINT fk_properties_import_batch 
        FOREIGN KEY (import_batch_id) REFERENCES import_batches(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_data_quality ON properties(data_quality_score);
CREATE INDEX IF NOT EXISTS idx_properties_import_batch ON properties(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region);
CREATE INDEX IF NOT EXISTS idx_properties_water_rights ON properties(water_rights);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(import_status);

-- Insert sample data for testing
INSERT INTO import_batches (batch_name, import_source, import_status) 
VALUES ('Sample Google Sheets Import', 'google_sheets', 'completed')
ON CONFLICT DO NOTHING;

-- Update existing properties with sample data
UPDATE properties 
SET 
    contact_name = 'Cristian Covarrubias',
    contact_phone = '+56994368627',
    contact_email = 'c.covarrubiasf@exportsur.com',
    property_rol = '254-02 / 254-34 / 254-86',
    water_rights = true,
    owner_name = 'Cristian Covarrubias',
    region = 'Metropolitana',
    data_quality_score = 95,
    import_source = 'google_sheets_sample'
WHERE title LIKE '%Fundo%' OR title LIKE '%Casa%';
