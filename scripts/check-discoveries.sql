-- Owner Discovery Pipeline - Database Check Queries
-- Run these in Supabase SQL Editor to monitor discoveries

-- 1. Overall Statistics
SELECT 
  COUNT(*) as total_kmz,
  COUNT(CASE WHEN metadata->>'confirmed_owner' IS NOT NULL THEN 1 END) as with_confirmed_owner,
  COUNT(CASE WHEN metadata->>'confirmed_owner' IS NULL THEN 1 END) as without_owner,
  ROUND(100.0 * COUNT(CASE WHEN metadata->>'confirmed_owner' IS NOT NULL THEN 1 END) / COUNT(*), 2) as coverage_percent
FROM kmz_collection;

-- 2. Recent Discoveries (Last 24 hours)
SELECT 
  name,
  (metadata->>'rol') as rol,
  (metadata->>'commune') as commune,
  (metadata->>'confirmed_owner') as owner,
  (metadata->>'owner_confidence')::float as confidence,
  updated_at
FROM kmz_collection
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 20;

-- 3. Confidence Score Distribution
SELECT 
  CASE 
    WHEN (metadata->>'owner_confidence')::float >= 0.9 THEN '0.90+: Very High'
    WHEN (metadata->>'owner_confidence')::float >= 0.75 THEN '0.75-0.89: High'
    WHEN (metadata->>'owner_confidence')::float >= 0.60 THEN '0.60-0.74: Medium'
    ELSE 'Below 0.60: Low'
  END as confidence_level,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM kmz_collection
WHERE metadata->>'confirmed_owner' IS NOT NULL
GROUP BY confidence_level
ORDER BY confidence_level DESC;

-- 4. Research Leads by Source
SELECT 
  jsonb_array_length(metadata->'owner_research_leads') as num_leads,
  COUNT(*) as kmz_count
FROM kmz_collection
WHERE metadata->'owner_research_leads' IS NOT NULL
GROUP BY jsonb_array_length(metadata->'owner_research_leads')
ORDER BY num_leads DESC;

-- 5. KMZ Needing Work (No owner found)
SELECT 
  name,
  (metadata->>'rol') as rol,
  (metadata->>'commune') as commune,
  (metadata->>'region') as region,
  jsonb_array_length(metadata->'owner_research_leads') as leads_found,
  updated_at
FROM kmz_collection
WHERE metadata->>'confirmed_owner' IS NULL
ORDER BY updated_at ASC
LIMIT 20;

-- 6. Top Regions by Coverage
SELECT 
  (metadata->>'region') as region,
  COUNT(*) as total_kmz,
  COUNT(CASE WHEN metadata->>'confirmed_owner' IS NOT NULL THEN 1 END) as with_owner,
  ROUND(100.0 * COUNT(CASE WHEN metadata->>'confirmed_owner' IS NOT NULL THEN 1 END) / COUNT(*), 1) as coverage_percent
FROM kmz_collection
WHERE (metadata->>'region') IS NOT NULL
GROUP BY region
ORDER BY coverage_percent DESC;

-- 7. Search Errors Last 24h
SELECT 
  (metadata->>'last_search_error') as error,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as kmz_names
FROM kmz_collection
WHERE metadata->>'last_search_error' IS NOT NULL
  AND updated_at > NOW() - INTERVAL '24 hours'
GROUP BY error
ORDER BY count DESC;

-- 8. Processing Status
SELECT 
  (metadata->>'processing_status') as status,
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM kmz_collection
WHERE metadata->>'processing_status' IS NOT NULL
GROUP BY status
ORDER BY count DESC;
