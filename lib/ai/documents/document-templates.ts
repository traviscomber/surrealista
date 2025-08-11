/**
 * Plantillas y generación de documentos para el sistema de IA
 */

import type { AIDocumentType } from "../types"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Interfaces para las plantillas
interface TemplateData {
  title: string
  metadata: Record<string, any>
  relatedEntityId?: string
  [key: string]: any
}

// Plantillas base para diferentes tipos de documentos
const DOCUMENT_TEMPLATES: Record<AIDocumentType, string> = {
  "property-analysis": `# Análisis de Propiedad: {{title}}

## Resumen Ejecutivo
Este análisis proporciona una evaluación detallada de la propiedad ubicada en {{metadata.location}}. La propiedad es un {{metadata.propertyType}} con {{metadata.bedrooms}} dormitorios y {{metadata.bathrooms}} baños, con un área total de {{metadata.squareMeters}} metros cuadrados.

## Valoración de Mercado
Basado en propiedades comparables en la zona y las condiciones actuales del mercado, estimamos que el valor de esta propiedad está en el rango de {{metadata.valuationRange.min}} a {{metadata.valuationRange.max}} {{metadata.currency}}.

## Análisis de Ubicación
La propiedad se encuentra en {{metadata.neighborhood}}, una zona caracterizada por {{metadata.locationFeatures}}. La proximidad a servicios clave incluye:
- Transporte: {{metadata.transportAccess}}
- Educación: {{metadata.educationAccess}}
- Comercio: {{metadata.commerceAccess}}
- Salud: {{metadata.healthAccess}}

## Características Destacadas
- Tipo: {{metadata.propertyType}}
- Dormitorios: {{metadata.bedrooms}}
- Baños: {{metadata.bathrooms}}
- Área: {{metadata.squareMeters}} m²
- Año de construcción: {{metadata.yearBuilt}}
- Estado: {{metadata.condition}}
- Características adicionales: {{metadata.additionalFeatures}}

## Potencial de Inversión
{{metadata.investmentPotential}}

## Recomendaciones
{{metadata.recommendations}}

## Conclusión
{{metadata.conclusion}}

---
Análisis generado por Sur-Realista AI el {{metadata.generationDate}}
`,

  "market-report": `# Informe de Mercado: {{title}}

## Resumen Ejecutivo
Este informe analiza las tendencias actuales del mercado inmobiliario en {{metadata.region}}, con un enfoque en {{metadata.focusArea}}.

## Tendencias de Precios
{{metadata.priceTrends}}

## Oferta y Demanda
{{metadata.supplyDemand}}

## Segmentos de Mercado
{{metadata.marketSegments}}

## Proyecciones
{{metadata.projections}}

## Oportunidades de Inversión
{{metadata.investmentOpportunities}}

## Riesgos y Consideraciones
{{metadata.risks}}

## Conclusión
{{metadata.conclusion}}

---
Informe generado por Sur-Realista AI el {{metadata.generationDate}}
`,

  "client-recommendation": `# Recomendación para Cliente: {{title}}

## Perfil del Cliente
{{metadata.clientProfile}}

## Necesidades y Preferencias
{{metadata.clientNeeds}}

## Propiedades Recomendadas
{{metadata.recommendedProperties}}

## Análisis Comparativo
{{metadata.comparativeAnalysis}}

## Consideraciones Financieras
{{metadata.financialConsiderations}}

## Pasos Siguientes
{{metadata.nextSteps}}

## Conclusión
{{metadata.conclusion}}

---
Recomendación generada por Sur-Realista AI el {{metadata.generationDate}}
`,

  "investment-analysis": `# Análisis de Inversión: {{title}}

## Resumen Ejecutivo
Este análisis evalúa la oportunidad de inversión en {{metadata.investmentTarget}}.

## Detalles de la Inversión
{{metadata.investmentDetails}}

## Análisis Financiero
{{metadata.financialAnalysis}}

## Proyección de Retorno
{{metadata.returnProjection}}

## Análisis de Riesgos
{{metadata.riskAnalysis}}

## Escenarios
{{metadata.scenarios}}

## Recomendaciones
{{metadata.recommendations}}

## Conclusión
{{metadata.conclusion}}

---
Análisis generado por Sur-Realista AI el {{metadata.generationDate}}
`,

  custom: `# {{title}}

{{metadata.content}}

---
Documento generado por Sur-Realista AI el {{metadata.generationDate}}
`,
}

/**
 * Rellena una plantilla con datos
 */
function fillTemplate(template: string, data: TemplateData): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const keys = key.trim().split(".")
    let value = data

    for (const k of keys) {
      if (value === undefined || value === null) return match
      value = value[k]
    }

    return value !== undefined && value !== null ? String(value) : match
  })
}

