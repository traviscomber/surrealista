-- Enhanced KMZ region assignment for remaining 407 unassigned files
-- This script adds missing Chilean cities and locations to the region mapping

BEGIN;

-- Insert additional city/location mappings that weren't in the original script
INSERT INTO city_region_mapping (city_name, region)
VALUES
  -- Aysén region cities
  ('Rio Ibañez', 'Aysén'),
  ('Ibañez', 'Aysén'),
  ('Chaitén', 'Aysén'),
  ('Futaleufú', 'Aysén'),
  ('Palena', 'Aysén'),
  ('Coyhaique', 'Aysén'),
  ('La Junta', 'Aysén'),
  ('Mañihuales', 'Aysén'),
  ('Villa Santa Lucía', 'Aysén'),
  
  -- Los Lagos region - more specific locations
  ('Guay Guay', 'Los Lagos'),
  ('El Silo', 'Los Lagos'),
  ('Silo', 'Los Lagos'),
  ('Hornopiren', 'Los Lagos'),
  ('Puyehue', 'Los Lagos'),
  ('Osorno', 'Los Lagos'),
  ('Puerto Varas', 'Los Lagos'),
  ('Llanquihue', 'Los Lagos'),
  ('Puerto Montt', 'Los Lagos'),
  ('Tic-Toc', 'Los Lagos'),
  ('Islas Tic-Toc', 'Los Lagos'),
  ('Ranco', 'Los Lagos'),
  ('La Ponderosa', 'Los Lagos'),
  ('Los Radales', 'Los Lagos'),
  ('Los Laureles', 'Los Lagos'),
  
  -- La Araucanía region
  ('Melipeuco', 'La Araucanía'),
  ('Loncotriuque', 'La Araucanía'),
  ('Lonquimay', 'La Araucanía'),
  ('Villarrica', 'La Araucanía'),
  ('Pucón', 'La Araucanía'),
  ('Curarrehue', 'La Araucanía'),
  ('Huemuco', 'La Araucanía'),
  ('Traiguén', 'La Araucanía'),
  
  -- Libertad / O'Higgins region
  ('lolol', 'Libertad'),
  ('Lolol', 'Libertad'),
  ('Pichilemu', 'Libertad'),
  ('San Fernando', 'Libertad'),
  ('Peumo', 'Libertad'),
  
  -- Metropolitana
  ('Maipo', 'Metropolitana'),
  ('Juano Barrio Maipo', 'Metropolitana'),
  ('Talagante', 'Metropolitana'),
  ('Leyda', 'Metropolitana'),
  
  -- Magallanes
  ('Huara', 'Magallanes'),
  ('Gnal. Carrera', 'Magallanes'),
  ('General Carrera', 'Magallanes'),
  ('Lago Azul', 'Magallanes'),
  
  -- Antofagasta
  ('Hacienda Huincul', 'Antofagasta'),
  ('Huincul', 'Antofagasta'),
  
  -- Los Ríos / La Araucanía
  ('Confluencia', 'Los Ríos'),
  ('La Confluencia', 'Los Ríos'),
  ('Valdivia', 'Los Ríos'),
  
  -- Bío Bío region
  ('El Tigre', 'Bío Bío'),
  ('El Marmol', 'Bío Bío'),
  ('El Huape', 'Bío Bío'),
  ('El Suace', 'Bío Bío'),
  ('Huequén', 'Bío Bío'),
  ('Avellano', 'Bío Bío'),
  ('Campo Bueno', 'Bío Bío'),
  ('Gega', 'Bío Bío'),
  ('Octavio', 'Bío Bío')
ON CONFLICT (city_name) DO NOTHING;

-- Now update the remaining unassigned KMZ files based on file name matches
UPDATE kmz_collection kc
SET region = crm.region
FROM city_region_mapping crm
WHERE kc.region IS NULL
  AND kc.is_active = true
  AND (
    kc.file_name ILIKE '%' || crm.city_name || '%'
  );

-- Report results
SELECT 
  (SELECT COUNT(*) FROM kmz_collection WHERE region IS NULL AND is_active = true) as still_unassigned,
  (SELECT COUNT(*) FROM kmz_collection WHERE region IS NOT NULL AND is_active = true) as now_assigned,
  (SELECT COUNT(*) FROM kmz_collection WHERE is_active = true) as total_kmz;

COMMIT;
