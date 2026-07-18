# Automatic Public Owner Discovery Pipeline - Integration Guide

## Overview

This document describes how the automatic public owner discovery pipeline is integrated into the KMZ collection system. The pipeline runs automatically via background cron jobs and can be manually triggered per-KMZ.

## Architecture

```
KMZ Collection
    ↓
[Owner Discovery Service] - Extract metadata, ROL, search queries
    ↓
[Public Sources Search] - Search CBR, SEA, Municipal, Government
    ↓
[Search Cache] - Reuse results for identical ROL+Commune
    ↓
[GPT-4 Analyzer] - Analyze findings, extract owner info
    ↓
[Enrichment Pipeline] - Build metadata incrementally
    ↓
Supabase (KMZ metadata) - Store results
    ↓
[Owner Intelligence UI] - Display in Campos app
```

## API Endpoints

### Manual Discovery Trigger

**POST /api/kmz/owner-discovery**

Manually trigger owner discovery for a single KMZ.

```bash
curl -X POST http://localhost:3000/api/kmz/owner-discovery \
  -H "Content-Type: application/json" \
  -d '{
    "kmz_id": "uuid-here",
    "forceRefresh": false
  }'
```

Response:
```json
{
  "success": true,
  "kmz_id": "uuid",
  "message": "Owner discovery completed",
  "metadata": { ... },
  "searchResultsCount": 5,
  "analysisConfidence": 0.92
}
```

### Status Check

**GET /api/kmz/owner-discovery?kmz_id=uuid**

Check current owner discovery status for a KMZ.

```bash
curl http://localhost:3000/api/kmz/owner-discovery?kmz_id=uuid-here
```

Response:
```json
{
  "kmz_id": "uuid",
  "file_name": "campo_1.kmz",
  "status": "evidence-found",
  "confidence": 0.92,
  "candidate": { ... },
  "leadsCount": 3,
  "queue": { ... }
}
```

### Pipeline Status

**GET /api/kmz/owner-discovery/status**

Get overall pipeline statistics.

```bash
curl http://localhost:3000/api/kmz/owner-discovery/status
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalKmz": 150,
    "processingStatus": {
      "pending": 45,
      "evidence-found": 78,
      "confirmed": 25,
      "skipped": 2
    },
    "averageConfidence": 0.81,
    "withEvidence": 78,
    "confirmed": 25,
    "skipped": 2,
    "lastUpdated": "2026-07-18T10:30:00Z"
  },
  "pipelineHealth": {
    "status": "healthy",
    "processingRate": "68.7%",
    "confirmationRate": "16.7%"
  }
}
```

### Cron Job (Background Worker)

**GET /api/cron/kmz-owner-research**

Automated cron endpoint for background processing.

Query parameters:
- `batch_size` (number, default: 50) - KMZ per batch
- `dry_run` (boolean, default: false) - Log without persisting
- `only_missing` (boolean, default: false) - Only KMZ without owners
- `only_with_role` (boolean, default: true) - Only KMZ with ROL

```bash
curl http://localhost:3000/api/cron/kmz-owner-research?batch_size=50&dry_run=false
```

Response:
```json
{
  "success": true,
  "processed": 45,
  "skipped": 5,
  "errors": 0,
  "updated": 42,
  "confirmed": 3,
  "details": [ ... ],
  "cacheStats": {
    "cacheSize": 1250,
    "cacheEntries": 42
  },
  "timestamp": "2026-07-18T10:35:00Z"
}
```

## UI Integration

### Owner Intelligence Panel Component

Import and use in Campos:

```tsx
import { OwnerIntelligencePanel } from "@/components/campos/owner-intelligence-panel"

// In your component:
<OwnerIntelligencePanel
  kmzId={kmzId}
  metadata={kmzData.metadata}
  onRefresh={async (id) => {
    const res = await fetch(`/api/kmz/owner-discovery?kmz_id=${id}`, { method: 'POST' })
    return res.json()
  }}
  onConfirm={async (id, ownerName) => {
    // Handle confirmation - update metadata
  }}
  onSkip={async (id) => {
    // Handle skip - mark as skipped
  }}
/>
```

### Props

```typescript
interface OwnerIntelligencePanelProps {
  kmzId: string                              // Unique KMZ identifier
  metadata?: {                               // KMZ metadata object
    public_owner_candidate?: OwnerCandidate | null
    owner_research_leads?: OwnerResearchLead[]
    owner_research_queue?: OwnerResearchQueue
    confirmed_owner?: string | null
    cbr_document_url?: string | null
    owner_confidence?: number
  }
  onRefresh?: (kmzId: string) => Promise<void>    // Refresh discovery
  onConfirm?: (kmzId: string, ownerName: string) => Promise<void>  // Confirm owner
  onSkip?: (kmzId: string) => Promise<void>       // Skip KMZ
}
```

## Services & Utilities

### OwnerDiscoveryService

Core discovery logic:

```typescript
import { ownerDiscoveryService } from "@/lib/kmz/owner-discovery-service"

// Extract owner from description
const candidate = ownerDiscoveryService.extractOwnerFromDescription(description)

// Generate search queries
const queries = ownerDiscoveryService.generateSearchQueries(rol, commune, kmzName, ownerName)

// Calculate priority
const { score, tier } = ownerDiscoveryService.calculatePriorityScore(
  hasRol, hasConfirmedOwner, hasCandidate, evidenceCount, region
)

// Build queue entry
const queue = ownerDiscoveryService.buildQueueEntry(status, rol, commune, kmzName, ownerName, evidenceCount, region)
```

### PublicSourcesSearch

Search public data sources:

