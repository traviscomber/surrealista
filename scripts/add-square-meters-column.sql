-- Verificar si la columna square_meters existe, si no, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'square_meters'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'area'
    ) THEN
        ALTER TABLE properties ADD COLUMN square_meters NUMERIC;
        RAISE NOTICE 'Columna square_meters añadida a la tabla properties';
    ELSE
        RAISE NOTICE 'La columna square_meters o area ya existe en la tabla properties';
    END IF;
END $$;
