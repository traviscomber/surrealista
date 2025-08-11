-- Sur Realista Database Schema
-- Creates all required tables, indexes, and security policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Chile',
    property_type TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    square_meters NUMERIC,
    lot_size NUMERIC,
    year_built INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    featured BOOLEAN NOT NULL DEFAULT false,
    images TEXT[],
    amenities TEXT[],
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    property_id BIGINT REFERENCES properties(id),
    property_title TEXT,
    contact_preference TEXT DEFAULT 'email',
    source TEXT DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    priority TEXT NOT NULL DEFAULT 'normal',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create security policies

-- Properties policies
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Properties are insertable by authenticated users" ON properties;
CREATE POLICY "Properties are insertable by authenticated users" ON properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Properties are updatable by authenticated users" ON properties;
CREATE POLICY "Properties are updatable by authenticated users" ON properties
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Leads policies
DROP POLICY IF EXISTS "Leads are insertable by everyone" ON leads;
CREATE POLICY "Leads are insertable by everyone" ON leads
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Leads are viewable by authenticated users" ON leads;
CREATE POLICY "Leads are viewable by authenticated users" ON leads
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Leads are updatable by authenticated users" ON leads;
CREATE POLICY "Leads are updatable by authenticated users" ON leads
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Messages policies
DROP POLICY IF EXISTS "Messages are insertable by everyone" ON messages;
CREATE POLICY "Messages are insertable by everyone" ON messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Messages are viewable by authenticated users" ON messages;
CREATE POLICY "Messages are viewable by authenticated users" ON messages
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Messages are updatable by authenticated users" ON messages;
CREATE POLICY "Messages are updatable by authenticated users" ON messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Users policies
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
CREATE POLICY "Users are viewable by authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own record" ON users;
CREATE POLICY "Users can update their own record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Insert sample data to test
INSERT INTO properties (
    title, description, price, location, city, region, property_type,
    bedrooms, bathrooms, square_meters, status, featured
) VALUES 
(
    'Casa de Prueba',
    'Propiedad de prueba para verificar que la tabla funciona correctamente.',
    150000000,
    'Centro',
    'Valdivia',
    'Los Ríos',
    'casa',
    3,
    2,
    120,
    'active',
    true
) ON CONFLICT DO NOTHING;

-- Create helper function to check table schema
CREATE OR REPLACE FUNCTION get_table_schema(table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text
    FROM information_schema.columns c
    WHERE c.table_name = $1
    AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_table_schema(text) TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables created: properties, leads, users, messages';
    RAISE NOTICE 'Indexes created: 12 performance indexes';
    RAISE NOTICE 'Security: RLS enabled with appropriate policies';
    RAISE NOTICE 'Next step: Go to /admin/verificar-esquema to verify';
END $$;
