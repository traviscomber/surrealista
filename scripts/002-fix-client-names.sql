-- Script para limpiar clientes con nombres de productos incorrectos
-- Este script marca clientes sospechosos que probablemente tienen productos como nombres

-- Encontrar y listar clientes con nombres que parecen productos (contienen palabras clave de productos)
SELECT 
  id, 
  first_name, 
  last_name, 
  rut, 
  phone,
  email
FROM clients
WHERE 
  first_name ILIKE '%COBRE%' 
  OR first_name ILIKE '%ORO%'
  OR first_name ILIKE '%PLATA%'
  OR first_name ILIKE '%CATODO%'
  OR first_name ILIKE '%ANODO%'
  OR first_name ILIKE '%CARBONATO%'
  OR first_name ILIKE '%SULFATO%'
  OR first_name ILIKE '%YODO%'
  OR first_name ILIKE '%ACIDO%'
ORDER BY created_at DESC;

-- OPCIÓN 1: Eliminar estos registros para reimportar
-- Descomenta la siguiente línea si quieres eliminar los registros incorrectos
-- DELETE FROM clients WHERE 
--   first_name ILIKE '%COBRE%' 
--   OR first_name ILIKE '%ORO%'
--   OR first_name ILIKE '%PLATA%'
--   OR first_name ILIKE '%CATODO%'
--   OR first_name ILIKE '%ANODO%'
--   OR first_name ILIKE '%CARBONATO%'
--   OR first_name ILIKE '%SULFATO%'
--   OR first_name ILIKE '%YODO%'
--   OR first_name ILIKE '%ACIDO%';

-- OPCIÓN 2: Marcar como datos incorrectos en notas
-- UPDATE clients 
-- SET notes = COALESCE(notes || ' | ', '') || '[NOMBRE INCORRECTO - REIMPORTAR]'
-- WHERE 
--   first_name ILIKE '%COBRE%' 
--   OR first_name ILIKE '%ORO%'
--   OR first_name ILIKE '%PLATA%'
--   OR first_name ILIKE '%CATODO%'
--   OR first_name ILIKE '%ANODO%'
--   OR first_name ILIKE '%CARBONATO%'
--   OR first_name ILIKE '%SULFATO%'
--   OR first_name ILIKE '%YODO%'
--   OR first_name ILIKE '%ACIDO%';
