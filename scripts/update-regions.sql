-- Update regions in kmz_location_index based on latitude coordinates
-- Chile regions by latitude ranges

-- Arica y Parinacota
UPDATE kmz_location_index
SET region = 'Arica y Parinacota'
WHERE latitude > -20 AND latitude <= -17 AND region IS NULL;

-- Tarapacá
UPDATE kmz_location_index
SET region = 'Tarapacá'
WHERE latitude > -22 AND latitude <= -20 AND region IS NULL;

-- Antofagasta
UPDATE kmz_location_index
SET region = 'Antofagasta'
WHERE latitude > -26 AND latitude <= -22 AND region IS NULL;

-- Atacama
UPDATE kmz_location_index
SET region = 'Atacama'
WHERE latitude > -29 AND latitude <= -26 AND region IS NULL;

-- Coquimbo
UPDATE kmz_location_index
SET region = 'Coquimbo'
WHERE latitude > -32 AND latitude <= -29 AND region IS NULL;

-- Valparaíso
UPDATE kmz_location_index
SET region = 'Valparaíso'
WHERE latitude > -33.5 AND latitude <= -32 AND region IS NULL;

-- Metropolitana de Santiago
UPDATE kmz_location_index
SET region = 'Metropolitana de Santiago', city = 'Santiago'
WHERE latitude > -34.2 AND latitude <= -33.5 AND longitude > -71.5 AND longitude < -70 AND region IS NULL;

-- Libertador Bernardo O'Higgins
UPDATE kmz_location_index
SET region = 'Libertador Bernardo O''Higgins'
WHERE latitude > -35 AND latitude <= -34.2 AND region IS NULL;

-- Maule
UPDATE kmz_location_index
SET region = 'Maule'
WHERE latitude > -36.5 AND latitude <= -35 AND region IS NULL;

-- Ñuble
UPDATE kmz_location_index
SET region = 'Ñuble'
WHERE latitude > -37.5 AND latitude <= -36.5 AND region IS NULL;

-- La Araucanía (Temuco area)
UPDATE kmz_location_index
SET region = 'La Araucanía', city = 'Temuco'
WHERE latitude > -39 AND latitude <= -37.5 AND region IS NULL;

-- Los Ríos
UPDATE kmz_location_index
SET region = 'Los Ríos'
WHERE latitude > -40.5 AND latitude <= -39 AND region IS NULL;

-- Los Lagos (Osorno, Puerto Montt area)
UPDATE kmz_location_index
SET region = 'Los Lagos', city = 'Puerto Montt'
WHERE latitude > -42.5 AND latitude <= -40.5 AND region IS NULL;

-- Aysén del General Carlos Ibáñez del Campo (Aysén)
UPDATE kmz_location_index
SET region = 'Aysén', city = 'Coyhaique'
WHERE latitude > -46 AND latitude <= -42.5 AND region IS NULL;

-- Magallanes y de la Antártica Chilena
UPDATE kmz_location_index
SET region = 'Magallanes', city = 'Punta Arenas'
WHERE latitude <= -46 AND region IS NULL;

-- Update city for Valparaíso region
UPDATE kmz_location_index
SET city = 'Valparaíso'
WHERE region = 'Valparaíso' AND city IS NULL;

-- Update searchable_text to include region for better search
UPDATE kmz_location_index
SET searchable_text = searchable_text || ' ' || COALESCE(region, '') || ' ' || COALESCE(city, '')
WHERE searchable_text NOT LIKE '%' || region || '%';
