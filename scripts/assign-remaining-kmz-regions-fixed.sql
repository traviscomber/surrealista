-- Create city mapping table if it doesn't exist and assign remaining KMZ regions
BEGIN;

-- Create city_region_mapping table if it doesn't exist
CREATE TABLE IF NOT EXISTS city_region_mapping (
  city_name VARCHAR(255) PRIMARY KEY,
  region VARCHAR(100) NOT NULL
);

-- Insert comprehensive Chilean city/location mappings
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
  
  -- Los Lagos region
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
  ('Ranco', 'Los Lagos'),
  ('Rio Puelo', 'Los Lagos'),
  ('Chonchi', 'Los Lagos'),
  ('Quellón', 'Los Lagos'),
  ('Castro', 'Los Lagos'),
  
  -- La Araucanía region
  ('Melipeuco', 'La Araucanía'),
  ('Loncotriuque', 'La Araucanía'),
  ('Lonquimay', 'La Araucanía'),
  ('Villarrica', 'La Araucanía'),
  ('Pucón', 'La Araucanía'),
  ('Curarrehue', 'La Araucanía'),
  ('Traiguén', 'La Araucanía'),
  ('Lago Villarrica', 'La Araucanía'),
  
  -- O'Higgins / Libertad region
  ('lolol', 'Libertad'),
  ('Lolol', 'Libertad'),
  ('Pichilemu', 'Libertad'),
  ('San Fernando', 'Libertad'),
  ('Peumo', 'Libertad'),
  
  -- Metropolitana
  ('Maipo', 'Metropolitana'),
  ('Juano Barrio Maipo', 'Metropolitana'),
  ('Talagante', 'Metropolitana'),
  
  -- Magallanes
  ('General Carrera', 'Magallanes'),
  ('Lago Azul', 'Magallanes'),
  
  -- Los Ríos
  ('Valdivia', 'Los Ríos'),
  ('Confluencia', 'Los Ríos'),
  
  -- Bío Bío
  ('El Tigre', 'Bío Bío'),
  ('Huequén', 'Bío Bío')
ON CONFLICT (city_name) DO NOTHING;

-- Update remaining unassigned KMZ files
UPDATE kmz_collection kc
SET region = crm.region
FROM city_region_mapping crm
WHERE kc.region IS NULL
  AND kc.is_active = true
  AND kc.file_name ILIKE '%' || crm.city_name || '%';

-- Report results
SELECT 
  COUNT(CASE WHEN region IS NULL THEN 1 END)::int as still_unassigned,
  COUNT(CASE WHEN region IS NOT NULL THEN 1 END)::int as now_assigned,
  COUNT(*)::int as total_kmz
FROM kmz_collection 
WHERE is_active = true;

COMMIT;
