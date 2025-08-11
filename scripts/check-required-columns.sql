-- Check for not-null constraints in the properties table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'properties'
ORDER BY 
  ordinal_position;
