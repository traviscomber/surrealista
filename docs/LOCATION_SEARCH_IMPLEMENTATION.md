# Búsqueda por Ubicación en CAMPOS - Plan de Implementación

## Contexto Actual
- CAMPOS filtra por nombre de región y nombre de archivo
- Ya existe estructura `location: { lat, lng }` en los items
- El componente usa `useMemo` para filtrado eficiente
- Se carga toda la metadata al inicio (`loadRegionMetadata()`)

## Problema
- No hay forma de filtrar/buscar por ubicación (región, área)
- La carga es "todo o nada" - espera a cargar toda la metadata
- Para grandes volúmenes de datos, esto es lento

## Solución Propuesta

### 1. Búsqueda por Ubicación (Filtrado)
**Agregar entrada de búsqueda de ubicación/región:**
```
┌─────────────────────────────────────┐
│ 🔍 Buscar por nombre de archivo     │
│ 📍 Filtrar por región/ubicación     │ ← NUEVO
└─────────────────────────────────────┘
```

**Implementación:**
- Selector/dropdown con regiones disponibles (se extrae de `folders.map(f => f.name)`)
- Al seleccionar región, mostrar solo esa región y sus archivos
- Combinable con búsqueda de texto

### 2. Carga Progresiva (Lazy Loading)
**Cambio en flujo:**
1. **Antes**: `loadRegionMetadata()` → espera todo → renderiza
2. **Después**: `loadRegionMetadata()` → renderiza regiones vacías → carga datos por región en background

**Implementación:**
```typescript
// Por cada región en las carpetas:
// - Mostrar en UI inmediatamente (nombre, ubicación si existe)
// - En background: cargar detalles (archivos KMZ, metadata)
// - Mostrar skeleton/loading mientras se carga
// - Actualizar UI cuando termine
```

### 3. Estructura de Cambios

#### Archivo: `campos-folder-view.tsx`
**Agregar estados:**
```typescript
const [selectedRegion, setSelectedRegion] = useState<string | null>(null) // Filtro de región
const [loadingRegions, setLoadingRegions] = useState<Set<string>>(new Set()) // Regiones en carga
const [regionDataCache, setRegionDataCache] = useState<Record<string, any>>({}) // Cache de datos por región
```

**Agregar funciones:**
```typescript
// Obtener lista de regiones disponibles
const uniqueRegions = useMemo(() => {
  return [...new Set(folders.map(f => f.name))].sort()
}, [folders])

// Cargar datos de una región específica en background
const loadRegionDataAsync = useCallback(async (regionName: string) => {
  // Si ya está cargado, saltar
  if (regionDataCache[regionName]) return
  
  setLoadingRegions(prev => new Set(prev).add(regionName))
  try {
    const { data } = await supabase
      .from("kmz_collection")
      .select("*")
      .eq("region", regionName)
      .eq("is_active", true)
    
    setRegionDataCache(prev => ({
      ...prev,
      [regionName]: data
    }))
  } finally {
    setLoadingRegions(prev => {
      const next = new Set(prev)
      next.delete(regionName)
      return next
    })
  }
}, [regionDataCache])

// Filtrar carpetas basado en región seleccionada
const filteredFolders = useMemo(() => {
  let result = folders
  
  if (selectedRegion) {
    result = folders.filter(f => f.name === selectedRegion)
  }
  
  // Aplicar filtro de búsqueda de texto existente
  return result.map(folder => {
    const searchLower = deferredSearchQuery.toLowerCase()
    const regionMatches = folder.name.toLowerCase().includes(searchLower)
    
    const filteredChildren = folder.children?.filter(child => {
      const childNameMatches = child.name.toLowerCase().includes(searchLower)
      const areaMatches = child.area?.toLowerCase().includes(searchLower) || false
      return childNameMatches || areaMatches
    }) || []
    
    if (!deferredSearchQuery.trim()) {
      return folder
    }
    
    if (regionMatches || filteredChildren.length > 0) {
      return {
        ...folder,
        children: regionMatches ? folder.children : filteredChildren
      }
    }
    
    return null
  }).filter(Boolean)
}, [folders, selectedRegion, deferredSearchQuery])
```

#### En el Render (UI):
```tsx
{/* Selector de región - NUEVO */}
<div className="flex gap-2">
  <select 
    value={selectedRegion || ''}
    onChange={(e) => setSelectedRegion(e.target.value || null)}
    className="flex-1 px-3 py-2 bg-background border rounded text-sm"
  >
    <option value="">Todas las regiones</option>
    {uniqueRegions.map(region => (
      <option key={region} value={region}>{region}</option>
    ))}
  </select>
</div>

{/* Mostrar regiones con estado de carga */}
{filteredFolders.map(folder => (
  <div
    key={folder.id}
    onMouseEnter={() => loadRegionDataAsync(folder.name)} // Cargar en background al hover
  >
    {loadingRegions.has(folder.name) && (
      <Badge>Cargando...</Badge>
    )}
    {/* resto del folder rendering */}
  </div>
))}
```

## Beneficios
- ✅ Búsqueda por región/ubicación
- ✅ Carga progresiva - UI responsiva
- ✅ Cache local para evitar re-cargas
- ✅ Sin cambios en API/DB
- ✅ Compatible con búsqueda de texto existente

## Alternativa: Búsqueda Geoespacial (Avanzada)
Si en futuro se requiere:
- Búsqueda por radio (ej: 10km alrededor de coordenadas)
- Necesitaría: funciones PostGIS en BD + input de lat/lng
- Usar componente `AdvancedGeoSearch` que ya existe en el codebase

## Fases de Implementación
1. **Fase 1**: Agregar selector de región (simple)
2. **Fase 2**: Agregar carga progresiva por región (optimización)
3. **Fase 3**: Cache persistente entre navegaciones
4. **Fase 4**: Búsqueda geoespacial (si se necesita)

## Tiempo Estimado
- Fase 1: 20-30 minutos
- Fase 2: 30-45 minutos
- Fase 3: 15-20 minutos
- Total: ~1 hora

