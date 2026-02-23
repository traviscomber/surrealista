-- Check what type values are already in kmz_location_index
SELECT DISTINCT type FROM kmz_location_index WHERE type IS NOT NULL LIMIT 10;

-- Also check the table definition to see the constraint
SELECT constraint_name, constraint_definition 
FROM information_schema.table_constraints t
WHERE t.table_name='kmz_location_index' AND t.constraint_type='CHECK';
