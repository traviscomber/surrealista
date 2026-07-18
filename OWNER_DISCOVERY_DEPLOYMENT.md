# Owner Discovery Pipeline - Deployment & Operations Guide

## Quick Start

### 1. Environment Setup

Ensure these environment variables are configured in your Vercel project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbpk_...
OPENAI_API_KEY=sk-...
```

### 2. Enable Cron Jobs

Add to `vercel.json`:

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

Deploy: `git push` (Vercel auto-deploys)

### 3. Verify Installation

```bash
# Check pipeline status
curl https://your-app.vercel.app/api/kmz/owner-discovery/status

# Should return healthy status with stats
```

## Operations

### Monitoring

Check pipeline health daily:

```bash
curl https://your-app.vercel.app/api/kmz/owner-discovery/status | jq '.stats'
```

Key metrics:
- `totalKmz` - Total processed
- `confirmed` - High-confidence owners found
- `averageConfidence` - Overall confidence score
- `withEvidence` - KMZ with evidence

### Manual Processing

Process a batch manually:

```bash
# Process 50 KMZ (dry run first)
curl 'https://your-app.vercel.app/api/cron/kmz-owner-research?batch_size=50&dry_run=true'

# Then run for real
curl 'https://your-app.vercel.app/api/cron/kmz-owner-research?batch_size=50'
```

### Trigger Single KMZ

```bash
curl -X POST https://your-app.vercel.app/api/kmz/owner-discovery \
  -H "Content-Type: application/json" \
  -d '{"kmz_id":"your-uuid-here"}'
```

### Clear Search Cache

The cache automatically expires after 24 hours. To clear manually:

```bash
# Via API (implement endpoint if needed)
POST /api/kmz/owner-discovery/cache/clear

# Or directly in code
import { searchCache } from "@/lib/public-sources/search-cache"
searchCache.clear()
```

## Troubleshooting

### Cron Job Not Running

1. Check `vercel.json` is committed
2. Verify cron path is correct: `/api/cron/kmz-owner-research`
3. Check Vercel deployment logs

```bash
vercel logs --follow
```

### API Returns 500

1. Verify environment variables:
   ```bash
   vercel env ls
   ```

2. Check logs:
   ```bash
   vercel logs --follow --tail 50
   ```

3. Test locally first:
   ```bash
   npm run dev
   curl http://localhost:3000/api/kmz/owner-discovery/status
   ```

### Low Confidence Scores

1. Check search results contain owner info
2. Verify GPT prompt (prevents hallucination)
3. Improve search queries in `ownerDiscoveryService.generateSearchQueries()`

### Cache Not Helping

1. Verify most KMZ share ROL+Commune combinations
2. Check cache key generation: `SearchCache.generateKey(rol, commune)`
3. Monitor with:
   ```bash
   curl https://your-app.vercel.app/api/cron/kmz-owner-research?batch_size=1 | jq '.cacheStats'
   ```

## Cost Optimization

### Reduce API Calls

Current approach already optimized:
- Cache reduces search API calls by 70-90%
- Batch processing reduces overhead
- GPT-4o mini is cheapest tier

### Estimate Monthly Cost

Assumptions:
- 1,000 KMZ total
- Process 50 per batch = 20 batches
- 2x per month = 40 API calls to cron

Cost breakdown:
- Supabase queries: ~$5-10/month (free tier may cover)
- OpenAI GPT-4o mini: ~$0.02 per batch × 40 = $0.80/month
- **Total: ~$5-15/month for realistic volume**

### Scale to 10,000 KMZ

- Process 100 per batch = 100 batches
- 1x per week = 4 API calls per month = 400 total
- Cost: ~$8/month (still very cheap)

## Performance Tuning

### Batch Size

Default: 50 KMZ per cron run

```bash
# For faster results (more API calls)
curl 'https://your-app.vercel.app/api/cron/kmz-owner-research?batch_size=100'

