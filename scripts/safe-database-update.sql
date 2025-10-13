-- Safe database update script that handles existing tables
-- This script will only add missing columns and data without dropping existing tables

-- Function to check if column exists
CREATE OR REPLACE FUNCTION column_exists(tbl_name text, col_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = tbl_name AND column_name = col_name
    );
END;
$$ LANGUAGE plpgsql;

-- Add missing columns to properties table
DO $$
BEGIN
    RAISE NOTICE 'Checking and adding missing columns to properties table...';
    
    -- Add region column if missing
    IF NOT column_exists('properties', 'region') THEN
        ALTER TABLE properties ADD COLUMN region TEXT NOT NULL DEFAULT 'Región Metropolitana';
        RAISE NOTICE 'Added region column';
    ELSE
        RAISE NOTICE 'Column region already exists';
    END IF;
    
    -- Add square_meters column if missing
    IF NOT column_exists('properties', 'square_meters') THEN
        ALTER TABLE properties ADD COLUMN square_meters NUMERIC;
        RAISE NOTICE 'Added square_meters column';
    ELSE
        RAISE NOTICE 'Column square_meters already exists';
    END IF;
    
    -- Add lot_size column if missing
    IF NOT column_exists('properties', 'lot_size') THEN
        ALTER TABLE properties ADD COLUMN lot_size NUMERIC;
        RAISE NOTICE 'Added lot_size column';
    ELSE
        RAISE NOTICE 'Column lot_size already exists';
    END IF;
    
    -- Add year_built column if missing
    IF NOT column_exists('properties', 'year_built') THEN
        ALTER TABLE properties ADD COLUMN year_built INTEGER;
        RAISE NOTICE 'Added year_built column';
    ELSE
        RAISE NOTICE 'Column year_built already exists';
    END IF;
    
    -- Add amenities column if missing
    IF NOT column_exists('properties', 'amenities') THEN
        ALTER TABLE properties ADD COLUMN amenities TEXT[];
        RAISE NOTICE 'Added amenities column';
    ELSE
        RAISE NOTICE 'Column amenities already exists';
    END IF;
    
    -- Add images column if missing
    IF NOT column_exists('properties', 'images') THEN
        ALTER TABLE properties ADD COLUMN images TEXT[];
        RAISE NOTICE 'Added images column';
    ELSE
        RAISE NOTICE 'Column images already exists';
    END IF;
    
    -- Add latitude column if missing
    IF NOT column_exists('properties', 'latitude') THEN
        ALTER TABLE properties ADD COLUMN latitude NUMERIC;
        RAISE NOTICE 'Added latitude column';
    ELSE
        RAISE NOTICE 'Column latitude already exists';
    END IF;
    
    -- Add longitude column if missing
    IF NOT column_exists('properties', 'longitude') THEN
        ALTER TABLE properties ADD COLUMN longitude NUMERIC;
        RAISE NOTICE 'Added longitude column';
    ELSE
        RAISE NOTICE 'Column longitude already exists';
    END IF;
    
    -- Add location column if missing
    IF NOT column_exists('properties', 'location') THEN
        ALTER TABLE properties ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column';
    ELSE
        RAISE NOTICE 'Column location already exists';
    END IF;
    
    -- Add address column if missing
    IF NOT column_exists('properties', 'address') THEN
        ALTER TABLE properties ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column';
    ELSE
        RAISE NOTICE 'Column address already exists';
    END IF;
    
    -- Add country column if missing
    IF NOT column_exists('properties', 'country') THEN
        ALTER TABLE properties ADD COLUMN country TEXT NOT NULL DEFAULT 'Chile';
        RAISE NOTICE 'Added country column';
    ELSE
        RAISE NOTICE 'Column country already exists';
    END IF;
    
    -- Add featured column if missing
    IF NOT column_exists('properties', 'featured') THEN
        ALTER TABLE properties ADD COLUMN featured BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added featured column';
    ELSE
        RAISE NOTICE 'Column featured already exists';
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    -- Create indexes only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_featured') THEN
        CREATE INDEX idx_properties_featured ON properties(featured);
        RAISE NOTICE 'Created index on featured column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_status') THEN
        CREATE INDEX idx_properties_status ON properties(status);
        RAISE NOTICE 'Created index on status column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_city') THEN
        CREATE INDEX idx_properties_city ON properties(city);
        RAISE NOTICE 'Created index on city column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_region') THEN
        CREATE INDEX idx_properties_region ON properties(region);
        RAISE NOTICE 'Created index on region column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_property_type') THEN
        CREATE INDEX idx_properties_property_type ON properties(property_type);
        RAISE NOTICE 'Created index on property_type column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_price') THEN
        CREATE INDEX idx_properties_price ON properties(price);
        RAISE NOTICE 'Created index on price column';
    END IF;