/**
 * Genera contenido para un documento a partir de una plantilla
 */
export async function generateDocumentFromTemplate(type: AIDocumentType, data: TemplateData): Promise<string> {
  try {
    // Asegurarse de que los datos incluyan la fecha de generación
    const templateData = {
      ...data,
      metadata: {
        ...data.metadata,
        generationDate: new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    }

    // Obtener la plantilla correspondiente
    const template = DOCUMENT_TEMPLATES[type] || DOCUMENT_TEMPLATES.custom

    // Rellenar la plantilla con los datos proporcionados
    let content = fillTemplate(template, templateData)

    // Si hay datos faltantes (placeholders que no se han reemplazado),
    // usar IA para generar contenido relevante
    if (content.includes("{{")) {
      content = await enhanceContentWithAI(content, type, templateData)
    }

    return content
  } catch (error) {
    console.error("Error al generar documento desde plantilla:", error)
    return `# ${data.title}\n\nError al generar contenido: ${error instanceof Error ? error.message : String(error)}`
  }
}

/**
 * Usa IA para mejorar el contenido del documento
 */
async function enhanceContentWithAI(partialContent: string, type: AIDocumentType, data: TemplateData): Promise<string> {
  try {
    // Identificar los placeholders que faltan
    const missingPlaceholders: string[] = []
    const regex = /\{\{([^}]+)\}\}/g
    let match

    while ((match = regex.exec(partialContent)) !== null) {
      missingPlaceholders.push(match[1].trim())
    }

    // Si no hay placeholders faltantes, devolver el contenido tal cual
    if (missingPlaceholders.length === 0) {
      return partialContent
    }

    // Crear un prompt para la IA
    const prompt = `
    Estás ayudando a generar contenido para un documento inmobiliario de tipo "${type}" titulado "${data.title}".
    
    Necesito que generes contenido para reemplazar los siguientes placeholders en el documento:
    ${missingPlaceholders.map((p) => `- ${p}`).join("\n")}
    
    Información disponible sobre el documento:
    ${JSON.stringify(data, null, 2)}
    
    Por favor, genera contenido relevante, profesional y detallado para cada placeholder.
    Formatea tu respuesta como un objeto JSON donde cada clave es el nombre del placeholder y cada valor es el contenido generado.
    `

    // Llamar a la API de OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      max_tokens: 2000,
    })

    // Parsear la respuesta
    let aiContent: Record<string, string> = {}
    try {
      // Intentar extraer el JSON de la respuesta
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
      aiContent = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("Error al parsear respuesta de IA:", parseError)
      // Fallback: usar la respuesta completa
      aiContent = { content: text }
    }

    // Reemplazar los placeholders con el contenido generado
    let enhancedContent = partialContent
    for (const [key, value] of Object.entries(aiContent)) {
      const placeholder = key.includes(".") ? key : `metadata.${key}`
      enhancedContent = enhancedContent.replace(
        new RegExp(`\\{\\{${placeholder.replace(".", "\\.")}\\}\\}`, "g"),
        value,
      )
    }

    // Si todavía quedan placeholders, reemplazarlos con valores por defecto
    enhancedContent = enhancedContent.replace(/\{\{[^}]+\}\}/g, "Información no disponible")

    return enhancedContent
  } catch (error) {
    console.error("Error al mejorar contenido con IA:", error)
    // Reemplazar todos los placeholders restantes con un mensaje de error
    return partialContent.replace(/\{\{[^}]+\}\}/g, "Información no disponible (error al generar contenido)")
  }
}

/**
 * Genera un documento completo utilizando IA
 */
export async function generateDocumentWithAI(
  type: AIDocumentType,
  data: {
    title: string
    description: string
    keywords?: string[]
    context?: Record<string, any>
  },
): Promise<string> {
  try {
    // Crear un prompt para la IA
    const prompt = `
    Genera un documento completo de tipo "${type}" con el título "${data.title}".
    
    Descripción: ${data.description}
    
    ${data.keywords ? `Palabras clave: ${data.keywords.join(", ")}` : ""}
    
    ${data.context ? `Contexto adicional: ${JSON.stringify(data.context, null, 2)}` : ""}
    
    El documento debe ser profesional, detallado y seguir un formato de Markdown.
    Incluye secciones relevantes para este tipo de documento inmobiliario, datos específicos (puedes inventarlos de manera realista si es necesario),
    y conclusiones o recomendaciones basadas en la información proporcionada.
    `

    // Llamar a la API de OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      max_tokens: 3000,
    })

    return text
  } catch (error) {
    console.error("Error al generar documento con IA:", error)
    return `# ${data.title}\n\nError al generar contenido: ${error instanceof Error ? error.message : String(error)}`
  }
}
