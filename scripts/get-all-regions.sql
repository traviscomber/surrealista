SELECT DISTINCT region, COUNT(*) as count
FROM kmz_search_index
WHERE region IS NOT NULL
GROUP BY region
ORDER BY count DESC;
