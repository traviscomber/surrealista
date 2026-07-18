#!/bin/bash

# Script para procesar TODOS los 2324 archivos KMZ en lotes
# Ejecuta el pipeline de descubrimiento de propietarios para cada lote

set -e

# Configuración
BATCH_SIZE=50
TOTAL_KMZ=2324
LOTES_TOTALES=$((($TOTAL_KMZ + $BATCH_SIZE - 1) / $BATCH_SIZE))
API_URL="http://localhost:3000/api/cron/kmz-owner-research"
PROCESSED=0
ERRORS=0

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Procesando 2324 archivos KMZ${NC}"
echo -e "${BLUE}Lotes: $LOTES_TOTALES x $BATCH_SIZE archivos${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Timestamp de inicio
START_TIME=$(date +%s)

# Procesar lotes
for ((LOTE=1; LOTE<=LOTES_TOTALES; LOTE++)); do
    echo -e "${YELLOW}[Lote $LOTE/$LOTES_TOTALES]${NC} Procesando $BATCH_SIZE archivos..."
    
    # Ejecutar API
    RESPONSE=$(curl -s "$API_URL?batch_size=$BATCH_SIZE" 2>&1)
    
    # Verificar respuesta
    if echo "$RESPONSE" | jq . > /dev/null 2>&1; then
        PROCESSED_COUNT=$(echo "$RESPONSE" | jq '.processed // 0')
        ERROR_COUNT=$(echo "$RESPONSE" | jq '.errors // 0')
        
        PROCESSED=$((PROCESSED + PROCESSED_COUNT))
        ERRORS=$((ERRORS + ERROR_COUNT))
        
        # Mostrar progreso
        PROGRESS=$((($PROCESSED * 100) / $TOTAL_KMZ))
        echo -e "${GREEN}✓ Lote completo: +$PROCESSED_COUNT archivos (Total: $PROCESSED)${NC}"
        
        # Barra de progreso
        printf "[%-50s] %d%% (%d/%d)\n" "$(printf '#%.0s' {1..$((PROGRESS/2))})" "$PROGRESS" "$PROCESSED" "$TOTAL_KMZ"
        
        if [ $ERROR_COUNT -gt 0 ]; then
            echo -e "${RED}⚠ Errores en este lote: $ERROR_COUNT${NC}"
        fi
    else
        ERRORS=$((ERRORS + 1))
        echo -e "${RED}✗ Error procesando lote (respuesta inválida)${NC}"
    fi
    
    # Mostrar resumen de estado cada 5 lotes
    if [ $((LOTE % 5)) -eq 0 ]; then
        curl -s "http://localhost:3000/api/kmz/owner-discovery/status" | jq '{
            procesados: .stats.processed,
            pendientes: .stats.pending,
            conEvidence: .stats.withEvidence,
            confianzaPromedio: .stats.averageConfidence
        }' 2>/dev/null || true
        echo ""
    fi
    
    # Pequeña pausa para no sobrecargar el servidor
    sleep 2
done

# Timestamp de fin
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Resumen final
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PROCESAMIENTO COMPLETADO${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Archivos procesados: ${GREEN}$PROCESSED${NC}"
echo -e "Total de errores: ${RED}$ERRORS${NC}"
echo -e "Tiempo total: ${YELLOW}$DURATION segundos${NC}"
echo -e "Tasa promedio: ${YELLOW}$((TOTAL_KMZ / (DURATION / 60))) KMZ por minuto${NC}"
echo ""

# Estado final
echo -e "${BLUE}Estado final del pipeline:${NC}"
curl -s "http://localhost:3000/api/kmz/owner-discovery/status" | jq '.stats' 2>/dev/null || true

echo ""
echo -e "${GREEN}✓ Lote masivo completado. Verifica BATCH_PROCESSING_STATUS.md para detalles.${NC}"
