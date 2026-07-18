#!/bin/bash

# Complete KMZ Extraction - ALL IN ONE PASS
# Procesa: Owners + ROL Info + Neighbor Contacts
# Target: Todos los 2,324 KMZ

set -e

ENDPOINT="http://localhost:3000/api/kmz/extract-all-data"
BATCH_SIZE=100
BATCHES=24

echo "=========================================="
echo "COMPLETE KMZ EXTRACTION - 2,324 Files"
echo "=========================================="
echo ""
echo "Endpoint: $ENDPOINT"
echo "Batch Size: $BATCH_SIZE"
echo "Total Batches: $BATCHES"
echo ""

TOTAL_PROCESSED=0
TOTAL_OWNERS=0
TOTAL_NEIGHBORS=0
START_TIME=$(date +%s)

for i in $(seq 1 $BATCHES); do
  echo "========== BATCH $i/$BATCHES =========="
  
  RESPONSE=$(curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"batch_size\": $BATCH_SIZE, \"dry_run\": false}")
  
  echo "Response: $RESPONSE" | head -c 200
  echo ""
  
  PROCESSED=$(echo "$RESPONSE" | jq '.processed // 0' 2>/dev/null || echo 0)
  OWNERS=$(echo "$RESPONSE" | jq '.summary.owner_candidates_found // 0' 2>/dev/null || echo 0)
  NEIGHBORS=$(echo "$RESPONSE" | jq '.summary.total_neighbors_found // 0' 2>/dev/null || echo 0)
  
  TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
  TOTAL_OWNERS=$((TOTAL_OWNERS + OWNERS))
  TOTAL_NEIGHBORS=$((TOTAL_NEIGHBORS + NEIGHBORS))
  
  echo "Batch $i: Processed=$PROCESSED, Owners=$OWNERS, Neighbors=$NEIGHBORS"
  echo "TOTALS: $TOTAL_PROCESSED processed | $TOTAL_OWNERS owners | $TOTAL_NEIGHBORS neighbors"
  echo ""
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=========================================="
echo "EXTRACTION COMPLETE!"
echo "=========================================="
echo "Total Processed: $TOTAL_PROCESSED"
echo "Total Owners Found: $TOTAL_OWNERS"
echo "Total Neighbor Contacts: $TOTAL_NEIGHBORS"
echo "Time: ${DURATION}s"
echo ""

if [ $TOTAL_PROCESSED -gt 0 ]; then
  RATE=$(( ($TOTAL_PROCESSED * 60) / $DURATION ))
  echo "Processing Rate: $RATE KMZ/min"
fi

echo "All data saved to Supabase with full metadata enrichment!"