```typescript
import { publicSourcesSearch } from "@/lib/public-sources/owner-search"

const results = await publicSourcesSearch.searchOwner({
  rol: "12345-67",
  commune: "Vitacura",
  ownerName: "Agrícola Santa María",
  keywords: ["propietario", "sociedad"]
})

// Clear cache if needed
publicSourcesSearch.clearCache()
```

### OwnerAnalyzer

GPT-4 analysis:

```typescript
import { ownerAnalyzer } from "@/lib/ai/owner-analyzer"

// Analyze search results
const analysis = await ownerAnalyzer.analyzeSearchResults(
  searchResultsText,
  "ROL: 12345-67, Commune: Vitacura"
)

// Convert to research lead
const lead = ownerAnalyzer.toResearchLead(analysis, "search-analysis", "automated")

// Check if should store
if (ownerAnalyzer.shouldStore(analysis, 0.5)) {
  // Store the finding
}
```

### KMZOwnerEnrichmentPipeline

Build and maintain metadata:

```typescript
import { kmzOwnerEnrichmentPipeline } from "@/lib/kmz/kmz-owner-enrichment"

// Add research lead
metadata = kmzOwnerEnrichmentPipeline.addResearchLead(metadata, lead)

// Update primary candidate
metadata = kmzOwnerEnrichmentPipeline.updatePrimaryCandidate(metadata)

// Increase confidence from multiple sources
metadata = kmzOwnerEnrichmentPipeline.increaseConfidenceFromMultipleSources(metadata)

// Mark as CBR confirmed
metadata = kmzOwnerEnrichmentPipeline.confirmFromCBR(metadata, ownerName, url, registryDate)

// Prepare for storage
metadata = kmzOwnerEnrichmentPipeline.prepareForStorage(metadata)

// Merge findings
metadata = kmzOwnerEnrichmentPipeline.merge(existing, newFindings)
```

### SearchCache

Cache search results by ROL+Commune:

```typescript
import { searchCache, SearchCache } from "@/lib/public-sources/search-cache"

// Generate cache key
const key = SearchCache.generateKey("12345-67", "Vitacura")

// Store result
searchCache.set(key, results, 24 * 60 * 60 * 1000) // 24 hours

// Retrieve
const cached = searchCache.get(key)

// Get stats
const stats = searchCache.getStats()
// { totalEntries: 42, totalHits: 350, memoryUsage: 12500, hitRate: 0.89 }

// Clear
searchCache.clear()
```

## Cron Job Setup

### Vercel Cron

To enable automatic processing, configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/kmz-owner-research",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

This runs every 4 hours. Adjust schedule as needed:
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Once daily

### Local Development

Test the cron locally:

```bash
curl http://localhost:3000/api/cron/kmz-owner-research?batch_size=5&dry_run=true
```

## Environment Variables

Ensure these are set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...  # For GPT-4o mini
```

## Data Flow Example

### Step 1: Manual Trigger
```
POST /api/kmz/owner-discovery
  ├─ Fetch KMZ from Supabase
  ├─ Extract ROL, description, owner hints
  ├─ Generate search queries
  └─ Continue to Step 2
```

### Step 2: Search Public Sources
```
PublicSourcesSearch.searchOwner()
  ├─ Check cache (ROL+Commune key)
  ├─ If cached, return immediately (70-90% of requests)
  ├─ If not cached:
  │  ├─ Search CBR
  │  ├─ Search SEA
  │  ├─ Search Municipal
  │  └─ Store in cache
  └─ Return results
```

### Step 3: Analyze with GPT-4
```
OwnerAnalyzer.analyzeSearchResults()
  ├─ Format search results
  ├─ Call GPT-4o mini (system prompt prevents hallucination)
  ├─ Parse JSON response
  └─ Return structured analysis
```

### Step 4: Enrich Metadata
```
KMZOwnerEnrichmentPipeline
  ├─ Add new research leads
  ├─ Update primary candidate
  ├─ Boost confidence if multiple sources agree
  ├─ Prepare for storage (validate, normalize)
  └─ Store in Supabase
```

### Step 5: Display in UI
```
OwnerIntelligencePanel
  ├─ Show candidate with confidence %
  ├─ Display all research leads
  ├─ Allow user to confirm or skip
  ├─ Show suggested next step
  └─ Enable manual override
```

## Testing Checklist

- [ ] Manual trigger endpoint works (single KMZ)
- [ ] Status endpoint returns correct stats
- [ ] Cron job processes batches without errors
- [ ] Search cache reduces API calls by 70%+
- [ ] GPT-4 analysis produces valid JSON
- [ ] Metadata properly stored in Supabase
- [ ] UI panel displays all fields correctly
- [ ] Confirm/Skip buttons update metadata
- [ ] Average confidence >0.75
- [ ] False positive rate <5%

## Troubleshooting

### Endpoint returns 500 error
- Check environment variables are set
- Verify Supabase connection
- Check CloudWatch logs for details

### Very low confidence scores
- Verify search results contain owner information
- Check GPT prompt is preventing hallucination
- May need to improve search queries

### Cache not working
- Verify ROL extraction is correct
- Check cache keys are consistent
- Clear cache and retry

### Slow processing
- Increase batch size gradually
- Check network latency to Supabase
- Verify GPT-4 response times

## Performance Targets

- Processing time: <3s per KMZ average
- Cache hit rate: >70% for large datasets
- Cost per discovery: <$0.05
- Average confidence: >0.75
- False positive rate: <5%

## Next Steps

1. Deploy cron job configuration to production
2. Monitor pipeline stats daily
3. Collect 100+ discoveries for validation
4. Fine-tune confidence thresholds if needed
5. Consider additional public sources if coverage <80%
