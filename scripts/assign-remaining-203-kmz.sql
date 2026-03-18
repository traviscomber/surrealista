-- Comprehensive assignment script for remaining 203 unassigned KMZ files
-- This includes expanded Chilean city and location mappings

-- Create temporary table with comprehensive city mapping
CREATE TEMP TABLE expanded_city_mapping AS
SELECT * FROM (
  VALUES
    -- Los Lagos Region
    ('riñihue', 'Los Lagos'),
    ('rupanco', 'Los Lagos'),
    ('chaitén', 'Los Lagos'),
    ('cisnes', 'Aysén'),
    ('pucatrihue', 'Los Lagos'),
    ('traiguén', 'La Araucanía'),
    ('collileufu', 'Los Lagos'),
    
    -- Aysén Region
    ('coyhaique', 'Aysén'),
    ('villa santa lucia', 'Aysén'),
    
    -- Maule Region
    ('talagante', 'Libertad'),
    ('san javier', 'Región del Maule'),
    ('cauquenes', 'Región del Maule'),
    ('curicó', 'Región del Maule'),
    ('talca', 'Región del Maule'),
    ('linares', 'Región del Maule'),
    ('molina', 'Región del Maule'),
    ('constitución', 'Región del Maule'),
    ('parral', 'Ñuble'),
    ('longaví', 'Ñuble'),
    ('ranquil', 'Ñuble'),
    ('quillón', 'Ñuble'),
    ('chillan', 'Ñuble'),
    ('nuble', 'Ñuble'),
    
    -- Metropolitan Region
    ('santiago', 'Metropolitana'),
    ('peralillo', 'Libertad'),
    ('mostazal', 'Libertad'),
    ('paine', 'Metropolitana'),
    ('pirque', 'Metropolitana'),
    ('colina', 'Metropolitana'),
    ('puente alto', 'Metropolitana'),
    ('la florida', 'Metropolitana'),
    ('ñuñoa', 'Metropolitana'),
    ('providencia', 'Metropolitana'),
    
    -- La Araucanía
    ('lonquimay', 'La Araucanía'),
    ('melipeuco', 'La Araucanía'),
    ('vilcún', 'La Araucanía'),
    ('temuco', 'La Araucanía'),
    ('pucón', 'La Araucanía'),
    
    -- O'Higgins Region (Libertad)
    ('rancagua', 'Libertad'),
    ('machalí', 'Libertad'),
    ('lolol', 'Libertad'),
    ('santa cruz', 'Libertad'),
    ('nancagua', 'Libertad'),
    ('pichidegua', 'Libertad'),
    
    -- Generic patterns that should map to regions
    ('sajonia', 'Los Lagos'),
    ('hornopiren', 'Los Lagos'),
    ('guay guay', 'Los Lagos'),
    ('el silo', 'Los Lagos'),
    ('contao', 'Los Lagos'),
    ('colico', 'La Araucanía'),
    ('santa bárbara', 'Ñuble'),
    ('tagua tagua', 'Libertad'),
    ('teno', 'Libertad'),
    ('maule', 'Región del Maule')
) AS t(city, region);

-- Update kmz_collection with newly identified regions
UPDATE kmz_collection kc
SET region = ecm.region
FROM expanded_city_mapping ecm
WHERE kc.region IS NULL
  AND LOWER(kc.file_name) LIKE '%' || ecm.city || '%';

-- Log results
DO $$ 
DECLARE
  updated_count INT;
  remaining_count INT;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM kmz_collection 
  WHERE region IS NOT NULL;
  
  SELECT COUNT(*) INTO remaining_count 
  FROM kmz_collection 
  WHERE region IS NULL;
  
  RAISE NOTICE '[v0] Updated KMZ files: % total assigned, % still unassigned', updated_count, remaining_count;
END $$;
