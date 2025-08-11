/**
 * Utilidades para el manejo de documentos generados por IA
 */

import type { AIDocument } from "../types"
import { remark } from "remark"
import html from "remark-html"
import { sanitize } from "isomorphic-dompurify"

/**
 * Convierte contenido Markdown a HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await remark()
      .use(html, { sanitize: false }) // No sanitizamos aquí porque lo haremos después
      .process(markdown)

    const contentHtml = result.toString()

    // Sanitizar el HTML para prevenir XSS
    return sanitize(contentHtml, {
      ADD_TAGS: ["iframe"], // Permitir iframes para embeber contenido
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"], // Atributos adicionales para iframes
    })
  } catch (error) {
    console.error("Error al convertir Markdown a HTML:", error)
    return `<p>Error al procesar el contenido: ${error instanceof Error ? error.message : String(error)}</p>`
  }
}

/**
 * Sanitiza el contenido de un documento
 */
export function sanitizeDocumentContent(content: string): string {
  // Eliminar cualquier script o contenido potencialmente peligroso
  // Mantenemos el formato Markdown pero eliminamos cualquier HTML malicioso
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<link\b[^<]*>/gi, "")
    .replace(/<meta\b[^<]*>/gi, "")
    .replace(/<base\b[^<]*>/gi, "")
}

/**
 * Extrae metadatos de un documento
 */
export function extractDocumentMetadata(document: AIDocument): Record<string, any> {
  // Extraer metadatos básicos
  const basicMetadata = {
    id: document.id,
    title: document.title,
    type: document.type,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    status: document.status,
    version: document.version,
  }

  // Combinar con los metadatos personalizados del documento
  return {
    ...basicMetadata,
    ...document.metadata,
  }
}

/**
 * Valida un documento
 */
export function validateDocument(document: AIDocument): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validar campos obligatorios
  if (!document.title) {
    errors.push("El título del documento es obligatorio")
  }

  if (!document.type) {
    errors.push("El tipo de documento es obligatorio")
  }

  if (!document.content) {
    errors.push("El contenido del documento es obligatorio")
  } else if (document.content.length < 10) {
    errors.push("El contenido del documento es demasiado corto")
  }

  // Validar metadatos específicos según el tipo de documento
  switch (document.type) {
    case "property-analysis":
      if (!document.metadata.location) {
        errors.push("La ubicación de la propiedad es obligatoria para un análisis de propiedad")
      }
      break

    case "market-report":
      if (!document.metadata.region) {
        errors.push("La región es obligatoria para un informe de mercado")
      }
      break

    case "client-recommendation":
      if (!document.metadata.clientProfile) {
        errors.push("El perfil del cliente es obligatorio para una recomendación de cliente")
      }
      break

    case "investment-analysis":
      if (!document.metadata.investmentTarget) {
        errors.push("El objetivo de inversión es obligatorio para un análisis de inversión")
      }
      break
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Genera un resumen del documento
 */
export async function generateDocumentSummary(content: string, maxLength = 200): Promise<string> {
  try {
    // Extraer el primer párrafo como resumen
    const firstParagraph = content.split("\n\n")[0].replace(/^#+ /, "")

    if (firstParagraph.length <= maxLength) {
      return firstParagraph
    }

    // Si el primer párrafo es demasiado largo, truncarlo
    return firstParagraph.substring(0, maxLength - 3) + "..."
  } catch (error) {
    console.error("Error al generar resumen del documento:", error)
    return "No se pudo generar un resumen del documento."
  }
}

/**
 * Extrae palabras clave de un documento
 */
export function extractKeywords(content: string, maxKeywords = 5): string[] {
  try {
    // Eliminar encabezados, listas y otros elementos Markdown
    const cleanContent = content
      .replace(/^#+ .+$/gm, "") // Eliminar encabezados
      .replace(/^\s*[-*+] .+$/gm, "") // Eliminar listas
      .replace(/^\s*\d+\. .+$/gm, "") // Eliminar listas numeradas
      .replace(/\[.+\]$$.+$$/g, "") // Eliminar enlaces
      .replace(/\*\*|__|\*|_|~~|`/g, "") // Eliminar formato

    // Dividir en palabras
    const words = cleanContent.toLowerCase().split(/\W+/)

    // Filtrar palabras comunes (stopwords)
    const stopwords = new Set([
      "el",
      "la",
      "los",
      "las",
      "un",
      "una",
      "unos",
      "unas",
      "y",
      "o",
      "pero",
      "si",
      "no",
      "en",
      "de",
      "del",
      "a",
      "con",
      "por",
      "para",
      "al",
      "es",
      "son",
      "está",
      "están",
      "fue",
      "fueron",
      "ser",
      "este",
      "esta",
      "estos",
      "estas",
      "ese",
      "esa",
      "esos",
      "esas",
      "aquel",
      "aquella",
      "aquellos",
      "aquellas",
      "que",
      "como",
      "cuando",
      "donde",
      "quien",
      "quienes",
      "cual",
      "cuales",
      "cuyo",
      "cuya",
      "cuyos",
      "cuyas",
    ])

    // Contar frecuencia de palabras
    const wordFrequency: Record<string, number> = {}
    for (const word of words) {
      if (word.length > 3 && !stopwords.has(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1
      }
    }

    // Ordenar por frecuencia y obtener las palabras más comunes
    return Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word)
  } catch (error) {
    console.error("Error al extraer palabras clave:", error)
    return []
  }
}

/**
 * Calcula el tiempo estimado de lectura
 */
export function calculateReadingTime(content: string): number {
  // Promedio de palabras por minuto para lectura
  const wordsPerMinute = 200

  // Contar palabras (aproximado)
  const wordCount = content.split(/\s+/).length

  // Calcular minutos
  const minutes = Math.ceil(wordCount / wordsPerMinute)

  return Math.max(1, minutes) // Mínimo 1 minuto
}
