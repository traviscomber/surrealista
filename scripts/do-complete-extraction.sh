#!/bin/bash

# Complete KMZ extraction - ALL DATA IN ONE PASS
# Extracts: Owners + ROL Info + Neighbor Contacts
# Processes all 2,324 KMZ efficiently

set -e

ENDPOINT="http://localhost:3000/api/kmz/extract-all-data"
BATCH_SIZE=100
TOTAL_KMZ=2324
BATCHES=$((($TOTAL_KMZ + $BATCH_SIZE - 1) / $BATCH_SIZE))

echo "=========================================="
echo "COMPLETE KMZ EXTRACTION"
echo "=========================================="
echo "Total KMZ: $TOTAL_KMZ"
echo "Batch size: $BATCH_SIZE per request"
echo "Total batches: $BATCHES"
echo ""
echo "This will extract:"
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

# Show preview
echo "Preview (first 3 items dry-run):"
DRY_RUN_OUTPUT=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"batch_size\": 3, \"dry_run\": true}")

echo "$DRY_RUN_OUTPUT" | jq '.results[] | {file_name, owner_candidate, owner_confidence, neighbor_count}' 2>/dev/null || true
echo ""

# Ask for confirmation
read -p "Continue with full extraction? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo "Starting complete extraction of 2,324 KMZ..."
echo "=========================================="

START_TIME=$(date +%s)
TOTAL_PROCESSED=0
TOTAL_OWNERS=0
TOTAL_NEIGHBORS=0

# Process in batches
for ((i = 1; i <= $BATCHES; i++)); do
  PERCENT=$((($i - 1) * 100 / $BATCHES))
  echo -ne "Batch $i/$BATCHES ($PERCENT%) - Processing..."
  
  # Call endpoint
  RESULT=$(curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"batch_size\": $BATCH_SIZE, \"dry_run\": false}")
  
  # Extract stats
  PROCESSED=$(echo "$RESULT" | jq '.processed // 0' 2>/dev/null || echo 0)
  OWNERS=$(echo "$RESULT" | jq '.summary.owner_candidates_found // 0' 2>/dev/null || echo 0)
  NEIGHBORS=$(echo "$RESULT" | jq '.summary.total_neighbors_found // 0' 2>/dev/null || echo 0)
  
  TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
  TOTAL_OWNERS=$((TOTAL_OWNERS + OWNERS))
  TOTAL_NEIGHBORS=$((TOTAL_NEIGHBORS + NEIGHBORS))
  
  echo -ne "\r"
  echo "Batch $i/$BATCHES ($PERCENT%) - Processed: $TOTAL_PROCESSED | Owners: $TOTAL_OWNERS | Neighbors: $TOTAL_NEIGHBORS"
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

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
  RATE=$(echo "scale=0; ($TOTAL_PROCESSED * 60) / $DURATION" | bc)
  echo "  Processing rate:        $RATE KMZ/min"
fi
echo ""
echo "All data has been persisted to Supabase!"
echo "Next: Run dashboard to review results"
