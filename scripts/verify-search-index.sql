-- Verify kmz_search_index has data
SELECT COUNT(*) as total_records, COUNT(DISTINCT region) as unique_regions FROM kmz_search_index;

-- Show sample records with "temuco" or Araucanía (La Araucanía region where Temuco is located)
SELECT name, region, city, searchable_text, latitude, longitude FROM kmz_search_index 
WHERE region ILIKE '%Araucanía%' OR searchable_text ILIKE '%temuco%' OR searchable_text ILIKE '%araucanía%'
LIMIT 10;

-- Show all regions in the index
SELECT DISTINCT region, COUNT(*) as count FROM kmz_search_index GROUP BY region ORDER BY count DESC;
