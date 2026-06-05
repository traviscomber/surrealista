# Sistema de Búsqueda de Ubicaciones KMZ

## Descripción General

Este sistema indexa automáticamente todas las ubicaciones de tus archivos KMZ y permite búsquedas rápidas por:
- **Nombre de ubicación** - Busca lugares específicos
- **Región** - Busca por región o zona geográfica
- **Nombre de archivo KMZ** - Encuentra archivos por nombre

## Componentes del Sistema

### 1. Base de Datos
- **Tabla `kmz_location_index`** - Almacena todas las ubicaciones indexadas
  - `id` - Identificador único
  - `name` - Nombre de la ubicación
  - `type` - Tipo: Point, LineString, Polygon
  - `coordinates` - Coordenadas en formato GeoJSON
  - `region` - Región geográfica
  - `kmz_collection_id` - Referencia al archivo KMZ original
  - `kmz_file_url` - URL del archivo KMZ
  - `kmz_file_name` - Nombre del archivo KMZ
  - `indexed_at` - Fecha de indexación

### 2. Servicios

#### KMZLocationIndexer (`lib/kmz/kmz-location-indexer.ts`)
Extrae ubicaciones de archivos KMZ:
```typescript
const indexer = new KMZLocationIndexer()
const count = await indexer.indexKMZFile(kmzUrl, collectionId, fileName)
```

#### KMZLocationSearch (`lib/kmz/kmz-location-search.ts`)
Realiza búsquedas:
```typescript
// Buscar por nombre
const results = await KMZLocationSearch.searchByName("playa")

// Buscar por región
const results = await KMZLocationSearch.searchByRegion("Costa Atlántica")

// Buscar por archivo KMZ
const results = await KMZLocationSearch.searchByKMZFile("propiedades.kmz")

// Buscar ubicaciones cercanas
const nearby = await KMZLocationSearch.findNearby(lat, lon, radiusKm)
```

### 3. APIs

#### POST `/api/kmz/index-locations`
Indexa un archivo KMZ específico
```json
{
  "kmzUrl": "https://...",
  "kmzFileName": "archivo.kmz",
  "collectionId": "123"
}
```

#### POST `/api/admin/kmz/batch-index`
Indexa todos los archivos KMZ existentes (requiere autenticación de admin)

#### POST `/api/admin/kmz/rebuild-index`
Reconstruye el índice completo

### 4. UI Components

#### KMZLocationSearchComponent (`components/kmz/kmz-location-search-component.tsx`)
Componente interactivo de búsqueda:
- Búsqueda por ubicación, región o archivo
- Visualización de resultados agrupados por archivo
- Estadísticas de indexación
- Previsualización de coordenadas

#### Página de búsqueda (`app/kmz-search/page.tsx`)
Página completa dedicada a la búsqueda de ubicaciones

## Flujo de Funcionamiento

### Indexación Automática
1. Usuario sube un archivo KMZ a través de la interfaz de arrastrar y soltar
2. Archivo se guarda en Supabase Storage
3. Se dispara automáticamente `/api/kmz/index-locations`
4. Las ubicaciones se extraen y almacenan en `kmz_location_index`

### Indexación en Lote
1. Ejecutar la API de admin: `POST /api/admin/kmz/batch-index`
2. Se procesan todos los archivos KMZ existentes
3. Se evitan duplicados verificando URLs ya indexadas

### Búsqueda
1. Usuario accede a `/kmz-search`
2. Selecciona tipo de búsqueda: ubicación, región o archivo
3. Ingresa término de búsqueda
4. Se muestran todos los archivos KMZ que contienen ese término
5. Resultados agrupados por archivo con contador de ubicaciones

## Instalación y Configuración

### 1. Ejecutar Migración
```bash
# La tabla se crea automáticamente al ejecutar la migración SQL
```

### 2. Indexar KMZ Existentes
```bash
curl -X POST http://localhost:3000/api/admin/kmz/batch-index \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Acceder a la Búsqueda
Navega a `/kmz-search` en tu aplicación

## Ejemplos de Uso

### Búsqueda por Ubicación
- "playa" - Encuentra todas las ubicaciones con "playa" en el nombre
- "rio" - Busca todas las ubicaciones relacionadas con ríos
- "lago" - Encuentra lagos indexados

### Búsqueda por Región
- "Costa Atlántica"
- "Patagonia"
- "Misiones"

### Búsqueda por Archivo
- "propiedades.kmz"
- "terrenos"
- "2024"

## Características Avanzadas

### Búsqueda Cercana
```typescript
const nearby = await KMZLocationSearch.findNearby(-34.6037, -58.3816, 5)
// Encuentra todas las ubicaciones dentro de 5km
```

### Estadísticas
```typescript
const stats = await KMZLocationSearch.getStatistics()
// Retorna: total de ubicaciones, archivos, distribución por tipo
```

### Exportar Resultados
Los resultados pueden exportarse como:
- GeoJSON
- CSV
- JSON

## Notas de Rendimiento

- Las búsquedas utilizan índices full-text para rápida recuperación
- Las coordenadas se almacenan en formato GeoJSON
- Máximo 10MB por archivo KMZ
- Se indexan automáticamente: Point, LineString, Polygon

## Troubleshooting

### Las ubicaciones no aparecen
1. Verificar que el archivo KMZ sea válido
2. Ejecutar `/api/admin/kmz/batch-index` para forzar re-indexación
3. Revisar logs para errores de parsing

### Búsqueda lenta
1. Asegurar que los índices estén creados
2. Limitar cantidad de resultados
3. Usar búsqueda por región en lugar de ubicación específica

## Futuros Mejoras

- [ ] Búsqueda por rango de coordenadas (bounding box)
- [ ] Filtros por tipo de geometría
- [ ] Exportación de resultados
- [ ] Mapa interactivo de resultados
- [ ] Historial de búsquedas frecuentes
