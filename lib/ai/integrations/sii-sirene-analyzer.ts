/**
 * Analizador de datos SII y SIRENE con IA
 */

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface SIIData {
  avaluoFiscal: number
  contribuciones: number
  superficieConstruida: number
  superficieTerreno: number
  anoConstruction: number
  comuna: string
  rolAvaluo: string
  destinoInmueble: string
  transacciones: {
    fecha: string
    precio: number
    tipo: string
  }[]
}

export interface SIRENEData {
  empresasInmobiliarias: {
    nombre: string
    rut: string
    ventasAnuales: number
    proyectosActivos: number
  }[]
  permisosConstruction: {
    comuna: string
    cantidad: number
    metrosCuadrados: number
    valorProyecto: number
  }[]
  inversionSector: {
    ano: number
    montoTotal: number
    proyectos: number
  }[]
}

export interface MarketAnalysis {
  precioPromedio: number
  tendenciaPrecio: "alza" | "baja" | "estable"
  factorCrecimiento: number
  oportunidadInversion: number
  riesgoMercado: "bajo" | "medio" | "alto"
  recomendaciones: string[]
  insights: string[]
}

/**
 * Analiza datos combinados de SII y SIRENE
 */
export async function analyzeSIISIRENEData(
  siiData: SIIData,
  sireneData: SIRENEData,
  propertyData: any,
): Promise<MarketAnalysis> {
  const prompt = `
Analiza los siguientes datos del mercado inmobiliario chileno:

DATOS SII:
- Avalúo Fiscal: $${siiData.avaluoFiscal.toLocaleString()}
- Contribuciones: $${siiData.contribuciones.toLocaleString()}
- Superficie Construida: ${siiData.superficieConstruida}m²
- Superficie Terreno: ${siiData.superficieTerreno}m²
- Año Construcción: ${siiData.anoConstruction}
- Comuna: ${siiData.comuna}
- Destino: ${siiData.destinoInmueble}
- Transacciones recientes: ${siiData.transacciones.length} en los últimos 12 meses

DATOS SIRENE:
- Empresas inmobiliarias activas: ${sireneData.empresasInmobiliarias.length}
- Permisos de construcción en la comuna: ${sireneData.permisosConstruction.find((p) => p.comuna === siiData.comuna)?.cantidad || 0}
- Inversión total sector: $${sireneData.inversionSector[0]?.montoTotal.toLocaleString() || 0}

DATOS PROPIEDAD:
- Precio actual: $${propertyData.price?.toLocaleString() || "No disponible"}
- Tipo: ${propertyData.property_type || "No especificado"}
- Estado: ${propertyData.status || "No especificado"}

Proporciona un análisis detallado que incluya:

1. VALORACIÓN DE MERCADO:
   - ¿El precio actual está alineado con el avalúo fiscal?
   - ¿Hay sobrevaloración o subvaloración?
   - Comparación con transacciones similares

2. TENDENCIAS Y PROYECCIONES:
   - Tendencia de precios en la zona
   - Impacto de nuevos proyectos
   - Proyección a 12-24 meses

3. OPORTUNIDADES DE INVERSIÓN:
   - Potencial de revalorización
   - Factores de riesgo
   - Momento óptimo para compra/venta

4. INSIGHTS ESPECÍFICOS:
   - Análisis de la actividad empresarial en la zona
   - Impacto de permisos de construcción
   - Recomendaciones estratégicas

Responde en formato JSON con la estructura MarketAnalysis.
`

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
    })

    // Parsear la respuesta y extraer insights
    const analysis = parseAIResponse(text, siiData, sireneData, propertyData)

    return analysis
  } catch (error) {
    console.error("Error analyzing SII/SIRENE data:", error)
    throw new Error("Failed to analyze market data")
  }
}

/**
 * Parsea la respuesta de IA y genera análisis estructurado
 */
function parseAIResponse(
  aiResponse: string,
  siiData: SIIData,
  sireneData: SIRENEData,
  propertyData: any,
): MarketAnalysis {
  // Calcular métricas básicas
  const precioPromedio = calculateAveragePrice(siiData.transacciones)
  const tendenciaPrecio = calculatePriceTrend(siiData.transacciones)
  const factorCrecimiento = calculateGrowthFactor(siiData, sireneData)
  const oportunidadInversion = calculateInvestmentOpportunity(siiData, sireneData, propertyData)
  const riesgoMercado = calculateMarketRisk(siiData, sireneData)

  // Extraer insights de la respuesta de IA
  const insights = extractInsights(aiResponse)
  const recomendaciones = extractRecommendations(aiResponse)

  return {
    precioPromedio,
    tendenciaPrecio,
    factorCrecimiento,
    oportunidadInversion,
    riesgoMercado,
    recomendaciones,
    insights,
  }
}

/**
 * Calcula precio promedio de transacciones
 */
function calculateAveragePrice(transacciones: SIIData["transacciones"]): number {
  if (transacciones.length === 0) return 0

  const total = transacciones.reduce((sum, t) => sum + t.precio, 0)
  return Math.round(total / transacciones.length)
}

/**
 * Determina tendencia de precios
 */
