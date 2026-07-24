export type CAMPOSAnalysisInput = {
  title?: string | null
  role?: string | null
  owner?: string | null
  commune?: string | null
  area?: string | null
  latitude?: string | null
  longitude?: string | null
  sections?: string[]
  text?: string | null
}

export type CAMPOSAnalysis = {
  score: number
  risk: "Bajo" | "Medio" | "Alto"
  strengths: string[]
  warnings: string[]
  recommendations: string[]
}

/**
 * Deterministic territorial assessment.
 * This is intentionally evidence-based: it never invents ownership,
 * legal status, valuation or environmental facts.
 */
export function analyzeCAMPOSExpedient(input: CAMPOSAnalysisInput): CAMPOSAnalysis {
  const sections = new Set(input.sections || [])
  let score = 0

  const strengths: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []

  if (input.latitude && input.longitude) {
    score += 20
    strengths.push("Ubicación geográfica disponible")
  } else {
    warnings.push("Faltan coordenadas verificadas")
    recommendations.push("Validar geometría y ubicación del predio")
  }

  if (input.role) {
    score += 20
    strengths.push("ROL SII identificado")
  } else {
    warnings.push("ROL SII no confirmado")
    recommendations.push("Completar antecedentes tributarios")
  }

  if (input.owner) {
    score += 20
    strengths.push("Titularidad informada")
  } else {
    warnings.push("Propietario no confirmado")
    recommendations.push("Verificar antecedentes de propiedad")
  }

  if (sections.has("documentos")) {
    score += 20
    strengths.push("Documentación disponible")
  } else {
    warnings.push("Sin sección documental detectada")
    recommendations.push("Incorporar documentos de respaldo")
  }

  if (input.area) {
    score += 10
    strengths.push("Superficie registrada")
  }

  if (sections.has("descripcion")) {
    score += 10
  }

  const finalScore = Math.min(100, score)

  return {
    score: finalScore,
    risk: finalScore >= 75 ? "Bajo" : finalScore >= 45 ? "Medio" : "Alto",
    strengths,
    warnings,
    recommendations: [...new Set(recommendations)],
  }
}

export function buildDueDiligencePrompt(input: CAMPOSAnalysisInput, analysis: CAMPOSAnalysis) {
  return `Genera una due diligence territorial profesional usando únicamente la evidencia disponible.

Predio: ${input.title || "No identificado"}
ROL: ${input.role || "No disponible"}
Propietario: ${input.owner || "No disponible"}
Comuna: ${input.commune || "No disponible"}
Superficie: ${input.area || "No disponible"}

Score territorial: ${analysis.score}/100
Nivel de riesgo: ${analysis.risk}

Fortalezas:
${analysis.strengths.join("\n") || "Ninguna detectada"}

Brechas:
${analysis.warnings.join("\n") || "Ninguna detectada"}

Recomendaciones:
${analysis.recommendations.join("\n") || "Mantener trazabilidad"}`
}
