# Owner Discovery Pipeline - Quick Start

## One Minute Setup

```bash
# 1. Set environment variable
# Go to Vercel Project Settings → Environment Variables
# Add: OPENAI_API_KEY=sk-proj-xxxxx

# 2. Test locally
curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=2"

# 3. Check results
curl "http://localhost:3000/api/kmz/owner-discovery/status"

# 4. Deploy to production
git push

# 5. Add cron to vercel.json
{
  "crons": [{
    "path": "/api/cron/kmz-owner-research",
    "schedule": "0 */4 * * *"
  }]
}
```

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cron/kmz-owner-research` | GET | Run batch discovery (cron) |
| `/api/kmz/owner-discovery` | POST | Single KMZ discovery |
| `/api/kmz/owner-discovery/status` | GET | Pipeline health & stats |

## Query Parameters

```bash
# Batch size (default: 50)
?batch_size=10

# Test mode (no DB writes)
?dry_run=true

# Only missing owners
?only_missing=true

# Only with ROL numbers
?only_with_role=true
```

## Response Example

```bash
curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=1"
```

```json
{
  "success": true,
  "processed": 1,
  "skipped": 0,
  "errors": 0,
  "updated": 1,
  "details": [{
    "kmz_id": "f3b3b100-1c42-43f3-813d-ac4b7b2a0e74",
    "file_name": "Zona refosteración 5180.kmz",
    "status": "pending",
    "confidence": 0.92
  }],
  "cacheStats": {
    "totalEntries": 45,
    "totalHits": 31,
    "hitRate": 0.689
  }
}
```

## Features

✅ OpenAI GPT-4o mini for owner analysis  
✅ Never invents or hallucates data  
✅ Cache reduces API calls 70-90%  
✅ Confidence scoring 0-1 scale  
✅ Public database search (CBR, SEA, Municipal)  
✅ Incremental enrichment (appends, never overwrites)  
✅ Manual override controls  
✅ Real-time monitoring  

## Cost

- Per KMZ: ~$0.02 with cache
- Monthly (1000 KMZ): ~$10-15

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check OPENAI_API_KEY |
| 0 processed | No KMZ in database or all have owners |
| Low confidence | Public databases may not have data |
| High costs | Cache hit rate too low, check ROL data |

## Files Overview

- `lib/ai/owner-analyzer.ts` - OpenAI integration
- `lib/kmz/owner-discovery-service.ts` - Pipeline logic
- `lib/public-sources/owner-search.ts` - DB search
- `lib/public-sources/search-cache.ts` - Caching
- `app/api/cron/kmz-owner-research/route.ts` - Worker
- `components/campos/owner-intelligence-panel.tsx` - UI

## Next

- [Full Guide](./OPENAI_OWNER_DISCOVERY_GUIDE.md)
- [Integration Docs](./OWNER_DISCOVERY_INTEGRATION.md)
- [Deployment Guide](./OWNER_DISCOVERY_DEPLOYMENT.md)