function calculatePriceTrend(transacciones: SIIData["transacciones"]): "alza" | "baja" | "estable" {
  if (transacciones.length < 2) return "estable"

  const sorted = transacciones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2))

  const avgFirst = firstHalf.reduce((sum, t) => sum + t.precio, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((sum, t) => sum + t.precio, 0) / secondHalf.length

  const change = (avgSecond - avgFirst) / avgFirst

  if (change > 0.05) return "alza"
  if (change < -0.05) return "baja"
  return "estable"
}

/**
 * Calcula factor de crecimiento basado en actividad del sector
 */
function calculateGrowthFactor(siiData: SIIData, sireneData: SIRENEData): number {
  const permisosComuna = sireneData.permisosConstruction.find((p) => p.comuna === siiData.comuna)
  const inversionReciente = sireneData.inversionSector[0]

  let factor = 1.0

  // Ajustar por permisos de construcción
  if (permisosComuna && permisosComuna.cantidad > 10) {
    factor += 0.1
  }

  // Ajustar por inversión en el sector
  if (inversionReciente && inversionReciente.montoTotal > 1000000000) {
    // > 1B
    factor += 0.15
  }

  // Ajustar por edad de la propiedad
  const edad = new Date().getFullYear() - siiData.anoConstruction
  if (edad < 5) factor += 0.05
  else if (edad > 30) factor -= 0.1

  return Math.round(factor * 100) / 100
}

/**
 * Evalúa oportunidad de inversión (0-100)
 */
function calculateInvestmentOpportunity(siiData: SIIData, sireneData: SIRENEData, propertyData: any): number {
  let score = 50 // Base score

  // Comparar precio con avalúo fiscal
  if (propertyData.price && siiData.avaluoFiscal) {
    const ratio = propertyData.price / siiData.avaluoFiscal
    if (ratio < 1.2)
      score += 20 // Precio bajo comparado con avalúo
    else if (ratio > 2.0) score -= 15 // Precio alto
  }

  // Actividad empresarial en la zona
  const empresasActivas = sireneData.empresasInmobiliarias.length
  if (empresasActivas > 5) score += 10

  // Permisos de construcción
  const permisosComuna = sireneData.permisosConstruction.find((p) => p.comuna === siiData.comuna)
  if (permisosComuna && permisosComuna.cantidad > 5) score += 15

  return Math.min(100, Math.max(0, score))
}

/**
 * Evalúa riesgo de mercado
 */
function calculateMarketRisk(siiData: SIIData, sireneData: SIRENEData): "bajo" | "medio" | "alto" {
  let riskFactors = 0

  // Exceso de permisos de construcción puede indicar sobresaturación
  const permisosComuna = sireneData.permisosConstruction.find((p) => p.comuna === siiData.comuna)
  if (permisosComuna && permisosComuna.cantidad > 20) riskFactors++

  // Pocas transacciones pueden indicar mercado ilíquido
  if (siiData.transacciones.length < 3) riskFactors++

  // Edad de la propiedad
  const edad = new Date().getFullYear() - siiData.anoConstruction
  if (edad > 40) riskFactors++

  if (riskFactors >= 2) return "alto"
  if (riskFactors === 1) return "medio"
  return "bajo"
}

/**
 * Extrae insights de la respuesta de IA
 */
function extractInsights(aiResponse: string): string[] {
  // Implementar parsing de insights de la respuesta
  const insights = [
    "Análisis basado en datos oficiales del SII y SIRENE",
    "Comparación con transacciones similares en la zona",
    "Evaluación de tendencias de mercado locales",
  ]

  // Aquí se podría implementar NLP para extraer insights específicos
  return insights
}

/**
 * Extrae recomendaciones de la respuesta de IA
 */
function extractRecommendations(aiResponse: string): string[] {
  // Implementar parsing de recomendaciones
  const recomendaciones = [
    "Monitorear nuevos desarrollos en la zona",
    "Considerar el timing del mercado para la transacción",
    "Evaluar factores de ubicación y conectividad",
  ]

  return recomendaciones
}

/**
 * Genera reporte completo de análisis
 */
export async function generateMarketReport(
  siiData: SIIData,
  sireneData: SIRENEData,
  propertyData: any,
): Promise<string> {
  const analysis = await analyzeSIISIRENEData(siiData, sireneData, propertyData)

  const prompt = `
Genera un reporte ejecutivo detallado basado en el siguiente análisis de mercado:

ANÁLISIS:
- Precio promedio zona: $${analysis.precioPromedio.toLocaleString()}
- Tendencia: ${analysis.tendenciaPrecio}
- Factor crecimiento: ${analysis.factorCrecimiento}
- Oportunidad inversión: ${analysis.oportunidadInversion}/100
- Riesgo: ${analysis.riesgoMercado}

DATOS CONTEXTUALES:
- Comuna: ${siiData.comuna}
- Tipo propiedad: ${propertyData.property_type}
- Avalúo fiscal: $${siiData.avaluoFiscal.toLocaleString()}

Crea un reporte profesional que incluya:
1. Resumen ejecutivo
2. Análisis de valoración
3. Contexto de mercado
4. Proyecciones
5. Recomendaciones estratégicas
6. Factores de riesgo
7. Conclusiones

El reporte debe ser comprensible para inversionistas y profesionales inmobiliarios.
`

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.4,
    })

    return text
  } catch (error) {
    console.error("Error generating market report:", error)
    throw new Error("Failed to generate market report")
  }
}
