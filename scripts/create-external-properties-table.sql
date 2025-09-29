-- Crear tabla para almacenar propiedades externas de iChiloe y otros sitios
CREATE TABLE IF NOT EXISTS properties_external (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'ichiloe', 'portalinmobiliario', etc.
  title TEXT NOT NULL,
  price DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'CLP',
  area DECIMAL(10,2),
  location TEXT,
  coordinates JSONB, -- {lat: number, lng: number}
  images TEXT[], -- Array de URLs de imágenes
  description TEXT,
  property_type VARCHAR(50),
  operation VARCHAR(20), -- 'venta', 'arriendo'
  features TEXT[], -- Array de características
  contact_info JSONB, -- {name, phone, email}
  source_url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_properties_external_source ON properties_external(source);
CREATE INDEX IF NOT EXISTS idx_properties_external_location ON properties_external USING GIN(to_tsvector('spanish', location));
CREATE INDEX IF NOT EXISTS idx_properties_external_price ON properties_external(price);
CREATE INDEX IF NOT EXISTS idx_properties_external_area ON properties_external(area);
CREATE INDEX IF NOT EXISTS idx_properties_external_operation ON properties_external(operation);
CREATE INDEX IF NOT EXISTS idx_properties_external_coordinates ON properties_external USING GIN(coordinates);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_properties_external_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_properties_external_updated_at ON properties_external;
CREATE TRIGGER trigger_update_properties_external_updated_at
  BEFORE UPDATE ON properties_external
  FOR EACH ROW
  EXECUTE FUNCTION update_properties_external_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE properties_external IS 'Propiedades extraídas de sitios web externos como iChiloe.cl';
COMMENT ON COLUMN properties_external.external_id IS 'ID único de la propiedad en el sitio externo';
COMMENT ON COLUMN properties_external.source IS 'Sitio web de origen (ichiloe, portalinmobiliario, etc.)';
COMMENT ON COLUMN properties_external.coordinates IS 'Coordenadas GPS en formato {lat: number, lng: number}';
COMMENT ON COLUMN properties_external.features IS 'Características de la propiedad (agua, luz, vista al mar, etc.)';
COMMENT ON COLUMN properties_external.contact_info IS 'Información de contacto en formato {name, phone, email}';
