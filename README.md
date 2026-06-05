# Sur-Realista

**Plataforma Inteligente de Valuación Inmobiliaria en Chile**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://surrealista.vercel.app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev)

---

## 🚀 Descripción

Sur-Realista es una plataforma de **valuación automática e inteligente de propiedades inmobiliarias** en Chile que integra:

- **Datos Reales**: SII (Servicio de Impuestos Internos), propiedades verificadas, portales inmobiliarios
- **Inteligencia Artificial**: Análisis automático, reconocimiento de intenciones, predicciones de mercado
- **Múltiples Metodologías**: Enfoque comparativo, avalúos fiscales, benchmarks de mercado
- **Interfaz Intuitiva**: Cotizador visual, Asistente IA, búsqueda avanzada

---

## 📋 Características

### Cotizador Inteligente
- Valuación en tiempo real de propiedades
- Análisis comparativo automático
- Integración con datos SII y BD
- Comparación con mercado vigente
- Rango de confianza estadístico

### Asistente IA
- Consultas en lenguaje natural
- Búsqueda geográfica inteligente
- Análisis de tendencias de mercado
- Recomendaciones de inversión
- Respuestas basadas en datos reales

### Búsqueda Avanzada
- Búsqueda por región y ciudad
- Filtros por tipo de propiedad
- Acceso rápido a herramientas
- Documentación completa

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.2.6
- **UI**: React 19.2.4 + Tailwind CSS 4.2.0
- **Components**: shadcn/ui
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (Vercel Serverless)
- **Database**: Supabase PostgreSQL
- **Client**: @supabase/supabase-js

### Infraestructura
- **Hosting**: Vercel
- **Git**: GitHub
- **CI/CD**: Automatic Vercel Deployments

---

## 📚 Documentación

Accede a documentación completa en la plataforma o en los archivos:

### Centro de Ayuda
**[`docs/CENTRO-DE-AYUDA.md`](./docs/CENTRO-DE-AYUDA.md)**
- Guías rápidas para usuarios
- Tutoriales paso a paso
- Preguntas frecuentes (FAQ)
- Cómo usar el Cotizador
- Cómo usar el Asistente IA

### Documentación Técnica
**[`docs/DOCUMENTACION-TECNICA.md`](./docs/DOCUMENTACION-TECNICA.md)**
- Arquitectura del sistema
- APIs disponibles
- Integración de datos
- Base de datos
- Deployment

### Documentación IA
**[`docs/DOCUMENTACION-IA.md`](./docs/DOCUMENTACION-IA.md)**
- Modelos IA utilizados
- Algoritmos de valuación
- Procesamiento de lenguaje natural
- Análisis predictivo
- Capacidades y limitaciones

### Guías de Usuario
**[`docs/GUIAS-USUARIO.md`](./docs/GUIAS-USUARIO.md)**
- Tutorial completo Cotizador
- Tutorial completo Asistente IA
- Búsqueda avanzada
- Casos de uso reales
- Troubleshooting

### API Reference
**[`docs/API.md`](./docs/API.md)**
- Documentación de endpoints
- Ejemplos de requests/responses
- Parámetros y validación
- Error handling

---

## 🚀 Inicio Rápido

### Acceso a Plataforma

```bash
# Accede a la plataforma en vivo
https://surrealista.vercel.app

# O a través de v0.app
https://v0.app/chat/projects/nWnsFTDFCfp
```

### Cotizador en 5 Minutos

1. Ve a **Herramientas** → **Cotizador**
2. Completa el formulario:
   - Tipo: Terreno
   - Región: Biobío
   - Área: 5000 m²
   - Estado: Bueno
3. Click en "Obtener Valuación"
4. ¡Listo! Tienes tu valuación estimada

### Asistente IA

1. Ve a **Herramientas** → **Asistente IA**
2. Haz una pregunta:
   ```
   "¿Qué archivos KMZ tengo en Valdivia?"
   "¿Cómo está el mercado en Metropolitana?"
   "¿Dónde debo invertir?"
   ```
3. El asistente analiza y responde

---

## 🔧 Instalación Local

### Requisitos Previos

- Node.js 18+
- npm/pnpm/yarn
- Cuenta Supabase
- Variables de entorno

### Setup

```bash
# Clonar repositorio
git clone https://github.com/traviscomber/surrealista.git
cd surrealista

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales
# NEXT_PUBLIC_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

# Ejecutar en desarrollo
pnpm dev

# Acceder en http://localhost:3000
```

### Variables de Entorno Requeridas

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📊 Fuentes de Datos

### 1. SII (Servicio de Impuestos Internos)
- **Tabla**: `sii_coordinate_extractions`
- **Datos**: Avalúos fiscales reales, áreas, ubicaciones
- **Confiabilidad**: ⭐⭐⭐⭐⭐ Muy Alta (Oficial)
- **Actualización**: Trimestral

