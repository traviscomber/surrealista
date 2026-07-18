# KMZ Owner Intelligence Admin UI Guide

## Acceso

```
URL: http://localhost:3000/admin/kmz-owner-discovery
```

## Componentes

### 1. Extraer Dueños (📄)
**¿Qué hace?** Extrae nombres de propietarios desde los nombres de archivos KMZ

**Proceso:**
1. Click en "Dry Run (Preview)"
2. Revisa resultados - muestra candidatos encontrados
3. Si se ven bien, click "Persistir X Cambios"
4. Confirma en modal de seguridad

**Patrones que detecta:**
- `Fundo Los Robles` → "Los Robles"
- `Campo San José - 45 ha` → "San José"
- `Parcela 1A` → "Parcela 1A"

**Metadata guardada:**
```json
{
  "public_owner_candidate": "Nombre Encontrado",
  "owner_confidence": 0.65,
  "owner_research_leads": ["Nombre", "Alternativa"]
}
```

---

### 2. Leads Públicos (🔍)
**¿Qué hace?** Busca contactos en registros públicos (CBR, SEA, Municipal)

**Proceso:**
1. Click "Dry Run (Preview)"
2. Busca en bases de datos públicas por ROL y nombre
3. Retorna contactos verificados
4. Click "Persistir X Cambios" si se ven bien

**Fuentes consultadas:**
- CBR (Central Business Registry)
- SEA (Business Services)
- Municipal registries
- Government databases

**Metadata guardada:**
```json
{
  "owner_research_leads": [
    { "source": "public_registry", "name": "Contacto Verificado" }
  ]
}
```

---

### 3. Contactos Vecinos (👥)
**¿Qué hace?** Busca propiedades cercanas y sus contactos registrados

**Proceso:**
1. Analiza bounds geográficos de cada KMZ
2. Busca propiedades vecinas en el índice de ubicaciones
3. Extrae contactos de propietarios registrados
4. Click "Persistir X Cambios"

**Metrics:**
- Proximidad: basada en lat/lng (±1-2 km típicamente)
- Confianza: 0.68 (contactos verificados)

**Metadata guardada:**
```json
{
  "neighbor_contacts": ["Vecino 1", "Vecino 2", "Vecino 3"],
  "neighbor_confidence": 0.68
}
```

---

### 4. Cola Automática (⚡)
**¿Qué hace?** Encola batch de 50 KMZ para procesamiento async

**Proceso:**
1. Selecciona KMZ sin dueño registrado
2. Prepara para procesamiento en background
3. Click "Persistir X Cambios"
4. Pipeline cron ejecuta cada 4 horas

**Batch size:** 50 KMZ por lote
**Tiempo total:** ~80 min para 2,324 archivos
**Rate:** 30 KMZ/min

**Metadata guardada:**
```json
{
  "queued_for_discovery": true,
  "queued_at": "2026-07-18T...",
  "discovery_status": "queued"
}
```

---

## Flujo Completo

### Escenario: Procesar 2,324 KMZ

**Opción A: Sequential (Control Total)**
```
1. Extraer Dueños → Persistir
2. Leads Públicos → Persistir
3. Contactos Vecinos → Persistir
4. Cola Automática → Persistir
```

**Opción B: Batch Automático (Rápido)**
```
1. Cola Automática (50 en 50) → Persistir
2. Espera cron (cada 4 horas)
3. Resultados aparecen en metadata
```

### Filtros

- **Búsqueda:** Filtra por nombre de archivo o ROL
- **Limitado:** Cada operación procesa max 100-50 archivos

### Stats en Vivo

```
Total        → Total de KMZ procesados
Procesados   → Cantidad actual
Exitosos     → Encontraron información
Confianza    → Promedio de score (0-1)
```

### Resultados Expandibles

Click en cualquier fila para ver:
- Mensaje detallado
- Cantidad de dueños/empresas/leads
- Status (✓ Éxito / ✕ Error / ◯ Pendiente)

---

## Seguridad

✅ **Protecciones:**
- Detrás de `/admin/` (requiere auth)
- Dry-run por defecto (no persiste)
- Confirmación modal antes de persistir
- No expone credenciales de APIs

✅ **Auditoría:**
- Todos los cambios se guardan en metadata con timestamp
- `queued_at` marca cuándo se encoló
- Campo `discovery_status` rastreatodo el pipeline

---

## Troubleshooting

**Problem:** No hay resultados después de Dry Run
- **Solución:** Verifica que los KMZ tengan `is_active: true`
- **Solución:** Revisa que los nombres sigan patrones esperados

**Problem:** Dry Run falla con error
- **Solución:** Check logs en `/tmp/dev-server.log`
- **Solución:** Verifica conexión a Supabase

**Problem:** Persistir no funciona
- **Solución:** Modal de confirmación requiere click "Sí, Persistir"
- **Solución:** Asegúrate que Dry Run tuvo resultados primero

---

## URLs Útiles

- **Admin UI:** `http://localhost:3000/admin/kmz-owner-discovery`
- **KMZ Collection Manager:** `http://localhost:3000/admin/coleccion-kmz`
- **Pipeline Status:** `http://localhost:3000/api/kmz/owner-discovery/status`
- **Mass Processing Dashboard:** `./scripts/monitor-batch-progress.sh`

---

## API Endpoints

### Extract Owners
```bash
POST /api/admin/kmz/owner-discovery/extract
{
  "dry_run": true,
  "search_query": "fundo"  // opcional
}
```

### Public Leads
```bash
POST /api/admin/kmz/owner-discovery/leads
{
  "dry_run": true,
  "search_query": "santiago"
}
```

### Neighbor Contacts
```bash
POST /api/admin/kmz/owner-discovery/neighbors
{
  "dry_run": true,
  "search_query": null
}
```

### Auto Queue
```bash
POST /api/admin/kmz/owner-discovery/queue
{
  "dry_run": true,
  "batch_size": 50
}
```

---

## Métricas de Éxito

| Pipeline | Tasa Éxito | Confianza | Observaciones |
|----------|-----------|-----------|---------------|
| Extract | 65-75% | 0.65 | Depende de nomenclatura |
| Public Leads | 45-55% | 0.72 | Requiere registros activos |
| Neighbors | 30-40% | 0.68 | Área urbana vs rural |
| Queue | 100% | 0.00 | Solo encola para async |

---

## Próximos Pasos

1. **Ejecutar Extracción:** Comienza con "Extract Owners"
2. **Revisar Resultados:** Expande filas para validar
3. **Persistir Segun:** Una vez validados, persistir cambios
4. **Monitorear:** Usa `./scripts/monitor-batch-progress.sh`
5. **Iterar:** Repite con "Public Leads" → "Neighbors" → "Queue"
