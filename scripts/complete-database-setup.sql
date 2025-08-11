-- Complete database setup script for Sur Realista
-- This script creates all tables and inserts sample data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist to ensure clean setup
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table with ALL required columns
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    location TEXT,
    address TEXT,
    city TEXT,
    region TEXT NOT NULL DEFAULT 'Región Metropolitana',
    country TEXT NOT NULL DEFAULT 'Chile',
    property_type TEXT NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
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
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    property_id UUID REFERENCES properties(id),
    property_title TEXT,
    contact_preference TEXT DEFAULT 'email',
    source TEXT DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    assigned_to UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotations table
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    property_type TEXT NOT NULL,
    budget_min NUMERIC,
    budget_max NUMERIC,
    location_preference TEXT,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_properties_featured ON properties(featured);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_region ON properties(region);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_quotations_status ON quotations(status);

-- Insert admin user
INSERT INTO users (email, name, role) VALUES 
('admin@sur-realista.cl', 'Administrador', 'admin');

-- Insert sample featured properties
INSERT INTO properties (
    title, description, price, location, address, city, region, country, property_type,
    bedrooms, bathrooms, square_meters, lot_size, year_built, status, featured, images, amenities, latitude, longitude
) VALUES 
(
    'Casa de Lujo Frente al Lago Villarrica',
    'Espectacular casa de lujo con vista panorámica al lago Villarrica y volcán. Diseño moderno con acabados premium, acceso privado al lago y muelle propio.',
    650000000,
    'Orilla del Lago',
    'Camino Villarrica-Pucón Km 15',
    'Pucón',
    'Región de la Araucanía',
    'Chile',
    'casa',
    4,
    3,
    280,
    1200,
    2020,
    'active',
    true,
    ARRAY['/images/property-pucon-real.png', '/images/property-sample-1.png'],
    ARRAY['Vista al lago', 'Muelle privado', 'Jardín', 'Chimenea', 'Terraza'],
    -39.2706,
    -71.9728
),
(
    'Cabaña Premium con Vista al Volcán Osorno',
    'Cabaña de lujo con arquitectura tradicional alemana y vistas espectaculares al volcán Osorno. Ubicada en zona exclusiva con acceso a playa privada.',
    480000000,
    'Costanera',
    'Av. Costanera 1250',
    'Puerto Varas',
    'Región de Los Lagos',
    'Chile',
    'cabaña',
    3,
    2,
    220,
    800,
    2019,
    'active',
    true,
    ARRAY['/images/property-puerto-varas.png', '/images/property-sample-2.png'],
    ARRAY['Vista al volcán', 'Playa privada', 'Sauna', 'Quincho', 'Estacionamiento'],
    -41.3317,
    -72.9828
),
(
    'Casa Patrimonial Restaurada en Castro',
    'Hermosa casa patrimonial completamente restaurada con vista al mar. Arquitectura típica chilota con todas las comodidades modernas.',
    380000000,
    'Centro Histórico',
    'Calle Esmeralda 567',
    'Castro',
    'Región de Los Lagos',
    'Chile',
    'casa',
    5,
    3,
    320,
    600,
    1920,
    'active',
    true,
    ARRAY['/images/property-chiloe.png', '/images/property-sample-3.png'],
    ARRAY['Patrimonio histórico', 'Vista al mar', 'Jardín amplio', 'Bodega', 'Calefacción central'],
    -42.4827,
    -73.7615
),
(
    'Parcela de Agrado con Casa en Valdivia',
    'Hermosa parcela de 2 hectáreas con casa principal y cabaña de huéspedes. Ideal para vida de campo cerca de la ciudad.',
    290000000,
    'Sector Rural',
    'Camino a Niebla Km 8',
    'Valdivia',
    'Región de Los Ríos',
    'Chile',
    'parcela',
    3,
    2,
    150,
    20000,
    2015,
    'active',
    true,
    ARRAY['/images/property-valdivia.png', '/images/property-sample-4.png'],
    ARRAY['2 hectáreas', 'Casa de huéspedes', 'Huerto', 'Pozo propio', 'Galpón'],
    -39.8142,
    -73.2459
),
(
    'Casa Moderna en Frutillar Alto',
    'Casa de diseño contemporáneo con vista panorámica al lago Llanquihue y volcanes. Construcción nueva con tecnología sustentable.',
    520000000,
    'Frutillar Alto',
    'Av. Philippi 890',
    'Frutillar',
    'Región de Los Lagos',
    'Chile',
    'casa',
    4,
    3,
    250,
    1000,
    2022,
    'active',
    true,
    ARRAY['/images/property-frutillar.png', '/images/property-sample-5.png'],
    ARRAY['Vista panorámica', 'Paneles solares', 'Domótica', 'Piscina', 'Quincho techado'],
    -41.1281,
    -73.0306
),
(
    'Terreno Comercial Centro Osorno',
    'Excelente terreno comercial en el centro de Osorno. Ideal para desarrollo inmobiliario o proyecto comercial.',
    180000000,
    'Centro',
    'Av. Juan Mackenna 1100',
    'Osorno',
    'Región de Los Lagos',
    'Chile',
    'terreno',
    0,
    0,
    0,
    800,
    NULL,
    'active',
    true,
    ARRAY['/images/property-osorno.png', '/images/property-sample-6.png'],
    ARRAY['Uso comercial', 'Esquina', 'Todos los servicios', 'Transporte público', 'Alta plusvalía'],
    -40.5736,
    -73.1353
);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- Show results
SELECT 'Database setup complete!' as status;
SELECT 'Properties inserted: ' || COUNT(*) as result FROM properties;
SELECT 'Featured properties: ' || COUNT(*) as result FROM properties WHERE featured = true;
SELECT 'Users created: ' || COUNT(*) as result FROM users;

-- Final verification
SELECT 'Verification: featured column exists: ' || 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'properties' AND column_name = 'featured'
       ) THEN 'YES' ELSE 'NO' END as verification;
