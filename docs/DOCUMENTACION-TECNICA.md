# Documentación Técnica - Sur-Realista

## Arquitectura, APIs y Especificaciones Técnicas

### Tabla de Contenidos
1. [Arquitectura General](#arquitectura)
2. [Stack Tecnológico](#stack)
3. [APIs Disponibles](#apis)
4. [Integración de Datos](#integracion)
5. [Seguridad](#seguridad)
6. [Performance](#performance)

---

## Arquitectura General {#arquitectura}

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   Cliente (Frontend)                     │
│              Next.js 16 + React 19 + Tailwind            │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ├── /cotizador
                    ├── /asistente-ia
                    ├── /busqueda
                    └── /documentacion
                    │
┌───────────────────▼─────────────────────────────────────┐
│                   Backend (API Routes)                   │
│            Next.js Server Functions + Vercel             │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
┌───────▼──┐ ┌─────▼──┐ ┌─────▼─┐ ┌────────▼──┐
│  Supabase│ │  SII   │ │Internet│ │  AI/ML   │
│PostgreSQL│ │ Data   │ │Sources │ │ Services │
└──────────┘ └────────┘ └───────┘ └──────────┘
```

### Componentes Principales

**Frontend**:
- Pages: `/cotizador`, `/asistente-ia`, `/busqueda`
- Components: Reusable UI components
- Layout: Header, Navigation, Footer
- Utilities: Helper functions

**Backend**:
- API Routes: `/app/api/`
- Database: Supabase PostgreSQL
- Integration: External data sources
- Processing: AI analysis and calculations

---

## Stack Tecnológico {#stack}

### Frontend
```
- Framework: Next.js 16.2.6
- Runtime: React 19.2.4
- Styling: Tailwind CSS 4.2.0
- UI Components: shadcn/ui
- Icons: Lucide React
- HTTP Client: Built-in fetch
```

### Backend
```
- Runtime: Node.js (Vercel Serverless)
- Framework: Next.js API Routes
- Database: Supabase PostgreSQL
- Client: @supabase/supabase-js
- Authentication: Built-in JWT
```

### DevOps
```
- Hosting: Vercel
- Git: GitHub
- Database: Supabase
- CI/CD: Vercel Deployments
- Monitoring: Vercel Analytics
```

---

## APIs Disponibles {#apis}

### 1. Cotizador API

**Endpoint**: `POST /api/cotizador/valuar`

**Request Body**:
```json
{
  "property_type": "terreno|casa|departamento|comercial|agrícola|industrial",
  "region": "Metropolitana|Valparaíso|Los Lagos|Biobío|...",
  "city": "Santiago|Viña del Mar|...",
  "area_sqm": 5000,
  "condition": "excelente|bueno|regular|reparacion|construccion|sin-mejoras",
  "features": "piscina, estacionamiento, jardín",
  "additional_info": "Información adicional relevante"
}
```

**Response**:
```json
{
  "estimated_price": 42500000,
  "price_range": {
    "min": 36125000,
    "max": 48875000
  },
  "price_per_sqm": 8500,
  "methodology": "Enfoque Comparativo Directo - Análisis de 8 propiedades similares",
  "confidence": 85,
  "market_factors": [
    "Precio promedio de comparables: $8,500/m²",
    "Número de propiedades similares: 8",
    "Ajuste por estado: 100%",
    "Bonificación por características: +10%"
  ],
  "internet_comparison": {
    "price_per_sqm": 8200,
    "source": "Portalinmobiliario - Marzo 2025",
    "difference_percentage": 3,
    "interpretation": "Precio alineado con mercado vigente"
  },
  "recommendations": [
    "Propiedad en buenas condiciones - lista para ocupación",
    "Realizar tasación oficial para trámites bancarios"
  ],
  "data_sources": [
    "Properties Enhanced (BD Real)",
    "8 comparables similares",
    "Datos de internet actualizado: Portalinmobiliario - Marzo 2025"
  ]
}
```

**Error Responses**:
```json
{
  "error": "Datos incompletos" // 400
}

{
  "error": "Área inválida" // 400
}

{
  "error": "Error procesando valuación" // 500
}
```

### 2. Asistente IA API

**Endpoint**: `POST /api/ai-assistant`

**Request Body**:
```json
{
  "query": "¿Qué archivos KMZ tengo en Valdivia?",
  "context": "optional context"
}
```

**Response**:
```json
{
  "response": "**Archivos Geográficos KMZ en Los Ríos**\n\n📊 **Resultados:** 3 archivos con 45 ubicaciones registradas...",
  "type": "region_search|market_analysis|investment_advice|general",
  "data": {
    "total_files": 3,
    "total_locations": 45,
    "by_city": {
      "Valdivia": 28,
      "Panguipulli": 17
    }
  }
}
```

---

## Integración de Datos {#integracion}

### Fuentes de Datos

**1. SII (Servicio de Impuestos Internos)**
- Tabla: `sii_coordinate_extractions`
- Campos: `avaluo_total`, `built_area`, `surface_area`, `region`, `city`
- Actualización: Trimestral
- Confiabilidad: Muy Alta (Oficial)

**2. Properties Enhanced**
- Tabla: `properties_enhanced`
- Campos: `price`, `square_meters`, `property_type`, `region`, `city`
- Actualización: Continua
- Confiabilidad: Alta

**3. Opportunities**
- Tabla: `opportunities`
- Campos: `price`, `area_sqm`, `location`, `property_type`, `market_trend`
- Actualización: Semanal
- Confiabilidad: Media-Alta

**4. KMZ Search Index**
- Tabla: `kmz_search_index`
- Campos: `name`, `region`, `city`, `address`, `placemark_count`
- Actualización: Continua
- Confiabilidad: Alta

**5. Internet Sources**
- Fuentes: Portalinmobiliario, Vivanuncios, Inmuebles24
- Actualización: Diaria
- Confiabilidad: Media (Mercado vigente)

### Pipeline de Datos

```
Raw Data (SII, BD, Internet)
        ↓
Validación y Limpieza
        ↓
Normalización (Formato común)
        ↓
Enriquecimiento (Análisis adicional)
        ↓
Indexación (Búsqueda rápida)
        ↓
Caché (Redis/Memoria)
        ↓
APIs Disponibles
```

---

## Seguridad {#seguridad}

### Autenticación y Autorización

- Todas las APIs requieren solicitud válida
- No requieren API Key por defecto (público)
- Datos sensibles están protegidos por RLS (Row Level Security)

### Validación de Entrada

```typescript
// Validación en todas las APIs
- Tipos de datos verificados
- Rangos numéricos validados
- Strings sanitizados
- Parámetros requeridos chequeados
```

### Protección de Datos

- HTTPS obligatorio en producción
- Supabase maneja encriptación de tránsito
- Backups automáticos diarios
- Logs de auditoría activados

---

## Performance {#performance}

### Optimizaciones Implementadas

**Frontend**:
- Code splitting automático
- Lazy loading de componentes
- Image optimization
- CSS minification
- JavaScript bundling

**Backend**:
- Database query optimization
- Caching de resultados frecuentes
- Connection pooling
- Índices en tablas principales

**Infraestructura**:
- Vercel CDN global
- Edge functions cuando disponibles
- Automatic scaling
- Serverless infrastructure

### Tiempos de Respuesta Típicos

```
Cotización simple: 200-400ms
Análisis con comparables: 500-800ms
Búsqueda IA: 1000-2000ms
Search index query: 50-200ms
```

### Límites de Rate Limiting

- Sin límite configurado (público)
- Puede implementarse a nivel Vercel si es necesario

---

## Base de Datos

### Tablas Principales

```sql
-- Propiedades
properties_enhanced {
  id UUID,
  price DECIMAL,
  square_meters INT,
  property_type VARCHAR,
  region VARCHAR,
  city VARCHAR,
  bedrooms INT,
  bathrooms INT,
  created_at TIMESTAMP
}

-- Avalúos SII
sii_coordinate_extractions {
  id UUID,
  avaluo_total DECIMAL,
  built_area INT,
  surface_area INT,
  region VARCHAR,
  city VARCHAR,
  property_type VARCHAR
}

-- Oportunidades
opportunities {
  id UUID,
  price DECIMAL,
  area_sqm INT,
  location VARCHAR,
  property_type VARCHAR,
  market_trend VARCHAR
}

-- Índice de búsqueda KMZ
kmz_search_index {
  id UUID,
  kmz_id VARCHAR,
  name VARCHAR,
  region VARCHAR,
  city VARCHAR,
  address VARCHAR,
  placemark_count INT
}
```

---

## Deployment

### Environment Variables Requeridas

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Deploy en Vercel

```bash
# Automatic deployment on push to main
git push origin main
```

---

## Monitoreo y Debugging

### Logs Disponibles

- Vercel function logs
- Supabase query logs
- Client-side console logs

### Debugging Local

```bash
npm run dev
# Servidor en http://localhost:3000
```

---

Ver también: [Documentación IA](./DOCUMENTACION-IA.md) | [API Reference](./API.md)
