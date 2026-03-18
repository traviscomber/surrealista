-- Re-scan and properly assign all KMZ files to correct regions based on geographic coordinates
-- Chilean regions latitude ranges:
-- Arica y Parinacota: -17.5 to -18.5
-- Tarapacá: -18.5 to -20.5
-- Antofagasta: -20.5 to -25
-- Atacama: -25 to -28
-- Coquimbo: -28 to -32
-- Valparaíso: -32 to -33.5
-- Metropolitana: -33.5 to -34.5
-- Libertador O'Higgins: -34.5 to -36
-- Maule: -36 to -37
-- Ñuble: -37 to -38
-- Biobío: -37 to -38 (overlaps Ñuble)
-- Los Lagos: -38 to -43.5
-- Los Ríos: -39 to -40.5
-- Aysén: -43.5 to -48
-- Magallanes: -48 to -56
-- Also check placemarks for better coordinate data

BEGIN;

-- First, reset all regions to NULL to start fresh
UPDATE kmz_collection SET region = NULL WHERE region IS NOT NULL;

-- Try to assign regions based on KMZ placemarks' geographic center
UPDATE kmz_collection kc
SET region = CASE
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -18.5 AND kp.center_lat < -17.5
  ) THEN 'Arica y Parinacota'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -20.5 AND kp.center_lat < -18.5
  ) THEN 'Tarapacá'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -25 AND kp.center_lat < -20.5
  ) THEN 'Antofagasta'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -28 AND kp.center_lat < -25
  ) THEN 'Atacama'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -32 AND kp.center_lat < -28
  ) THEN 'Coquimbo'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -33.5 AND kp.center_lat < -32
  ) THEN 'Valparaíso'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -34.5 AND kp.center_lat < -33.5
  ) THEN 'Metropolitana'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -36 AND kp.center_lat < -34.5
  ) THEN 'Libertador General Bernardo O\'Higgins'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -37 AND kp.center_lat < -36
  ) THEN 'Región del Maule'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -38 AND kp.center_lat < -37
  ) THEN 'Ñuble'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -40.5 AND kp.center_lat < -38
  ) THEN 'Biobío'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -40.5 AND kp.center_lat < -39
  ) THEN 'Los Ríos'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -43.5 AND kp.center_lat < -38
  ) THEN 'Los Lagos'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat >= -48 AND kp.center_lat < -43.5
  ) THEN 'Región de Aysén del General Carlos Ibáñez del Campo'
  WHEN EXISTS (
    SELECT 1 FROM kmz_placemarks kp 
    WHERE kp.kmz_id = kc.id 
    AND kp.center_lat < -48
  ) THEN 'Magallanes y de la Antártica Chilena'
END
WHERE region IS NULL;

-- For files still without region, try to use KMZ bounds coordinates
UPDATE kmz_collection kc
SET region = CASE
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -18.5 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -17.5 THEN 'Arica y Parinacota'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -20.5 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -18.5 THEN 'Tarapacá'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -25 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -20.5 THEN 'Antofagasta'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -28 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -25 THEN 'Atacama'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -32 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -28 THEN 'Coquimbo'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -33.5 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -32 THEN 'Valparaíso'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -34.5 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -33.5 THEN 'Metropolitana'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -36 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -34.5 THEN 'Libertador General Bernardo O\'Higgins'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -37 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -36 THEN 'Región del Maule'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -38 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -37 THEN 'Ñuble'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -40.5 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -38 THEN 'Biobío'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -40.5 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -39 THEN 'Los Ríos'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -43.5 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -38 THEN 'Los Lagos'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric >= -48 AND (kc.bounds -> 'center' ->> 'lat')::numeric < -43.5 THEN 'Región de Aysén del General Carlos Ibáñez del Campo'
  WHEN (kc.bounds -> 'center' ->> 'lat')::numeric < -48 THEN 'Magallanes y de la Antártica Chilena'
END
WHERE region IS NULL;

COMMIT;

-- Report results
SELECT 
  COUNT(*) as total_kmz,
  COUNT(CASE WHEN region IS NOT NULL THEN 1 END) as assigned,
  COUNT(CASE WHEN region IS NULL THEN 1 END) as unassigned,
  ROUND(100.0 * COUNT(CASE WHEN region IS NOT NULL THEN 1 END) / COUNT(*), 2) as assignment_percentage
FROM kmz_collection;

-- Show unassigned files if any remain
SELECT id, file_name, bounds FROM kmz_collection WHERE region IS NULL LIMIT 20;
