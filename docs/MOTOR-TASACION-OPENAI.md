# Motor de Tasación - Documentación Completa

## Descripción General

El Motor de Tasación es un sistema inteligente que utiliza OpenAI GPT-4 para analizar propiedades inmobiliarias y calcular precios recomendados basados en análisis de mercado y propiedades comparables.

## Características Implementadas

### 1. API Endpoint de Análisis (`/api/tasacion/analyze-price`)

**Ubicación:** `/app/api/tasacion/analyze-price/route.ts`

**Método:** POST

**Entrada:**
```json
{
  "property": {
    "type": "Casa|Departamento|Terreno|Local Comercial|Oficina",
    "area": 500,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2010,
    "location": "Providencia, calle principal",
    "region": "Metropolitana",
    "city": "Santiago",
    "features": ["piscina", "garaje", "jardín"]
  },
  "comparables": [
    {
      "price": 5000,
      "area": 480,
      "bedrooms": 3,
      "bathrooms": 2,
      "location": "Providencia",
      "similarity": 0.85
    }
  ]
}
```

**Salida:**
```json
{
  "success": true,
  "tasacion": {
    "precioRecomendado": 5200,
    "precioMinimo": 4800,
    "precioMaximo": 5600,
    "precioPorM2": 10.4,
    "potencialInversion": "alto|medio|bajo",
    "margenUF": 4.5,
    "factoresPositivos": ["Ubicación privilegiada", "Terreno con potencial"],
    "factoresNegativos": ["Necesita reparaciones", "Acceso limitado"],
    "insightMercado": "El mercado en Providencia muestra tendencia alcista...",
    "recomendacion": "Se recomienda compra como inversión a mediano plazo..."
  },
  "property": {...},
  "generatedAt": "2024-04-29T10:30:00Z"
}
```

### 2. Componente Visual (`PriceTasacionMotor`)

**Ubicación:** `/components/quick-wins/price-tasacion-motor.tsx`

**Funcionalidades:**
- Formulario interactivo para datos de propiedad
- Selección de tipo de propiedad
- Input de área, dormitorios, baños, año construcción
- Ubicación: región, ciudad, localización específica
- Botón "Analizar Precio" con loading state
- Resultados visuales organizados en cards

**Componentes de Resultados:**
1. **Price Card** - Precio recomendado prominente + rango + precio por m² + margen
2. **Investment Potential** - Badge de color (alto/medio/bajo)
3. **Factores Positivos** - Lista con checkmarks verdes
4. **Factores Negativos** - Lista con X roja
5. **Market Insight** - Análisis del mercado actual
6. **Recomendación** - Consejo profesional sobre la inversión

### 3. Integración en Ficha 360°

**Ubicación:** `/components/crm/client-360-view.tsx`

**Tab:** Pestaña #7 "Tasación" con ícono TrendingUp

**Cómo Acceder:**
1. Ir a `/clientes`
2. Hacer click en cliente
3. Click en "Ficha 360°"
4. Click en tab "Tasación"
5. Llenar datos de propiedad
6. Click "Analizar Precio"

## Flujo de Análisis de OpenAI

El Motor de Tasación utiliza un prompt especializado que:

1. **Contextualiza:** Le indica a GPT-4 que es experto en tasación inmobiliaria chilena
2. **Proporciona Datos:** Envía datos de la propiedad + comparables
3. **Solicita Análisis:** Pide:
   - Precio recomendado en UF
   - Rango de precios (mín-máx)
   - Precio por metro cuadrado
   - Análisis de potencial de inversión
   - Factores positivos y negativos
   - Insights del mercado
   - Recomendaciones

4. **Recibe JSON:** GPT-4 responde en formato JSON estructurado
5. **Valida:** El endpoint valida y retorna los datos

## Configuración Requerida

### Variables de Entorno

```
OPENAI_API_KEY=sk-xxx... (Tu API key de OpenAI)
```

**Cómo obtener:**
1. Ir a https://platform.openai.com/api-keys
2. Crear nueva API key
3. Copiar en variable de entorno
4. Agregar a `.env.local` (desarrollo) o variables de Vercel (producción)

### Modelos Soportados

- `gpt-4` - Recomendado (Más precisión en análisis)
- `gpt-4-turbo` - Alternativa más rápida
- `gpt-3.5-turbo` - Más económico pero menos preciso

## Casos de Uso

### 1. Evaluación de Oportunidad
- Broker recibe una propiedad
- Ingresa datos en tab "Tasación"
- Obtiene precio recomendado
- Decide si presentar oferta

### 2. Análisis de Comparables
- Sistema recibe propiedades comparables
- GPT-4 pondera similitud
- Genera precio basado en mercado actual
- Identifica oportunidades

### 3. Asesoría a Clientes
- Cliente vendedor quiere saber precio de venta
- Broker carga datos en Ficha 360°
- Tasación muestra rango competitivo
- Broker presenta recomendación profesional

### 4. Decisión de Inversión
- Inversor evalúa propiedad
- Tasación muestra potencial de inversión
- Proporciona factores pro/contra
- Facilita decisión de compra

## Error Handling

### Errores Comunes

**Error: "OPENAI_API_KEY not found"**
- Solución: Agregar OPENAI_API_KEY a variables de entorno

**Error: "No se pudo extraer datos de tasación"**
- Causa: GPT-4 devolvió respuesta no-JSON
- Solución: Reintentar o verificar que la propiedad tenga datos válidos

**Error: "Invalid JSON in request"**
- Causa: Datos de entrada mal formateados
- Solución: Verificar que type, area, bedrooms sean números válidos

## Performance

- Tiempo promedio de análisis: 3-5 segundos
- Costo por análisis: ~$0.05 USD (GPT-4)
- Capacidad: Sin límite de rate (respeta límites de OpenAI)

## Mejoras Futuras

1. **Caché de Comparables** - Guardar análisis previos para referencias
2. **Histórico de Tasaciones** - Guardar análisis para cliente/propiedad
3. **Múltiples Escenarios** - Analizar diferentes hipótesis de mercado
4. **Alertas de Precio** - Notificar cuando precio cae/sube
5. **Reportes PDF** - Generar tasación profesional descargable
6. **Integración con MLS** - Conectar con datos de ventas reales
7. **ML Model** - Entrenar modelo propio con histórico

## Monitoreo

### Métricas a Seguir

- Cantidad de tasaciones por día
- Costo total de API calls
- Errores y tasas de fallo
- Satisfacción del usuario (recomendación vs precio final)

### Logs

Los logs de error se guardan en:
- Consola del servidor (desarrollo)
- Cloud Logging (producción en Vercel)

## Testing

### Test Manual

1. Ir a Ficha 360° → Tasación
2. Ingresar:
   - Tipo: Casa
   - Área: 500
   - Dormitorios: 3
   - Baños: 2
   - Año: 2010
   - Ciudad: Santiago
   - Región: Metropolitana
3. Click "Analizar"
4. Esperar resultado (3-5 seg)
5. Verificar que aparezcan: precio, rango, factores, insight

## Contribuciones y Cambios

Para modificar el prompt de GPT-4:
- Editar `/app/api/tasacion/analyze-price/route.ts`
- Buscar variable `prompt`
- Actualizar instrucciones
- Probar nuevamente

Para cambiar modelo:
- En línea ~39: cambiar `model: 'gpt-4'`

