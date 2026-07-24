import { analyzeCAMPOSExpedient, type CAMPOSAnalysisInput } from "./territorial-analysis"

export function generateCAMPOSDueDiligence(input: CAMPOSAnalysisInput) {
  const analysis = analyzeCAMPOSExpedient(input)

  return {
    title: "Due Diligence Territorial CAMPOS",
    generatedAt: new Date().toISOString(),
    property: {
      title: input.title || "No identificado",
      role: input.role || "No disponible",
      owner: input.owner || "No disponible",
      commune: input.commune || "No disponible",
      area: input.area || "No disponible",
    },
    assessment: analysis,
    executiveSummary:
      `El expediente ${input.title || "seleccionado"} presenta un score territorial de ${analysis.score}/100 con riesgo ${analysis.risk.toLowerCase()}. ` +
      `La evaluación considera únicamente información disponible en CAMPOS y no sustituye revisiones legales o registrales.`,
    nextSteps: analysis.recommendations,
  }
}
