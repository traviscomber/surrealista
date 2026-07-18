# Owner Discovery Pipeline - Troubleshooting Guide

## Common Issues & Solutions

### ❌ "Server is NOT running"

**Problem:** Can't connect to localhost:3000

**Solution:**
```bash
# Start the dev server
npm run dev

# Check if port 3000 is available
lsof -i :3000

# Kill any process on 3000
lsof -ti:3000 | xargs kill -9
```

---

### ❌ "OPENAI_API_KEY is not set"

**Problem:** Getting error about missing OPENAI_API_KEY

**Solution:**
```bash
# 1. Check if it's set
echo $OPENAI_API_KEY

# 2. If local development
export OPENAI_API_KEY="sk-proj-xxxxx"

# 3. If Vercel deployment
# Go to Vercel Project Settings → Environment Variables
# Add: OPENAI_API_KEY = sk-proj-xxxxx

# 4. Verify it's loaded
curl http://localhost:3000/api/cron/kmz-owner-research?batch_size=1
```

---

### ❌ "No discoveries being made"

**Problem:** Pipeline runs but `confirmed_owner` stays null

**Causes & Solutions:**

1. **No search results found**
   - Check CBR/SEA APIs are accessible
   - Verify ROL format is correct (XX-XXXX)
   - Try: `curl "http://localhost:3000/api/kmz/owner-discovery?rol=XX-1234&commune=Santiago"`

2. **GPT analysis rejecting all results**
   - Check OpenAI API response: `tail -f /tmp/dev-server.log`
   - Verify gpt-4o-mini is accessible in your OpenAI account
   - Try manual test:
     ```bash
     curl -X POST http://localhost:3000/api/kmz/owner-discovery \
       -H "Content-Type: application/json" \
       -d '{"searchResults":"Propietario: Juan Perez", "context":"Test"}'
     ```

3. **Confidence scores too low**
   - Check `CONFIDENCE_THRESHOLD` in cron route (default: 0.60)
   - Lower threshold temporarily for testing:
     - Edit: `app/api/cron/kmz-owner-research/route.ts`
     - Change: `CONFIDENCE_THRESHOLD = 0.50`

---

### ❌ "Cache hit rate is 0%"

**Problem:** Every search hits external APIs (expensive)

**Causes:**
- Each KMZ has unique ROL+Commune combination
- Cache only helps with duplicates
- First run always has low cache rate

**Solution:**
- This is normal on first run
- Cache improves over time as you process more KMZ
- Check: `curl http://localhost:3000/api/kmz/owner-discovery/status | jq '.cacheStats'`

**Expected values:**
- First run: 0% hit rate (all misses)
- After 50 KMZ: 20-40% hit rate
- After 200 KMZ: 60-80% hit rate

---

### ❌ "OpenAI API returning 401 Unauthorized"

**Problem:** Authentication fails with OpenAI

**Solution:**
```bash
# 1. Verify your API key is valid
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-proj-xxxxx"

# 2. Check for typos in OPENAI_API_KEY
echo $OPENAI_API_KEY | head -c 10

# 3. Ensure it's a full key (starts with sk-proj-)
# Not a partial key or organization ID

# 4. If using organization
export OPENAI_API_ORGANIZATION="org-xxxxx"

# 5. Test with curl
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

---

### ⚠️ "Pipeline is slow (>10s per KMZ)"

**Problem:** Processing takes too long

**Solutions:**

1. **OpenAI API is slow**
   - This is normal during peak hours
   - Expected: 0.5-4s per KMZ
   - Check OpenAI status: https://status.openai.com

2. **Network latency**
   ```bash
   # Test response time
   time curl -s http://localhost:3000/api/cron/kmz-owner-research?batch_size=1
   ```

3. **Supabase connection slow**
   - Check database status
   - Verify connection pool isn't exhausted
   - Run: `SUPABASE_URL` check in Supabase dashboard

4. **Reduce batch size for testing**
   ```bash
   # Instead of 50, try 5
   curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=5"
   ```

---

### ⚠️ "High OpenAI costs"

**Problem:** Bill is higher than expected

**Solutions:**

1. **Enable cache** (should already be on)
   - Check: `curl http://localhost:3000/api/kmz/owner-discovery/status | jq '.cacheStats'`
   - Expected cost reduction: 70-90%

