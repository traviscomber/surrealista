import type { OwnerResearchAttempt, OwnerResearchResult } from "@/lib/prospeccion/owner-intelligence"

export type ProspectingLeadDecision = "contactar" | "validar_propietario" | "descartar"

function allAttemptsDefinitive(attempts: OwnerResearchAttempt[]) {
  return attempts.length >= 2 && attempts.every((attempt) => attempt.status === "not_found")
}

export function classifyOwnerResearch(result: OwnerResearchResult): ProspectingLeadDecision {
  if (
    result.owner?.source === "internal_exact_rol" &&
    result.owner.relation === "legal_owner" &&
    result.owner.confidence >= 0.98 &&
    result.owner.documentType === "confirmed-owner"
  ) {
    return "contactar"
  }

  if (result.owner || result.producer || result.historicalOwner) {
    return "validar_propietario"
  }

  if (allAttemptsDefinitive(result.attempts)) {
    return "descartar"
  }

  return "validar_propietario"
}

export function leadDecisionLabel(decision: ProspectingLeadDecision) {
  if (decision === "contactar") return "Contactar"
  if (decision === "descartar") return "Descartar"
  return "Validar propietario"
}
