import type { CAMPOSAnalysisInput } from "./territorial-analysis"

export function compareCAMPOSProperties(current: CAMPOSAnalysisInput, candidates: CAMPOSAnalysisInput[]) {
  const currentArea = Number.parseFloat((current.area || "").replace(/[^0-9.]/g, "")) || 0

  return candidates
    .map((candidate) => {
      const candidateArea = Number.parseFloat((candidate.area || "").replace(/[^0-9.]/g, "")) || 0
      let similarity = 0

      if (current.commune && candidate.commune && current.commune === candidate.commune) similarity += 35
      if (currentArea && candidateArea) {
        const difference = Math.abs(currentArea - candidateArea) / Math.max(currentArea, candidateArea)
        similarity += Math.max(0, 35 - difference * 35)
      }
      if (current.sections?.some((section) => candidate.sections?.includes(section))) similarity += 20
      if (current.role && candidate.role) similarity += 10

      return {
        title: candidate.title || "Predio sin nombre",
        similarity: Math.round(Math.min(100, similarity)),
        commune: candidate.commune || null,
        area: candidate.area || null,
      }
    })
    .sort((a, b) => b.similarity - a.similarity)
}
