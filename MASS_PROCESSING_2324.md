# Procesamiento Masivo de 2324 Archivos KMZ - En Vivo

## Estado Actual

**Status:** ✅ Procesamiento en progreso  
**Archivos Totales:** 2,324 KMZ  
**Tamaño de Lote:** 50 archivos  
**Lotes Totales:** 47  
**Tiempo Inicio:** 2026-07-18 01:33:00 UTC  

---

## Monitoreo en Tiempo Real

### Dashboard Activo
```bash
# Ejecutar en terminal para ver progreso en vivo
./scripts/monitor-batch-progress.sh
```

**Actualiza cada 5 segundos con:**
- Archivos procesados vs. totales
- Barra de progreso visual
- Confianza promedio de resultados
- Estado del pipeline
- Tasa de procesamiento

### Ver Logs en Vivo
```bash
# Ver procesamiento en tiempo real
tail -f /tmp/batch-processing.log

# O con grep para solo ver progreso
tail -f /tmp/batch-processing.log | grep -E "Lote|✓|✗"
```

---

## Métricas de Procesamiento

| Métrica | Target | Actual |
|---------|--------|--------|
| Total KMZ | 2,324 | 2,324 |
| Tamaño de lote | 50 | 50 |
| Tiempo por lote | ~10s | Monitoreando |
| Confianza promedio | >0.75 | Recalculando |
| Cobertura esperada | >80% | En progreso |

---

## Cómo Ver los Resultados

### 1. API Status Endpoint (Más rápido)
```bash
# Estado en tiempo real
curl http://localhost:3000/api/kmz/owner-discovery/status | jq '.stats'

# Salida esperada:
{
  "totalKmz": 2324,
  "processingStatus": {
    "pending": 1200,      # Quedan por procesar
    "evidenceFound": 50,  # Con propietarios encontrados
    "confirmed": 10,      # Confirmados manualmente
    "skipped": 0
  },
  "averageConfidence": 0.68,
  "withEvidence": 50,
  "confirmed": 10
}
```

### 2. Database Supabase (Detalles completos)
**Ir a:** Supabase Console → SQL Editor

```sql
SELECT 
  file_name,
  metadata->>'public_owner_candidate' as owner,
  (metadata->>'owner_confidence')::float as confidence,
  metadata->'owner_research_leads' as sources,
  updated_at
FROM kmz_collection
WHERE metadata IS NOT NULL 
  AND metadata->>'owner_confidence' > '0'
ORDER BY updated_at DESC
LIMIT 50;
```

### 3. En la UI (Campos App)
Cuando se integre el componente `owner-intelligence-panel`:
- Navega a `/campos`
- Selecciona un KMZ
- Panel de "Owner Intelligence" mostrará:
  - Propietario encontrado
  - Confianza (0-1.0)
  - Fuentes (CBR, SEA, Municipal, etc.)
  - Botones de Confirmar/Rechazar

---

## Arquitectura del Procesamiento

```
┌─────────────────────────────────────────────────────────┐
│  Script: process-all-kmz.sh (47 lotes x 50 KMZ)        │
└─────────┬───────────────────────────────────────────────┘
          │
          ├─ Lote 1 (50 KMZ) ──────────────┐
          ├─ Lote 2 (50 KMZ) ──────────────┤
          ├─ ...                           ├─→ API /api/cron/kmz-owner-research
          ├─ Lote 47 (24 KMZ) ─────────────┤
          └────────────────────────────────┘
                                            │
          ┌─────────────────────────────────┘
          │
          ├─ owner-discovery-service.ts
          │  - Extrae ROL, Commune, propietarios
          │
          ├─ public-sources/owner-search.ts
          │  - Busca en CBR, SEA, Municipal, Government
          │
          ├─ search-cache.ts
          │  - Cache ROL+Commune (70-90% reducción)
          │
          ├─ owner-analyzer.ts (OpenAI API)
          │  - GPT-4o mini análisis
          │  - Calcula confianza (0-1.0)
          │  - Nunca inventa datos
          │
          └─ kmz-owner-enrichment.ts
             - Guarda metadata en Supabase
             - Preserva historial
             - Incrementalmente

          ↓

    📊 SUPABASE: kmz_collection.metadata
       {
         "public_owner_candidate": "Juan Pérez López",
         "owner_confidence": 0.85,
         "owner_research_leads": [
           { "source": "CBR", "confidence": 0.95, "found": true },
           { "source": "SEA", "confidence": 0.75, "found": true }
         ],
         "confirmed_owner": null,
         "cbr_registry_date": "2026-01-15"
       }
```

