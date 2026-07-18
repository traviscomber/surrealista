#!/bin/bash

# Dashboard en tiempo real para monitorear el procesamiento masivo de 2324 KMZ

clear

while true; do
    # Limpiar pantalla
    clear
    
    # Encabezado
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║       PROCESAMIENTO MASIVO DE 2324 ARCHIVOS KMZ EN VIVO       ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Hora: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Obtener estado del pipeline
    STATUS=$(curl -s "http://localhost:3000/api/kmz/owner-discovery/status" 2>&1)
    
    if [ $? -eq 0 ]; then
        # Extraer métricas
        TOTAL=$(echo "$STATUS" | jq '.stats.totalKmz // 1000' 2>/dev/null || echo "1000")
        PENDING=$(echo "$STATUS" | jq '.stats.processingStatus.pending // 1000' 2>/dev/null || echo "1000")
        EVIDENCE=$(echo "$STATUS" | jq '.stats.withEvidence // 0' 2>/dev/null || echo "0")
        CONFIRMED=$(echo "$STATUS" | jq '.stats.confirmed // 0' 2>/dev/null || echo "0")
        CONFIDENCE=$(echo "$STATUS" | jq '.stats.averageConfidence // 0' 2>/dev/null || echo "0")
        
        # Calcular progreso
        PROCESSED=$((TOTAL - PENDING))
        if [ $TOTAL -gt 0 ]; then
            PROGRESS=$((($PROCESSED * 100) / $TOTAL))
        else
            PROGRESS=0
        fi
        
        # Mostrar métricas principales
        echo "┌─ MÉTRICAS PRINCIPALES ─────────────────────────────────────┐"
        printf "│ Procesados: %-40d │\n" "$PROCESSED"
        printf "│ Pendientes: %-40d │\n" "$PENDING"
        printf "│ Con evidencia: %-37d │\n" "$EVIDENCE"
        printf "│ Confirmados: %-38d │\n" "$CONFIRMED"
        echo "└────────────────────────────────────────────────────────────┘"
        echo ""
        
        # Barra de progreso visual
        echo "┌─ PROGRESO GENERAL ──────────────────────────────────────────┐"
        BAR_WIDTH=50
        FILLED=$((($PROGRESS * $BAR_WIDTH) / 100))
        EMPTY=$((BAR_WIDTH - FILLED))
        
        printf "│ ["
        printf "%${FILLED}s" | tr ' ' '█'
        printf "%${EMPTY}s" | tr ' ' '░'
        printf "] %3d%% (%d/%d) │\n" "$PROGRESS" "$PROCESSED" "$TOTAL"
        echo "└────────────────────────────────────────────────────────────┘"
        echo ""
        
        # Confianza promedio
        echo "┌─ CALIDAD DE RESULTADOS ─────────────────────────────────────┐"
        printf "│ Confianza promedio: %.2f / 1.00                          │\n" "$CONFIDENCE"
        
        if [ $EVIDENCE -gt 0 ]; then
            RATIO=$((($EVIDENCE * 100) / $TOTAL))
            printf "│ Cobertura: %d/%d (%.1f%%)                           │\n" "$EVIDENCE" "$TOTAL" "$RATIO"
        else
            echo "│ Cobertura: 0/2324 (0%)                                 │"
        fi
        echo "└────────────────────────────────────────────────────────────┘"
        echo ""
        
        # Estado del pipeline
        PIPE_STATUS=$(echo "$STATUS" | jq -r '.pipelineHealth.status // "unknown"' 2>/dev/null)
        PIPE_RATE=$(echo "$STATUS" | jq -r '.pipelineHealth.processingRate // "0%"' 2>/dev/null)
        
        echo "┌─ ESTADO DEL PIPELINE ───────────────────────────────────────┐"
        echo "│ Estado: $PIPE_STATUS"
        echo "│ Tasa de procesamiento: $PIPE_RATE"
        echo "└────────────────────────────────────────────────────────────┘"
        echo ""
        
        # Comandos útiles
        echo "┌─ COMANDOS ÚTILES ──────────────────────────────────────────┐"
        echo "│ Ver logs:    tail -f /tmp/batch-processing.log           │"
        echo "│ Pausar:      Ctrl+C                                     │"
        echo "│ Actualizar:  Espera 5 segundos...                       │"
        echo "└────────────────────────────────────────────────────────────┘"
    else
        echo "❌ Error conectando al pipeline. ¿El servidor está corriendo?"
        echo ""
        echo "Intenta:"
        echo "  npm run dev"
    fi
    
    # Esperar antes de actualizar
    sleep 5
done
