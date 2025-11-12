-- Migración: Renombrar columna kmx_references a kmz_references para reflejar el formato correcto de archivos geográficos

-- Verificar si la columna kmx_references existe antes de renombrar
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'kmx_references'
    ) THEN
        -- Renombrar la columna
        ALTER TABLE documents RENAME COLUMN kmx_references TO kmz_references;
        
        -- Eliminar índice antiguo si existe
        DROP INDEX IF EXISTS idx_documents_kmx_references;
        
        -- Crear nuevo índice con el nombre correcto
        CREATE INDEX IF NOT EXISTS idx_documents_kmz_references ON documents USING GIN(kmz_references);
        
        RAISE NOTICE 'Columna renombrada de kmx_references a kmz_references exitosamente';
    ELSE
        RAISE NOTICE 'La columna kmx_references no existe, la tabla ya está actualizada';
    END IF;
END $$;

-- Actualizar comentario de la tabla
COMMENT ON TABLE documents IS 'Documentos de Sur-Realista con vinculación a propiedades mediante archivos KMZ/KML (formatos geográficos de Google Earth/Maps)';

-- Actualizar comentario de la columna si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'kmz_references'
    ) THEN
        COMMENT ON COLUMN documents.kmz_references IS 'Referencias a archivos KMZ/KML de campos/propiedades para vinculación geográfica';
    END IF;
END $$;
