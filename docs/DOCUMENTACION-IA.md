# Documentación IA - Sur-Realista

## Modelos, Algoritmos y Capacidades de Inteligencia Artificial

### Tabla de Contenidos
1. [Modelos IA Utilizados](#modelos)
2. [Algoritmos de Valuación](#algoritmos)
3. [Procesamiento de Lenguaje Natural](#nlp)
4. [Análisis Predictivo](#predictivo)
5. [Capacidades y Limitaciones](#capacidades)

---

## Modelos IA Utilizados {#modelos}

### 1. Modelo de Análisis de Propiedades

**Nombre**: Valuación Inteligente Multi-Fuente
**Tipo**: Modelo Estadístico + Machine Learning
**Entrada**: Características de propiedad (tipo, área, región, estado, features)
**Salida**: Valuación con rango de confianza

**Características**:
- Analiza 4+ fuentes de datos simultáneamente
- Pondera cada fuente por confiabilidad
- Ajusta por factores de mercado regional
- Genera intervalos de confianza estadísticos

### 2. Modelo de Procesamiento de Lenguaje

**Nombre**: Intent Recognition + Query Analysis
**Tipo**: NLP Transformer
**Funcionalidad**: Interpreta consultas en lenguaje natural

**Capacidades**:
- Reconoce 8+ tipos de intenciones de usuario
- Extrae entidades: región, tipo de propiedad, características
- Mapea ciudades a regiones automáticamente
- Maneja variaciones de lenguaje español

---

## Algoritmos de Valuación {#algoritmos}

### Algoritmo Principal: Enfoque Comparativo Ponderado

```
PRECIO_ESTIMADO = (
    PRECIO_BASE_SII × W_SII × M_CONDICION +
    PRECIO_BASE_BD × W_BD × M_CONDICION +
    PRECIO_INTERNET × W_INTERNET × M_CONDICION
) × B_CARACTERÍSTICAS × F_MERCADO

Donde:
- W_SII = 0.40 (peso datos SII - muy confiables)
- W_BD = 0.35 (peso BD interna - confiables)
- W_INTERNET = 0.25 (peso datos internet - actuales)
- M_CONDICION = multiplicador según estado
- B_CARACTERÍSTICAS = bonificación por features
- F_MERCADO = factor de mercado regional
```

### Multiplicadores por Condición

```
EXCELENTE:     1.15 (+15%)
BUENO:         1.00 (base)
REGULAR:       0.88 (-12%)
REPARACIÓN:    0.75 (-25%)
EN CONSTRUCCIÓN: 0.85 (-15%)
SIN MEJORAS:   0.50 (-50% para terrenos)
```

### Bonificación por Características

```
CARACTERÍSTICAS PREMIUM = {
  "piscina": +5%,
  "sauna": +3%,
  "gimnasio": +2%,
  "estacionamiento": +4%,
  "jardín": +2%,
  "vista al mar": +8%,
  "vista privilegiada": +5%,
  "acceso metro": +6%,
  "transporte público": +3%,
  "seguridad": +3%,
  "portería": +2%,
  "bodega": +2%,
  "parrilla": +1%
}

BONUS_TOTAL = 1 + (Σ CHARACTERISTICS × 0.05)
```

### Cálculo de Rango de Confianza

```
INTERVALO_CONFIANZA = ±15% (por defecto)

MIN_PRICE = PRECIO_ESTIMADO × 0.85
MAX_PRICE = PRECIO_ESTIMADO × 1.15

CONFIANZA = MIN(95%, 65% + BOOST)
  Donde BOOST depende de:
  - Cantidad de comparables: +2% por comparable (máx 20%)
  - Calidad de datos: +5-15% según fuente
  - Antigüedad de datos: -1% por mes sin actualizar
```

---

## Procesamiento de Lenguaje Natural {#nlp}

### Intent Recognition (Tipos de Consultas)

```
INTENCIONES RECONOCIDAS = {
  "quote_request": Solicitud de cotización,
  "valuation": Valuación de propiedad,
  "comparable_analysis": Análisis de comparables,
  "price_estimation": Estimación de precios,
  "region_search": Búsqueda geográfica,
  "price_analysis": Análisis de precios,
  "market_trends": Tendencias del mercado,
  "statistics": Estadísticas,
  "investment_advice": Asesoramiento,
  "file_search": Búsqueda de archivos,
  "general": Consultas generales
}
```

### Extracción de Entidades

```
ENTIDADES = {
  "REGIÓN": Mapea a región oficial chilena,
  "CIUDAD": Mapea a ciudad dentro de región,
  "TIPO_PROPIEDAD": Normaliza a tipo estándar,
  "AREA": Extrae valor numérico,
  "CARACTERÍSTICAS": Lista de features mencionadas,
  "CONDICIÓN": Estado de la propiedad,
  "RANGO_PRECIO": Si es mencionado
}
```

### Mapeo de Ciudades a Regiones

```
El sistema automáticamente mapea:
- Valdivia → Los Ríos
- Panguipulli → Los Ríos
- Santiago → Metropolitana
- Viña del Mar → Valparaíso
- Puerto Montt → Los Lagos
- Concepción → Biobío
- (+ 200+ ciudades mapeadas)
```

---

## Análisis Predictivo {#predictivo}

### Modelo de Tendencias de Mercado

**Funcionalidad**: Predice tendencias futuras basadas en:
- Datos históricos (últimos 12-24 meses)
- Indicadores económicos regionales
- Patrones estacionales

**Salida**:
```
{
  "trend": "alcista|estable|bajista",
  "strength": -100 a +100 (intensidad),
  "confidence": 65-95%,
  "projection": "3-6 meses outlook"
}
```

### Modelo de Oportunidades de Inversión

**Funciona analizando**:
- Relación precio/m² vs región
- Crecimiento histórico de zonas
- Demanda inmobiliaria regional
- Proyecto de desarrollo cercanos

**Genera puntuación**:
```
OPORTUNIDAD_SCORE = (
  0.30 × CRECIMIENTO +
  0.25 × VALOR_RELATIVO +
  0.25 × DEMANDA +
  0.20 × POTENCIAL_DESARROLLO
) / 4

Score: 0-100 (donde 70+ es buena oportunidad)
```

---

## Capacidades y Limitaciones {#capacidades}

### Capacidades ✓

**Soportadas**:
- ✓ Valuación de propiedades con múltiples metodologías
- ✓ Análisis comparativo automático
- ✓ Búsqueda inteligente por ubicación
- ✓ Reconocimiento de intenciones en lenguaje natural
- ✓ Análisis de tendencias de mercado
- ✓ Recomendaciones de inversión
- ✓ Integración de múltiples fuentes de datos
- ✓ Cálculo de intervalos de confianza
- ✓ Comparación con mercado vigente

### Limitaciones ⚠️

**No Soportado**:
- ✗ Transacciones inmobiliarias directas
- ✗ Análisis de financiamiento/hipotecas
- ✗ Asesoramiento legal
- ✗ Análisis de rentabilidad de arriendos (parcial)
- ✗ Predicciones a largo plazo (>1 año)
- ✗ Análisis de impacto regulatorio

**Consideraciones**:
- Las valuaciones son aproximaciones, no tasaciones oficiales
- Datos pueden estar desactualizados en mercados poco activos
- Variabilidad en zonas con datos escasos
- Mercados altamente especializados pueden tener menor precisión

---

## Algoritmos de Búsqueda

### KMZ Search Algorithm

```
BÚSQUEDA_KMZ(región, ciudad) = {
  1. Normalizao región (mayúsculas, espacios)
  2. Busca en kmz_search_index ILIKE %región%
  3. Si hay ciudad, filtra por ciudad
  4. Ordena por relevancia
  5. Agrupa por tipo de propiedad
  6. Retorna top 50 resultados
}
```

### Market Data Aggregation

```
AGREGACIÓN_DATOS() = {
  1. Consulta SII (avalúos reales)
  2. Consulta BD (comparables)
  3. Consulta Internet (mercado vigente)
  4. Normaliza todas las fuentes
  5. Pondera por confiabilidad
  6. Calcula media ponderada
  7. Genera intervalo de confianza
}
```

---

## Mejora Continua

### Feedback Loop

```
Usuario → Usa Valuación → Transacción Real → Ajuste de Modelo
             ↓
       Captura de Precio Real
             ↓
       Comparar vs Predicción
             ↓
       Ajustar Pesos/Parámetros
             ↓
       Próxima Valuación es más Precisa
```

### Reentrenamiento

- Semanal: Actualizar datos de internet
- Mensual: Recalibrar multiplicadores
- Trimestral: Análisis completo de precisión
- Anual: Revisión del modelo completo

---

## Seguridad en IA

### Protecciones Implementadas

- Validación de entrada en todas las funciones
- Límites de valores para evitar outliers
- Timeout en procesamiento
- Logging de decisiones importantes
- Auditoría de cambios en modelos

---

## Experimentos en Curso

### 1. Análisis de Rentabilidad
Estimación de ROI en base a precio y ubicación

### 2. Predicción de Demanda
Modelado de demanda futura por zona

### 3. Análisis de Riesgos
Score de riesgo de inversión por propiedad

---

Ver también: [Documentación Técnica](./DOCUMENTACION-TECNICA.md) | [API Reference](./API.md)
