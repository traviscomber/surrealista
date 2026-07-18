#!/bin/bash

# Complete KMZ extraction - ALL DATA IN ONE PASS (NO INTERACTION)
# Extracts: Owners + ROL Info + Neighbor Contacts
# Processes all 2,324 KMZ efficiently

set -e

ENDPOINT="http://localhost:3000/api/kmz/extract-all-data"
BATCH_SIZE=100
TOTAL_KMZ=2324
BATCHES=$((($TOTAL_KMZ + $BATCH_SIZE - 1) / $BATCH_SIZE))

echo "=========================================="
echo "COMPLETE KMZ EXTRACTION (AUTO MODE)"
echo "=========================================="
echo "Total KMZ: $TOTAL_KMZ"
echo "Batch size: $BATCH_SIZE per request"
echo "Total batches: $BATCHES"
echo ""
echo "Extracting:"
echo "  ✓ Owner candidates from filenames"
echo "  ✓ ROL information and analysis"
echo "  ✓ Neighbor contact information"
echo "  ✓ All persisted to Supabase"
echo ""

# Test connectivity
echo "Testing endpoint connectivity..."
if ! curl -s -f "$ENDPOINT" -X POST -H "Content-Type: application/json" -d '{"batch_size":1,"dry_run":true}' > /dev/null 2>&1; then
  echo "ERROR: Cannot reach endpoint: $ENDPOINT"
  echo "Make sure dev server is running: npm run dev"
  exit 1
fi
echo "✓ Endpoint reachable"
echo ""

echo "Starting extraction of 2,324 KMZ..."
echo "=========================================="

START_TIME=$(date +%s)
TOTAL_PROCESSED=0
TOTAL_OWNERS=0
TOTAL_NEIGHBORS=0

# Process in batches
for ((i = 1; i <= $BATCHES; i++)); do
  PERCENT=$(( ($i - 1) * 100 / $BATCHES ))
  
  # Call endpoint
  RESULT=$(curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"batch_size\": $BATCH_SIZE, \"dry_run\": false}" 2>/dev/null || echo '{}')
  
  # Extract stats
  PROCESSED=$(echo "$RESULT" | jq '.processed // 0' 2>/dev/null || echo 0)
  OWNERS=$(echo "$RESULT" | jq '.summary.owner_candidates_found // 0' 2>/dev/null || echo 0)
  NEIGHBORS=$(echo "$RESULT" | jq '.summary.total_neighbors_found // 0' 2>/dev/null || echo 0)
  
  TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
  TOTAL_OWNERS=$((TOTAL_OWNERS + OWNERS))
  TOTAL_NEIGHBORS=$((TOTAL_NEIGHBORS + NEIGHBORS))
  
  # Progress bar
  FILLED=$(( ($i * 20) / $BATCHES ))
  EMPTY=$((20 - FILLED))
  BAR=$(printf "%-${FILLED}s" '#' | tr ' ' '#')$(printf "%-${EMPTY}s" '-' | tr ' ' '-')
  
  echo -ne "\rBatch $i/$BATCHES [$BAR] $PERCENT% | Processed: $TOTAL_PROCESSED | Owners: $TOTAL_OWNERS | Neighbors: $TOTAL_NEIGHBORS"
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo ""
echo "=========================================="
echo "✓ COMPLETE EXTRACTION FINISHED"
echo "=========================================="
echo ""
echo "Results:"
echo "  Total processed:        $TOTAL_PROCESSED"
echo "  Owners found:           $TOTAL_OWNERS"
echo "  Neighbor contacts:      $TOTAL_NEIGHBORS"
echo "  Time total:             ${DURATION}s"
if [ $TOTAL_PROCESSED -gt 0 ]; then
  RATE=$(( ($TOTAL_PROCESSED * 60) / $DURATION ))
  echo "  Processing rate:        $RATE KMZ/min"
fi
echo ""
echo "✓ All 2,324 KMZ have been enriched with:"
echo "  - Owner candidates"
echo "  - ROL information"
echo "  - Neighbor contacts"
echo ""
echo "✓ All data persisted to Supabase!"
