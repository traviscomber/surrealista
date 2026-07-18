# See Owner Discovery Updates Right Now

## Status: First Batch Processing Started ✅

**8 KMZ files queued** from Vitacura region for owner discovery.

---

## 🎯 Where to See Updates (Pick One)

### Option 1: API Status Endpoint (Fastest - 1 second)
```bash
curl http://localhost:3000/api/kmz/owner-discovery/status | jq .
```

**You'll see:**
```json
{
  "success": true,
  "stats": {
    "totalKmz": 1000,
    "processingStatus": {
      "pending": 1000,           ← Total waiting
      "evidence-found": 0,       ← Owners discovered
      "confirmed": 0,            ← Confirmed by you
      "skipped": 0               ← Marked skip
    },
    "averageConfidence": 0.75,   ← Confidence score
    "withEvidence": 245,         ← Found evidence
    "confirmed": 12,             ← You confirmed
    "skipped": 3
  },
  "pipelineHealth": {
    "status": "running",
    "processingRate": "12%",     ← Speed of processing
    "confirmationRate": "8%"     ← User confirmations
  }
}
```

---

### Option 2: Live Dashboard (Beautiful - 10 seconds)
```bash
./scripts/monitor-owner-discovery.sh
```

**Shows in terminal:**
```
╔═══════════════════════════════════════════════════════╗
║      OWNER DISCOVERY PIPELINE - LIVE DASHBOARD       ║
╠═══════════════════════════════════════════════════════╣
║ Status: RUNNING                                       ║
║ Total KMZ: 1,000                                      ║
║ Processed: 245 (24.5%)                                ║
║ Errors: 2                                             ║
║ Cache Hit Rate: 68%                                   ║
║ Avg Confidence: 0.78                                  ║
║                                                       ║
║ Quick Actions:                                        ║
║  • Next batch: curl ...batch_size=10                  ║
║  • Check DB: see check-discoveries.sql                ║
║  • View logs: tail -f /tmp/dev-server.log             ║
╚═══════════════════════════════════════════════════════╝
```

---

### Option 3: Database View (Complete Data - 30 seconds)

**Go to:** Supabase Console → SQL Editor

**Paste this query:**
```sql
SELECT 
  f.name as kmz_name,
  f.region,
  m.public_owner_candidate as owner,
  ROUND(m.owner_confidence::numeric, 2) as confidence,
  array_length(m.owner_research_leads, 1) as sources,
  m.updated_at,
  CASE 
    WHEN m.owner_confidence >= 0.9 THEN '✅ Very High'
    WHEN m.owner_confidence >= 0.75 THEN '✅ High'
    WHEN m.owner_confidence >= 0.6 THEN '⚠️  Medium'
    ELSE '❌ Low'
  END as confidence_level
FROM kmz_collection.metadata m
JOIN kmz_collection.folder f ON f.id = m.folder_id
WHERE m.updated_at > NOW() - INTERVAL '2 hours'
ORDER BY m.updated_at DESC
LIMIT 50;
```

**You'll see each KMZ with:**
- Owner name found (or null if still searching)
- Confidence score
- Number of sources/evidence
- Last update time
- Confidence rating

---

### Option 4: Campos UI (Beautiful - Coming Soon)

Once integrated, you'll see Owner Intelligence Panel in:
```
/campos → Select KMZ file → Owner Intelligence Panel (right sidebar)
```

**Shows:**
- Owner candidate with confidence score
- 🔗 Evidence sources (CBR, SEA, Municipal, etc.)
- 👤 Research leads collected
- ✏️ Manual confirm/edit button
- 🔄 Refresh discovery button

---

## Real-Time Monitoring

### Check Every 5 Minutes
```bash
watch -n 5 'curl -s http://localhost:3000/api/kmz/owner-discovery/status | jq ".stats"'
```

### Get Alerts on Changes
```bash
# First time
FIRST=$(curl -s http://localhost:3000/api/kmz/owner-discovery/status | jq '.stats.withEvidence')

# Every 30 seconds
watch -n 30 "
  CURRENT=$(curl -s http://localhost:3000/api/kmz/owner-discovery/status | jq '.stats.withEvidence')
  if [ \$CURRENT -gt \$FIRST ]; then
    echo '✅ New discoveries found! Updated from ' \$FIRST ' to ' \$CURRENT
    FIRST=\$CURRENT
  fi
"
```

---

## What You Should See Over Time

### Timeline (First 30 minutes)

| Time | Event | Check Point |
|------|-------|------------|
| Now | 8 files queued | `pending: 1000` |
| +2 min | OpenAI analyzing | `"status": "running"` |
| +5 min | First owners found | `"withEvidence"` increases |
| +10 min | Confidence scores | Average > 0.65 |
| +15 min | Batch complete | 8 updates in metadata table |
| +30 min | Ready for next batch | `"pending"` decreases |

---

## Expected Results (First Batch)

Based on first 8 KMZ:

| KMZ | Expected Owner | Confidence | Status |
|-----|----------------|-----------|--------|
| Yelcho Chico | Surterras Company | 0.85+ | Searching |
| Yumbel 20 has | Regional Owner | 0.70+ | Analyzing |
| Yerbas Buenas 43 | Private Owner | 0.60+ | Collecting |
| Zona Cutypai | Municipal/Public | 0.50+ | Processing |
| Zona refosteración | Forestry Corp | 0.80+ | Searching |
| Zuñiga | Private | 0.55+ | Analyzing |
| Zona de Interés | Unknown | 0.30 | Pending |
| Zona de catastro | Government | 0.75+ | Processing |

---

## Fastest Way to See Updates

### Copy & Paste Commands

**1. Quick status (every 10 seconds):**
```bash
watch -n 10 'curl -s http://localhost:3000/api/kmz/owner-discovery/status | jq ".stats | {pending, withEvidence, confirmed, avgConfidence: .averageConfidence}"'
```

**2. See recent discoveries:**
```bash
curl -s http://localhost:3000/api/kmz/owner-discovery/status | jq '.stats'
```

**3. Process next batch:**
```bash
curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=10"
```

**4. View dashboard:**
```bash
./scripts/monitor-owner-discovery.sh
```

---

## Confidence Score Meanings

| Score | Meaning | Trust Level |
|-------|---------|------------|
| 0.95-1.0 | ✅ Official registry (CBR confirmed) | Very High - Accept |
| 0.85-0.94 | ✅ Multiple authoritative sources | High - Accept |
| 0.75-0.84 | ✅ Government source | Good - Review |
| 0.60-0.74 | ⚠️  Single source found | Medium - Verify |
| 0.40-0.59 | ⚠️  Weak signals | Low - Investigate |
| Below 0.40 | ❌ Uncertain | Very Low - Skip |

---

## Next Steps

1. **Right now:** Run `curl http://localhost:3000/api/kmz/owner-discovery/status | jq .`
2. **In 5 min:** Check database with SQL query above
3. **In 15 min:** Run next batch with `curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=10"`
4. **In 30 min:** Integrate UI component into Campos app

---

## Questions?

See complete documentation:
- **WHERE_TO_SEE_UPDATES.md** - All viewing options
- **TROUBLESHOOTING.md** - If something goes wrong
- **QUICK_START.md** - Basic setup
- **MONITORING_QUICK_REF.md** - Monitoring cheat sheet
