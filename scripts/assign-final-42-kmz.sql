-- Assign the 42 remaining unassigned KMZ files to Los Lagos region
-- All these files have location names from Los Lagos region:
-- Ranco, Rosales, Futrono, Cochamo, Coihuería, Mashue, Aranzana, etc.

UPDATE kmz_collection
SET region = 'Los Lagos'
WHERE region IS NULL
AND is_active = true;

-- Display the results
SELECT region, COUNT(*) as count
FROM kmz_collection
WHERE is_active = true
GROUP BY region
ORDER BY count DESC;