2. **Reduce batch size during testing**
   ```bash
   # Testing: small batches
   curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=1"
   
   # Production: larger batches
   curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=50"
   ```

3. **Monitor costs**
   - Check OpenAI usage: https://platform.openai.com/usage/overview
   - Expected: ~$0.02 per discovery with cache
   - Budget estimate:
     - 1,000 discoveries = ~$20 (with cache)
     - 10,000 discoveries = ~$200 (with cache)

4. **Use cheaper model if needed**
   - Current: `gpt-4o-mini` (~$0.0005/1K tokens)
   - Alternative: `gpt-3.5-turbo` (~$0.0001/1K tokens)
   - Edit: `lib/ai/owner-analyzer.ts` line 85

---

### ❌ "Supabase Connection Refused"

**Problem:** Can't connect to Supabase

**Solution:**
```bash
# 1. Verify env variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 2. Test connection
curl -s "$SUPABASE_URL/rest/v1/kmz_collection?select=id&limit=1" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"

# 3. If offline, wait for Supabase status
# Check: https://status.supabase.com

# 4. If permissions error, verify service role key
# Must be SERVICE_ROLE_KEY, not anon key
```

---

### ❌ "JSON Parse Error in GPT Response"

**Problem:** `JSON.parse()` fails on OpenAI response

**Solutions:**

1. **GPT returned markdown code blocks**
   - This is handled automatically
   - Check logs: `tail -f /tmp/dev-server.log | grep "JSON"`

2. **Insufficient tokens**
   - Increase max_tokens in `lib/ai/owner-analyzer.ts`
   - Change: `max_tokens: 500` → `max_tokens: 800`

3. **Temperature too high**
   - Current: `temperature: 0.3` (very factual, good for this task)
   - If still getting bad responses, reduce to `0.1`

---

## Monitoring Dashboard

Run the monitoring script to see real-time stats:

```bash
chmod +x scripts/monitor-owner-discovery.sh
./scripts/monitor-owner-discovery.sh
```

This shows:
- ✅ Server status
- 📊 Pipeline statistics
- 💾 Cache performance
- ⚙️ System health
- 📈 Recent discoveries

---

## Database Queries for Debugging

Copy & run these in Supabase SQL Editor:

```sql
-- Check for KMZ with errors
SELECT name, metadata->>'last_search_error', updated_at 
FROM kmz_collection 
WHERE metadata->>'last_search_error' IS NOT NULL 
LIMIT 10;

-- Check confidence distribution
SELECT 
  (metadata->>'owner_confidence')::float as confidence,
  COUNT(*) 
FROM kmz_collection 
WHERE metadata->>'confirmed_owner' IS NOT NULL
GROUP BY confidence
ORDER BY confidence DESC;

-- Check recent discoveries
SELECT name, metadata->>'confirmed_owner', metadata->>'owner_confidence', updated_at
FROM kmz_collection
WHERE updated_at > NOW() - INTERVAL '1 day'
ORDER BY updated_at DESC
LIMIT 20;
```

See `scripts/check-discoveries.sql` for more queries.

---

## Performance Benchmarks

Expected performance on production (Vercel):

| Metric | Expected | Warning | Critical |
|--------|----------|---------|----------|
| Time per KMZ | <3s | >5s | >10s |
| Cache hit rate | >60% | <40% | <20% |
| OpenAI cost | <$0.05 | >$0.10 | >$0.20 |
| Success rate | >95% | <90% | <80% |
| Avg confidence | >0.75 | <0.65 | <0.50 |

---

## Getting Help

1. **Check logs:** `tail -f /tmp/dev-server.log`
2. **Test endpoint:** `curl http://localhost:3000/api/cron/kmz-owner-research?batch_size=1`
3. **Review code:** `lib/ai/owner-analyzer.ts` (GPT logic)
4. **Check DB:** Use queries in `scripts/check-discoveries.sql`
5. **Read docs:** `OPENAI_OWNER_DISCOVERY_GUIDE.md` (full reference)
