import type { CAMPOSAnalysisInput } from "./territorial-analysis"
import { analyzeCAMPOSExpedient } from "./territorial-analysis"

export function buildCAMPOSExecutiveReport(input: CAMPOSAnalysisInput) {
  const analysis = analyzeCAMPOSExpedient(input)

  return {
    title: input.title || "Informe territorial CAMPOS",
    sections: [
      {
        title: "Resumen ejecutivo",
        content: `Score territorial ${analysis.score}/100. Nivel de riesgo: ${analysis.risk}.`,
      },
      {
        title: "Fortalezas",
        items: analysis.strengths,
      },
      {
        title: "Brechas identificadas",
        items: analysis.warnings,
      },
      {
        title: "Próximas acciones",
        items: analysis.recommendations,
      },
    ],
    disclaimer:
      "Informe generado automáticamente a partir de información disponible en CAMPOS. No reemplaza análisis legales, registrales, ambientales o financieros profesionales.",
  }
}
