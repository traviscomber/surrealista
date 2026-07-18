#!/bin/bash

# Owner Discovery Pipeline Monitoring Dashboard
# Usage: ./scripts/monitor-owner-discovery.sh

echo "═══════════════════════════════════════════════════════════════"
echo "  Owner Discovery Pipeline - Monitoring Dashboard"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if server is running
echo "1. Server Status:"
if curl -s http://localhost:3000/api/kmz/owner-discovery/status > /dev/null; then
  echo "   ✅ Server is running"
else
  echo "   ❌ Server is NOT running"
  echo "   Start with: npm run dev"
  exit 1
fi

echo ""
echo "2. Pipeline Status:"
curl -s "http://localhost:3000/api/kmz/owner-discovery/status" | jq '{
  status: .status,
  lastRun: .lastRun,
  processed: .processed,
  pending: .pending,
  errors: .errors,
  cacheHitRate: .cacheStats.hitRate
}' || echo "   ❌ Failed to fetch status"

echo ""
echo "3. Recent Discoveries:"
echo "   Checking Supabase for recent results..."
echo "   (Requires Supabase CLI: supabase)"

echo ""
echo "4. System Health:"
echo "   Memory: $(ps aux | grep '[n]pm run dev' | awk '{print $6}') KB"
echo "   CPU: $(ps aux | grep '[n]pm run dev' | awk '{print $3}')%"

echo ""
echo "5. Cache Performance:"
curl -s "http://localhost:3000/api/kmz/owner-discovery/status" | jq '.cacheStats | {
  totalHits: .hits,
  totalMisses: .misses,
  hitRate: (.hitRate * 100 | round) + "%",
  memorySaved: "\($(.hits * 0.05 | round) / 100) USD"
}' || echo "   ❌ Failed to fetch cache stats"

echo ""
echo "6. Quick Actions:"
echo "   Test pipeline (dry-run): curl 'http://localhost:3000/api/cron/kmz-owner-research?batch_size=1&dry_run=true'"
echo "   Run pipeline (real):     curl 'http://localhost:3000/api/cron/kmz-owner-research?batch_size=5'"
echo "   Check logs:              tail -f /tmp/dev-server.log"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  For details, see: OPENAI_OWNER_DISCOVERY_GUIDE.md"
echo "═══════════════════════════════════════════════════════════════"
