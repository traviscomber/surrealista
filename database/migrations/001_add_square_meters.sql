-- Creating migration for square meters column
-- Migration: Add square meters column to properties
-- Version: 001
-- Date: 2024-01-15

-- Add square_meters column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'square_meters'
    ) THEN
        ALTER TABLE properties ADD COLUMN square_meters DECIMAL;
    END IF;
END $$;

-- Update existing records to copy area to square_meters
UPDATE properties 
SET square_meters = area 
WHERE square_meters IS NULL AND area IS NOT NULL;
