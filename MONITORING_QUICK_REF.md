# Owner Discovery Pipeline - Monitoring Quick Reference

## Check System Health (30 seconds)

```bash
# One-liner health check
curl -s "http://localhost:3000/api/kmz/owner-discovery/status" | jq '{
  status: .status,
  processed: .processed,
  pending: .pending,
  errors: .errors,
  cacheHitRate: (.cacheStats.hitRate * 100 | round) + "%"
}'
```

**Expected output:**
```json
{
  "status": "ready",
  "processed": 45,
  "pending": 23,
  "errors": 0,
  "cacheHitRate": "68%"
}
```

---

## Trigger Pipeline (For Testing)

```bash
# Process 1 KMZ (quick test)
curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=1"

# Process 5 KMZ (normal batch)
curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=5"

# Process 50 KMZ (full batch for production)
curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=50"

# Test without saving (dry-run)
curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=5&dry_run=true"
```

---

## Check Recent Discoveries (Supabase)

```sql
-- Paste into Supabase SQL Editor

-- Last 20 discoveries
SELECT name, metadata->>'confirmed_owner', metadata->>'owner_confidence', updated_at
FROM kmz_collection
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 20;
```

---

## Monitor Dashboard

```bash
# Real-time monitoring dashboard
./scripts/monitor-owner-discovery.sh

# Follow logs in real-time
tail -f /tmp/dev-server.log | grep -i "owner\|discovery\|error"
```

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `curl "http://localhost:3000/api/kmz/owner-discovery/status"` | Check status |
| `curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=5"` | Run pipeline |
| `npm run dev` | Start server |
| `./scripts/monitor-owner-discovery.sh` | Dashboard |
| `tail -f /tmp/dev-server.log` | View logs |

---

## What to Look For

### ✅ Healthy Indicators
- Status: `ready`
- Errors: `0`
- Cache hit rate: `>50%`
- Pending: Decreasing over time
- Confidence scores: Average `>0.75`

### ⚠️ Warning Signs
- Cache hit rate: `<30%`
- Errors: `>0` and increasing
- Pending: Growing (not processing)
- Server response: `>10s`

### ❌ Critical Issues
- Status: `error`
- Errors: `>5`
- Server: Unreachable
- OPENAI_API_KEY: Not set

---

## Quick Fixes

| Issue | Fix |
|-------|-----|
| Server won't start | `npm run dev` |
| Can't connect | Check port 3000: `lsof -i :3000` |
| OPENAI error | `export OPENAI_API_KEY="sk-proj-xxx"` |
| No discoveries | Check: `tail -f /tmp/dev-server.log` |
| High costs | Check cache hit rate (should >60%) |

---

## Production Monitoring Checklist (Daily)

- [ ] Check status: `curl "http://localhost:3000/api/kmz/owner-discovery/status"`
- [ ] Verify cache hit rate: Should be >60%
- [ ] Check errors: Should be 0
- [ ] Verify pending count: Decreasing
- [ ] Check costs: Monitor OpenAI dashboard
- [ ] Review recent discoveries: Any false positives?

---

## Performance Targets

| Metric | Target | Red Flag |
|--------|--------|----------|
| Processing time | <3s/KMZ | >10s/KMZ |
| Cache hit rate | >70% | <30% |
| Cost per discovery | <$0.05 | >$0.15 |
| Success rate | >95% | <80% |
| Avg confidence | >0.75 | <0.60 |

---

## Where to Find Everything

- **Logs:** `/tmp/dev-server.log`
- **Database queries:** `scripts/check-discoveries.sql`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Full guide:** `OPENAI_OWNER_DISCOVERY_GUIDE.md`
- **Code:** `lib/ai/owner-analyzer.ts` (AI logic)
- **API:** `app/api/cron/kmz-owner-research/route.ts` (pipeline)

---

## Emergency Contacts

If something breaks:

1. **Check logs:** `tail -f /tmp/dev-server.log`
2. **Restart server:** `pkill -f "npm run dev" && npm run dev`
3. **Check env vars:** `echo $OPENAI_API_KEY`
4. **Read troubleshooting:** `TROUBLESHOOTING.md`
5. **Test manually:** `curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=1"`
