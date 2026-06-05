# Asistente IA de Datos - Guía Completa

## Descripción General

El **Asistente IA de Datos** es una interfaz conversacional integrada con tus datos en tiempo real, incluyendo:

- 📁 Google Drive (carpetas y archivos)
- 🗺️ Archivos KMZ (mapas geoespaciales)
- 📊 Base de datos Supabase
- 📚 Documentos indexados

## Acceso

- **URL**: `/asistente-ia`
- **Requisitos**: Estar logeado en Sur-Realista

## Capacidades Principales

### 1. Análisis de Archivos KMZ

El asistente puede consultar tus archivos KMZ en tiempo real con preguntas como:

```
¿Cuántos archivos KMZ tengo?
¿Qué KMZ hay en la Región de Los Lagos?
Dame estadísticas de mis archivos KMZ
¿Cuántos puntos tengo en total?
```

**Datos que proporciona:**
- Total de archivos KMZ
- Puntos/placemarks por archivo
- Distribución por región
- Últimos archivos agregados
- Estadísticas detalladas

### 2. Búsqueda de Documentos

```
Buscar contratos
Encontrar documentos de Puerto Varas
¿Qué carpetas tengo?
```

### 3. Exploración de Carpetas

```
¿Qué carpetas tengo en Google Drive?
Muéstrame la estructura de carpetas de CAMPOS
¿Cuántos archivos hay en [carpeta]?
```

### 4. Análisis de Datos

```
Dame estadísticas de mis archivos
Estadísticas de KMZ completas
Resume los documentos del cliente X
```

## Características Técnicas

### Base de Datos KMZ

El asistente accede a la tabla `kmz_collection` que contiene:

```sql
- file_name: Nombre del archivo KMZ
- region: Región geográfica
- placemarks_count: Cantidad de puntos/ubicaciones
- created_at: Fecha de carga
- file_id: ID único del archivo
```

### Consultas Inteligentes

El asistente puede:
- ✅ Filtrar por región (ej: "Los Lagos", "Aysén", etc.)
- ✅ Contar placemarks totales
- ✅ Agrupar por región
- ✅ Mostrar últimos archivos
- ✅ Calcular estadísticas

### Procesamiento de Lenguaje Natural

El asistente entiende:
- Palabras clave: "kmz", "mapa", "región", "archivo", "estadísticas"
- Variaciones: "¿cuántos?", "dame", "muéstrame", "lista de"
- Nombres de regiones: "Los Lagos", "Región de Aysén", "Magallanes"

## Ejemplos de Uso

### Consulta 1: Estadísticas Generales

**Usuario:** "¿Cuántos archivos KMZ tengo?"

**Respuesta:**
```
🗺️ Estadísticas de Archivos KMZ:

Resumen General:
• Total de archivos: 42
• Total de puntos: 12,847
• Regiones cubiertas: 8

Top Regiones:
• Los Lagos: 15 archivos
• Aysén: 8 archivos
• Magallanes: 6 archivos
• Atacama: 5 archivos
• Antofagasta: 3 archivos

Últimos archivos agregados:
• Faro Corona Los Lagos (847 puntos)
• Puerto Varas Industrial (423 puntos)
• Aysén Carretera (312 puntos)
```

### Consulta 2: Archivos por Región

**Usuario:** "¿Qué KMZ hay en Los Lagos?"

**Respuesta:**
```
🗺️ Archivos KMZ en Región de Los Lagos:

• Faro Corona Los Lagos (847 puntos)
• Puerto Varas Industrial (423 puntos)
• Osorno Agricultural (156 puntos)
• Pucón Tourism (234 puntos)
[... más archivos]

Total en región: 15 archivos con 4,328 puntos
```

## Acciones Rápidas

El asistente ofrece botones de acceso rápido para:

```
📁 Listar carpetas
🔍 Buscar documentos
🗺️ Archivos KMZ
📂 Estructura de carpetas
📄 Archivos recientes
📊 Estadísticas
🌎 KMZ por Región
❓ Ayuda
```

## Integración con el Sistema

### Bases de Datos Conectadas

1. **Supabase - `kmz_collection`**
   - Datos en tiempo real
   - Actualización automática al cargar nuevos KMZ
   - Indexación para búsquedas rápidas

2. **Google Drive API** (cuando está conectado)
   - Listado de carpetas
   - Búsqueda de documentos
   - Metadata de archivos

3. **Supabase - `agent_interactions`**
   - Registro de todas las consultas
   - Historial de sesiones
   - Análisis de uso

## Mejoras Futuras

- [ ] Análisis de geometría de KMZ (distancias, áreas)
- [ ] Búsqueda geoespacial ("archivos cerca de coordenada X,Y")
- [ ] Generación de mapas desde consultas
- [ ] Exportación de resultados (CSV, GeoJSON)
- [ ] Integración con análisis de propiedades
- [ ] Recomendaciones basadas en historial

## Solución de Problemas

### "Drive Desconectado"

Si ves la advertencia "Google Drive no está conectado":
1. Ve a Herramientas → Google Drive
2. Autoriza el acceso
3. Vuelve al asistente

### "No se encontraron archivos KMZ"

Posibles causas:
- No has cargado archivos KMZ todavía
- Los archivos no se sincronizaron correctamente
- Necesitas cargar archivos desde `/campos`

**Solución:**
1. Ve a `/campos`
2. Carga archivos KMZ desde la interfaz
3. Espera a que se sincronicen (2-5 segundos)
4. Vuelve al asistente

## Notas Técnicas

- Las consultas se procesan en tiempo real
- Los datos se actualizan automáticamente cada vez que cargas nuevos KMZ
- El histórico de consultas se guarda en `agent_interactions`
- La confianza se calcula basada en el tipo de consulta (0.7 - 1.0)

## Comandos Especiales

```
ayuda              → Muestra esta guía completa
estadísticas       → Estadísticas generales del sistema
región [nombre]    → Archivos en una región específica
kmz [archivo]      → Detalles de un archivo KMZ
```
