-- Fix Los Ríos region assignment
-- Los Ríos should have latitude range approximately -39° to -40.5°
-- Move files from Biobío that fall in Los Ríos latitude range

-- First, identify files that should be in Los Ríos but are in Biobío
SELECT file_name, region, 
  ((bounds->>'south')::numeric + (bounds->>'north')::numeric) / 2 as center_lat
FROM kmz_collection
WHERE region = 'Biobío'
  AND ((bounds->>'south')::numeric + (bounds->>'north')::numeric) / 2 BETWEEN -40.5 AND -39
ORDER BY file_name;

-- Update files in Los Ríos latitude range to correct region
UPDATE kmz_collection
SET region = 'Los Ríos'
WHERE region = 'Biobío'
  AND ((bounds->>'south')::numeric + (bounds->>'north')::numeric) / 2 BETWEEN -40.5 AND -39
  AND is_active = true;

-- Verify the update
SELECT COUNT(*) as los_rios_count 
FROM kmz_collection 
WHERE region = 'Los Ríos' AND is_active = true;

-- Show final region distribution
SELECT region, COUNT(*) as file_count
FROM kmz_collection
WHERE is_active = true
GROUP BY region
ORDER BY file_count DESC;
