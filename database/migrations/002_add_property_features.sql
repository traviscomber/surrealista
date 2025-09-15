-- Creating migration for property features
-- Migration: Add property features and amenities
-- Version: 002
-- Date: 2024-01-20

-- Add features columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'features'
    ) THEN
        ALTER TABLE properties ADD COLUMN features JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'amenities'
    ) THEN
        ALTER TABLE properties ADD COLUMN amenities JSONB DEFAULT '[]';
    END IF;
END $$;

-- Create index for features search
CREATE INDEX IF NOT EXISTS idx_properties_features ON properties USING GIN (features);