### 2. Base de Datos Interna
- **Tabla**: `properties_enhanced`
- **Datos**: Propiedades verificadas, precios transados
- **Confiabilidad**: ⭐⭐⭐⭐ Alta
- **Actualización**: Continua

### 3. Mercado Vigente
- **Fuentes**: Portalinmobiliario, Vivanuncios, Inmuebles24
- **Datos**: Precios actuales de mercado
- **Confiabilidad**: ⭐⭐⭐ Media-Alta
- **Actualización**: Diaria

---

## 🤖 Inteligencia Artificial

### Algoritmo de Valuación

```
PRECIO = (SII_Data × 0.40 + BD_Data × 0.35 + Internet × 0.25) × Condition × Features
```

### Metodologías

1. **Enfoque Comparativo** (Prioridad 1)
   - Analiza propiedades similares
   - Ajusta por características
   - Genera intervalo de confianza

2. **Avalúos Fiscales** (Prioridad 2)
   - Datos oficiales SII
   - Altamente confiables
   - Históricamente validados

3. **Benchmarks** (Prioridad 3)
   - Análisis estadístico regional
   - Comparación con mercado
   - Tendencias históricas

### Capacidades IA

- ✓ Reconocimiento de 8+ tipos de intenciones
- ✓ Extracción automática de entidades
- ✓ Mapeo inteligente de ciudades a regiones
- ✓ Análisis de tendencias de mercado
- ✓ Generación de recomendaciones personalizadas

---

## 📊 APIs Principales

### Cotizador

```bash
POST /api/cotizador/valuar

Request:
{
  "property_type": "terreno",
  "region": "Biobío",
  "area_sqm": 5000,
  "condition": "bueno",
  "features": "piscina, terraza"
}

Response:
{
  "estimated_price": 42500000,
  "price_range": { "min": 36125000, "max": 48875000 },
  "price_per_sqm": 8500,
  "confidence": 85,
  "methodology": "Enfoque Comparativo Directo",
  "data_sources": ["SII", "Properties Enhanced"]
}
```

### Asistente IA

```bash
POST /api/ai-assistant

Request:
{
  "query": "¿Qué archivos KMZ tengo en Valdivia?"
}

Response:
{
  "response": "Encontré 3 archivos con 45 ubicaciones...",
  "type": "region_search",
  "data": { "total_files": 3, "total_locations": 45 }
}
```

---

## 📈 Precisión y Confianza

### Nivel de Confianza

```
Datos Disponibles  | Confianza | Interpretación
-------------------|-----------|----------------
Múltiples comparables | 80-95%  | ✓ Muy Confiable
Pocos comparables  | 65-75%    | ⚠ Moderada
Sin comparables    | 50-60%    | ⚠ Usar con cautela
```

### Margen de Error

- Con múltiples fuentes: ±5-10%
- Con pocas fuentes: ±15-20%
- Mercados especializados: ±20-30%

**Nota**: Las valuaciones son aproximaciones. Para decisiones importantes, solicita tasación oficial.

---

## 🔐 Seguridad

- ✓ HTTPS en producción
- ✓ Validación de entrada en todas las APIs
- ✓ Supabase RLS (Row Level Security)
- ✓ Backups automáticos
- ✓ Logs de auditoría

---

## 📱 Soporte de Navegadores

- ✓ Chrome 90+
- ✓ Firefox 88+
- ✓ Safari 14+
- ✓ Edge 90+

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios significativos:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

---

## 📞 Contacto y Soporte

- **Documentación Completa**: [`/docs`](./docs)
- **Centro de Ayuda**: [`docs/CENTRO-DE-AYUDA.md`](./docs/CENTRO-DE-AYUDA.md)
- **Issues**: Abre un issue en GitHub
- **Sugerencias**: Contributions welcome

---

## 🎯 Roadmap

### Próximas Mejoras

- [ ] Análisis de rentabilidad de arriendos
- [ ] Estimación de costos de construcción
- [ ] Predicción de demanda a largo plazo
- [ ] Análisis de impacto regulatorio
- [ ] Mobile app
- [ ] Exportación de reportes PDF
- [ ] Integración con sistemas de financiamiento

---

## 👥 Créditos

Desarrollado con [v0.app](https://v0.app) por [Travis Comber](https://github.com/traviscomber)

Integración de datos: Supabase, SII, Portales Inmobiliarios

---

## 📊 Estado del Proyecto

- **Status**: ✅ En Producción
- **Última Actualización**: 2025-03
- **Versión**: 1.0.0
- **Estabilidad**: Estable

---

**Built with ❤️ using v0.app and Next.js**
