#!/bin/bash

# Simple Owner Extraction for All KMZ Files
# Extracts owner candidates from KMZ filenames
# Fast and reliable - no external API calls

echo "========================================="
echo "EXTRACCIÓN SIMPLE DE DUEÑOS - TODOS LOS KMZ"
echo "========================================="
echo ""

BATCH_SIZE=100
TOTAL_BATCHES=24  # 2400 KMZ / 100 per batch
ENDPOINT="http://localhost:3000/api/kmz/extract-owners-simple"

PROCESSED_TOTAL=0
UPDATED_TOTAL=0
ERRORS=0

# First, dry-run to preview results
echo "📋 DRY RUN: Previewing extraction results..."
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"batch_size\": 50, \"dry_run\": true}")

echo "Preview Results:"
echo "$RESPONSE" | jq '.results | .[0:3]' || echo "No results"
echo ""

# Ask for confirmation
read -p "Proceder con extracción en todos los KMZ? (s/n): " CONFIRM
if [[ "$CONFIRM" != "s" ]]; then
  echo "Cancelado."
  exit 0
fi

echo ""
echo "🚀 Iniciando extracción de dueños..."
echo "Batches: $TOTAL_BATCHES x $BATCH_SIZE = ~$((TOTAL_BATCHES * BATCH_SIZE)) KMZ"
echo ""

START_TIME=$(date +%s)

for BATCH in $(seq 1 $TOTAL_BATCHES); do
  PERCENTAGE=$((BATCH * 100 / TOTAL_BATCHES))
  
  echo -n "Lote $BATCH/$TOTAL_BATCHES ($PERCENTAGE%) - Extrayendo..."
  
  RESPONSE=$(curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"batch_size\": $BATCH_SIZE, \"dry_run\": false}")
  
  PROCESSED=$(echo "$RESPONSE" | jq '.processed // 0')
  UPDATED=$(echo "$RESPONSE" | jq '.updated // 0')
  
  PROCESSED_TOTAL=$((PROCESSED_TOTAL + PROCESSED))
  UPDATED_TOTAL=$((UPDATED_TOTAL + UPDATED))
  
  if [ "$PROCESSED" -gt 0 ]; then
    echo " ✓ $PROCESSED procesados, $UPDATED actualizados"
  else
    echo " ⊘ Sin cambios"
  fi
  
  # Rate limiting
  sleep 1
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "========================================="
echo "EXTRACCIÓN COMPLETADA"
echo "========================================="
echo "Total procesados: $PROCESSED_TOTAL"
echo "Total actualizados: $UPDATED_TOTAL"
echo "Errores: $ERRORS"
echo "Tiempo total: $DURATION segundos"
echo "Tasa promedio: $((PROCESSED_TOTAL * 60 / (DURATION + 1))) KMZ/minuto"
echo ""
echo "✓ Lote masivo completado. Verifica resultados en:"
echo "  - Supabase: kmz_collection.metadata -> public_owner_candidate"
echo "  - API Status: curl http://localhost:3000/api/kmz/owner-discovery/status"