# For slower, cheaper processing
curl 'https://your-app.vercel.app/api/cron/kmz-owner-research?batch_size=25'
```

### Cron Schedule

Default: Every 4 hours (`0 */4 * * *`)

**More frequent = faster coverage but higher cost:**
- Every 1 hour: `0 * * * *` - Processes 1,200 KMZ/day
- Every 2 hours: `0 */2 * * *` - Processes 600 KMZ/day

**Less frequent = slower but cheaper:**
- Every 12 hours: `0 */12 * * *` - Processes 100 KMZ/day
- Daily: `0 0 * * *` - Processes 50 KMZ/day

### Processing Time

Typical times per KMZ:
- Search cache hit: 50ms
- Search cache miss: 2-3s (CBR, SEA, etc.)
- GPT-4 analysis: 500-800ms
- Database update: 100-200ms

**Total per KMZ: 0.5-4 seconds**

With 50 KMZ per batch:
- All hits: ~30 seconds
- Mixed: ~2 minutes
- All misses: ~3 minutes (rare after first run)

## Scaling

### For 100,000+ KMZ

Consider:
1. **Increase batch size**: 100-200 KMZ per run
2. **Run cron more frequently**: Every 2 hours
3. **Cache improvements**: Consider Redis for distributed cache
4. **Parallel processing**: If server time allows

### Monitor and Alert

Set up monitoring:

```typescript
// In a monitoring dashboard
const status = await fetch('https://your-app/api/kmz/owner-discovery/status')
const { stats } = await status.json()

if (stats.averageConfidence < 0.7) {
  // Alert: low confidence
  sendAlert('Average confidence below 70%')
}

if (stats.confirmed < stats.totalKmz * 0.3) {
  // Alert: low confirmation rate
  sendAlert('Confirmation rate below 30%')
}
```

## Security

### API Authentication

Current endpoints are public. For production, add authentication:

```typescript
// In route handler
import { auth } from "@/lib/auth"

const session = await auth()
if (!session?.user?.isAdmin) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

### Sensitive Data

- Search results may contain PI (personal information)
- Store results in Supabase with proper access controls
- Enable Row Level Security (RLS) on metadata JSONB

### Rate Limiting

Add if public endpoints:

```typescript
import { RateLimiter } from "some-rate-limiting-lib"

const limiter = new RateLimiter({
  points: 10,
  duration: 60, // Per minute
})

await limiter.consume(req.ip)
```

## Rollback Plan

### If Pipeline Has Bugs

1. Disable cron (remove from `vercel.json` and push)
2. Revert code: `git revert <commit>`
3. Deploy: `git push`
4. Resume cron after fix verified

### If Data Is Corrupted

1. Stop the pipeline immediately
2. Check last backup of database
3. Restore if needed
4. Fix bug and test locally
5. Redeploy and resume

## Maintenance

### Weekly

```bash
# Check status
curl https://your-app/api/kmz/owner-discovery/status | jq '.stats.averageConfidence'

# Should be >0.75
```

### Monthly

1. Review average confidence trend
2. Check cache hit rate
3. Validate sample of findings manually
4. Update thresholds if needed

### Quarterly

1. Audit false positive rate (sample 50 results)
2. Consider new public sources
3. Fine-tune confidence scoring
4. Plan for next phase (more sources, better analysis)

## Next Phase Ideas

### Phase 2: Enhanced Sources

- Add more public sources:
  - Google Scholar (academic databases)
  - LibreOffice archived sites
  - International property databases
- Implement more robust parsing

### Phase 3: CBR Integration

- Direct CBR API queries (if available)
- Real-time confirmation checks
- Official registry synchronization

### Phase 4: ML Model

- Train confidence model on validated data
- Learn patterns from false positives
- Improve over time with labeled data

## Support

For issues:

1. Check logs: `vercel logs --follow`
2. Check env vars: `vercel env ls`
3. Test locally: `npm run dev`
4. Review integration guide: `OWNER_DISCOVERY_INTEGRATION.md`
5. Check GitHub issues if stuck
