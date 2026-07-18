# Where to See Owner Discovery Updates

## 1. 🌐 Web UI - Owner Intelligence Panel (Integrated into CAMPOS)

The Owner Intelligence Panel component is built and ready to integrate into your CAMPOS app.

**File:** `components/campos/owner-intelligence-panel.tsx`

**Location in UI:** Will appear as a new section in the CAMPOS folder view showing:
- Owner candidates for selected KMZ
- Confidence scores (0-1 scale)
- Research leads (sources found)
- Manual override controls

**Status:** Component built, ready to integrate into `components/campos/campos-folder-view.tsx`

---

## 2. 🔌 API Endpoints - Real-time Status

### Check Overall Pipeline Status
```bash
curl http://localhost:3000/api/kmz/owner-discovery/status | jq .
```

**Returns:**
```json
{
  "status": "ready",
  "lastRun": "2026-07-17T14:32:00Z",
  "processed": 8,
  "errors": 0,
  "updated": 8,
  "pending": 0,
  "cacheStats": {
    "hits": 3,
    "misses": 5,
    "hitRate": 0.375
  }
}
```

### Check Single KMZ Status
```bash
curl http://localhost:3000/api/kmz/owner-discovery?rol=XX-XXXX&commune=Santiago | jq .
```

---

## 3. 📊 Database - Direct SQL Queries

### View All Discoveries (Supabase)

**Query 1: All discoveries with confidence scores**
```sql
SELECT 
  f.name,
  f.region,
  m.public_owner_candidate,
  m.owner_confidence,
  m.confirmed_owner,
  m.owner_research_leads,
  m.cbr_registry_date,
  m.updated_at
FROM kmz_collection.metadata m
JOIN kmz_collection.folder f ON f.id = m.folder_id
WHERE m.public_owner_candidate IS NOT NULL
ORDER BY m.updated_at DESC
LIMIT 50;
```

**Query 2: Discovery coverage by region**
```sql
SELECT 
  f.region,
  COUNT(*) as total,
  COUNT(m.public_owner_candidate) as with_owner,
  ROUND(100.0 * COUNT(m.public_owner_candidate) / COUNT(*), 1) as coverage_pct,
  ROUND(AVG(m.owner_confidence), 2) as avg_confidence
FROM kmz_collection.metadata m
JOIN kmz_collection.folder f ON f.id = m.folder_id
GROUP BY f.region
ORDER BY coverage_pct DESC;
```

**Query 3: Recent discoveries (last hour)**
```sql
SELECT 
  f.name,
  m.public_owner_candidate,
  m.owner_confidence,
  array_length(m.owner_research_leads, 1) as sources_found,
  m.updated_at
FROM kmz_collection.metadata m
JOIN kmz_collection.folder f ON f.id = m.folder_id
WHERE m.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY m.updated_at DESC;
```

**Query 4: Confidence distribution**
```sql
SELECT
  CASE 
    WHEN m.owner_confidence >= 0.9 THEN '0.90-1.0 (Very High)'
    WHEN m.owner_confidence >= 0.75 THEN '0.75-0.89 (High)'
    WHEN m.owner_confidence >= 0.6 THEN '0.60-0.74 (Medium)'
    WHEN m.owner_confidence >= 0.4 THEN '0.40-0.59 (Low)'
    ELSE 'Below 0.4 (Very Low)'
  END as confidence_band,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM kmz_collection.metadata), 1) as pct
FROM kmz_collection.metadata m
WHERE m.public_owner_candidate IS NOT NULL
GROUP BY confidence_band
ORDER BY confidence_band;
```

**Query 5: Still need owners (priority list)**
```sql
SELECT 
  f.name,
  f.region,
  COALESCE(m.owner_research_leads, '{}') as leads_collected,
  m.updated_at
FROM kmz_collection.metadata m
JOIN kmz_collection.folder f ON f.id = m.folder_id
WHERE m.public_owner_candidate IS NULL
ORDER BY m.updated_at ASC
LIMIT 20;
```

---

## 4. 📁 Local Files - Results Documentation

**`FIRST_BATCH_RESULTS.md`** - Summary of first 8 KMZ processed
- Shows which files were queued
- Expected discovery timing
- Sample results format

**`MONITORING_QUICK_REF.md`** - Live monitoring commands
- Copy-paste ready checks
- Dashboard commands
- Database queries

---

## 5. 🖥️ Live Dashboard - Terminal UI

```bash
# Run the monitoring dashboard
./scripts/monitor-owner-discovery.sh
```

**Shows:**
- ✅ Server health
- 📊 Processing stats (processed, pending, errors)
- 💾 Cache performance (hit rate, efficiency)
- ⚙️ System resources
- 🚀 Quick action commands

---

## 6. 📝 Logs - Dev Server Output

```bash
# View real-time logs
tail -f /tmp/dev-server.log

# Filter for owner discovery logs only
tail -f /tmp/dev-server.log | grep -i "owner\|discovery\|analyze"

# Show last 50 lines
tail -50 /tmp/dev-server.log
```

---

## Quick Start - See Updates Now

### Step 1: Check Pipeline Status (30 seconds)
```bash
curl http://localhost:3000/api/kmz/owner-discovery/status | jq .
```

### Step 2: View Recent Discoveries (In Supabase)
Copy into Supabase SQL Editor:
```sql
SELECT 
  f.name,
  m.public_owner_candidate,
  ROUND(m.owner_confidence::numeric, 2) as confidence,
  m.updated_at
FROM kmz_collection.metadata m
JOIN kmz_collection.folder f ON f.id = m.folder_id
WHERE m.updated_at > NOW() - INTERVAL '2 hours'
ORDER BY m.updated_at DESC
LIMIT 20;
```

### Step 3: View First Batch Summary
```bash
cat FIRST_BATCH_RESULTS.md
```

### Step 4: Monitor Live
```bash
./scripts/monitor-owner-discovery.sh
```

---

## What You'll See

### In Database
- `public_owner_candidate` - Owner name found (or null)
- `owner_confidence` - Score 0-1 (1 = very confident)
- `owner_research_leads` - Array of evidence sources
- `confirmed_owner` - Manual override by user
- `cbr_registry_date` - When CBR confirmed it

### In Monitoring
- 8 files from first batch status
- Processing progress (queued → analyzing → complete)
- Cache hit rate improving as duplicates repeat
- Average confidence score for batch

### Timeline
- **Now:** First 8 KMZ queued for discovery
- **Next 5 min:** OpenAI analysis results
- **Next 10 min:** Confidence scores calculated
- **Next 30 min:** All first batch complete

---

## Integrate into CAMPOS UI

When ready, add Owner Intelligence Panel to Campos:

```typescript
import { OwnerIntelligencePanel } from "@/components/campos/owner-intelligence-panel"

// Inside campos-folder-view.tsx render:
{selectedFolder && (
  <OwnerIntelligencePanel
    folderId={selectedFolder.dbId}
    folderName={selectedFolder.name}
    region={selectedFolder.region}
  />
)}
```

---

## Next Batch Commands

```bash
# Process next 10 KMZ files
curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=10"

# Check status after batch
curl http://localhost:3000/api/kmz/owner-discovery/status | jq .

# View recent additions in database
# (Use Query 3 from Database section above)
```