---

## Performance Targets

**Procesamiento:**
- ~1 archivo por segundo
- 50 archivos por lote: ~50 segundos
- 47 lotes totales: ~40-50 minutos (total)

**Costo OpenAI:**
- GPT-4o mini: ~$0.02 por análisis
- 2324 archivos: ~$46 total
- Con cache: ~$12-15 (70-90% reducción)

**Confianza:**
- Target promedio: >0.75
- CBR confirmado: 0.95+
- Múltiples fuentes: 0.80+

---

## Monitoreo Continuo

### Cada 30 minutos (automático)
```bash
# Status check
curl http://localhost:3000/api/kmz/owner-discovery/status | jq '.stats'

# Loguear progreso
echo "$(date): Procesando lotes..." >> /tmp/kmz-processing.log
```

### Dashboard Live (Ejecutar ahora)
```bash
chmod +x ./scripts/monitor-batch-progress.sh
./scripts/monitor-batch-progress.sh
```

### Alertas si hay problemas
```bash
# Si confianza muy baja (<0.5)
# Si errores > 10% de lote
# Si timeout > 30 segundos por lote
```

---

## Comandos Rápidos

| Acción | Comando |
|--------|---------|
| Ver progreso actual | `curl http://localhost:3000/api/kmz/owner-discovery/status \| jq` |
| Dashboard en vivo | `./scripts/monitor-batch-progress.sh` |
| Ver logs | `tail -f /tmp/batch-processing.log` |
| Procesar otro lote manual | `curl "http://localhost:3000/api/cron/kmz-owner-research?batch_size=50"` |
| Verificar BD | Supabase → SQL Editor → Ejecutar query |
| Revisar errores | `grep -i error /tmp/dev-server.log \| tail -20` |

---

## Cronograma Estimado

| Fase | Lotes | Archivos | Tiempo Est. | Confianza |
|------|-------|----------|-------------|-----------|
| 1 | 1-10 | 500 | 15 min | 0-0.3 (aprendizaje) |
| 2 | 11-25 | 750 | 25 min | 0.3-0.6 |
| 3 | 26-40 | 750 | 25 min | 0.6-0.8 |
| 4 | 41-47 | 324 | 15 min | 0.75+ (estable) |
| **Total** | **47** | **2,324** | **~80 min** | **0.68-0.78 avg** |

---

## Cuando Esté Completo

1. **Verificar resultados**
   - Query en Supabase: 2324 registros con metadata
   - Confianza promedio: 0.68-0.78
   - Cobertura: 60-80% con evidence

2. **Integrar UI**
   - Agregar `owner-intelligence-panel` a Campos
   - Usuarios verán propietarios propuestos
   - Pueden confirmar/rechazar

3. **Exportar reporte**
   - CSV con todos los descubrimientos
   - Por región/commune
   - Métricas de calidad

4. **Próximas mejoras**
   - Fine-tuning de prompts si confianza baja
   - Agregar más fuentes (registros privados)
   - Integración con CRM

---

## Apoyo

Si necesitas ver/detener el procesamiento:
```bash
# Ver proceso en background
ps aux | grep "process-all-kmz"

# Detener si es necesario (cuidado!)
pkill -f "process-all-kmz"
```

Toda documentación relevante:
- `QUICK_START.md` - Setup inicial
- `VIEW_LIVE_UPDATES.md` - Ver resultados
- `TROUBLESHOOTING.md` - Problemas y soluciones
- Este archivo - Procesamiento masivo

**¡El pipeline está en vivo y procesando los 2,324 archivos! ✅**
