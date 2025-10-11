-- Use CREATE POLICY IF NOT EXISTS to avoid "already exists" error
-- Add roll number field to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Create index for roll number searches
CREATE INDEX IF NOT EXISTS idx_properties_roll_number ON properties(roll_number);

-- Create table to track roll number lookups
CREATE TABLE IF NOT EXISTS roll_number_lookups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    roll_number TEXT NOT NULL,
    coordinates POINT,
    address TEXT,
    city TEXT,
    region TEXT,
    lookup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT DEFAULT 'government_api',
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_roll_lookups_number ON roll_number_lookups(roll_number);
CREATE INDEX IF NOT EXISTS idx_roll_lookups_date ON roll_number_lookups(lookup_date);

-- Add RLS policies
ALTER TABLE roll_number_lookups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view roll lookups" ON roll_number_lookups;
DROP POLICY IF EXISTS "Allow authenticated users to insert roll lookups" ON roll_number_lookups;

-- Create policies
CREATE POLICY "Allow authenticated users to view roll lookups" ON roll_number_lookups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert roll lookups" ON roll_number_lookups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
