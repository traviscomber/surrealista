-- Restaurar columna coordinates en kmz_collection
-- Esta columna contiene las ubicaciones extraídas de cada KMZ

-- Agregar la columna coordinates si no existe
ALTER TABLE kmz_collection
ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '[]'::jsonb;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_kmz_collection_coordinates 
ON kmz_collection USING GIN (coordinates);

-- Actualizar statistics
ANALYZE kmz_collection;

SELECT 
  id,
  file_name,
  region,
  JSONB_ARRAY_LENGTH(COALESCE(coordinates, '[]'::jsonb)) as location_count
FROM kmz_collection
LIMIT 10;
