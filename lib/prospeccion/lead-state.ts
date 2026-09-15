export type ProspectingLeadDecision = "contactar" | "validar_propietario" | "descartar"

type AttemptLike = {
  status: "found" | "not_found" | "unavailable" | "requires_dataset" | "manual_verification"
}

type OwnerLike = {
  source: string
  relation: string
  confidence: number
  documentType: string
}

type OwnerResearchLike = {
  owner: OwnerLike | null
  producer: unknown | null
  historicalOwner: unknown | null
  attempts: AttemptLike[]
}

function allAttemptsDefinitive(attempts: AttemptLike[]) {
  return attempts.length >= 2 && attempts.every((attempt) => attempt.status === "not_found")
}

export function classifyOwnerResearch(result: OwnerResearchLike): ProspectingLeadDecision {
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