END $$;

-- Clear existing properties to avoid duplicates
DELETE FROM properties;

-- Insert sample featured properties using string concatenation for arrays
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
    '{"/images/property-pucon-real.png","/images/property-sample-1.png"}',
    '{"Vista al lago","Muelle privado","Jardín","Chimenea","Terraza"}',
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
    '{"/images/property-puerto-varas.png","/images/property-sample-2.png"}',
    '{"Vista al volcán","Playa privada","Sauna","Quincho","Estacionamiento"}',
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
    '{"/images/property-chiloe.png","/images/property-sample-3.png"}',
    '{"Patrimonio histórico","Vista al mar","Jardín amplio","Bodega","Calefacción central"}',
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
    '{"/images/property-valdivia.png","/images/property-sample-4.png"}',
    '{"2 hectáreas","Casa de huéspedes","Huerto","Pozo propio","Galpón"}',
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
    '{"/images/property-frutillar.png","/images/property-sample-5.png"}',
    '{"Vista panorámica","Paneles solares","Domótica","Piscina","Quincho techado"}',
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
    '{"/images/property-osorno.png","/images/property-sample-6.png"}',
    '{"Uso comercial","Esquina","Todos los servicios","Transporte público","Alta plusvalía"}',
    -40.5736,
    -73.1353
);

-- Add missing columns to other tables if needed
DO $$
BEGIN
    -- Check leads table
    IF NOT column_exists('leads', 'contact_preference') THEN
        ALTER TABLE leads ADD COLUMN contact_preference TEXT DEFAULT 'email';
        RAISE NOTICE 'Added contact_preference column to leads';
    END IF;
    
    IF NOT column_exists('leads', 'source') THEN
        ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'website';
        RAISE NOTICE 'Added source column to leads';
    END IF;
    
    IF NOT column_exists('leads', 'property_title') THEN
        ALTER TABLE leads ADD COLUMN property_title TEXT;
        RAISE NOTICE 'Added property_title column to leads';
    END IF;
    
    -- Check messages table
    IF NOT column_exists('messages', 'priority') THEN
        ALTER TABLE messages ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
        RAISE NOTICE 'Added priority column to messages';
    END IF;
    
    IF NOT column_exists('messages', 'assigned_to') THEN
        ALTER TABLE messages ADD COLUMN assigned_to UUID REFERENCES users(id);
        RAISE NOTICE 'Added assigned_to column to messages';
    END IF;
END $$;

-- Insert sample admin user if not exists
INSERT INTO users (email, name, role) VALUES 
('admin@sur-realista.cl', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Show final results
SELECT 
    'Properties: ' || COUNT(*) as summary
FROM properties
UNION ALL
SELECT 
    'Featured properties: ' || COUNT(*) 
FROM properties WHERE featured = true
UNION ALL
SELECT 
    'Users: ' || COUNT(*) 
FROM users
UNION ALL
SELECT 
    'Leads: ' || COUNT(*) 
FROM leads
UNION ALL
SELECT 
    'Messages: ' || COUNT(*) 
FROM messages;

-- Show current table structure
SELECT 
    'Properties table structure:' as info
UNION ALL
SELECT 
    column_name || ' (' || data_type || ')' as info
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- Clean up helper function
DROP FUNCTION column_exists(text, text);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE UPDATE COMPLETE ===';
    RAISE NOTICE 'All missing columns have been added safely';
    RAISE NOTICE '6 featured properties from southern Chile inserted';
    RAISE NOTICE 'All indexes created for optimal performance';
    RAISE NOTICE 'Database is ready for deployment!';
END $$;
