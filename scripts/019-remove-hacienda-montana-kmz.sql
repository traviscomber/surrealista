-- Updated to use the exact filename "Hacienda La Montaña.KMZ" with proper matching
-- Remove "Hacienda La Montaña.KMZ" file from collection
-- This file has 6000+ placemarks and causes performance issues
-- Using soft delete (is_active = false) to allow recovery if needed

UPDATE kmz_collection 
SET is_active = false 
WHERE file_name ILIKE 'Hacienda La Montaña%'
   OR file_name ILIKE '%La Montaña%'
   OR file_path ILIKE '%Hacienda%Montaña%';

-- Verify the deletion
SELECT file_name, placemarks_count, is_active 
FROM kmz_collection 
WHERE file_name ILIKE 'Hacienda La Montaña%'
   OR file_name ILIKE '%La Montaña%';

-- Note: The placemarks in kmz_placemarks table will remain but won't be loaded
-- because they're tied to an inactive KMZ file via the kmz_id foreign key
