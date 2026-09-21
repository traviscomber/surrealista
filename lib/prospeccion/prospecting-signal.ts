export type CirenSignalStatus = "matched" | "partial" | "ambiguous" | "not_found" | "unknown"

export type ProspectingSignalInput = {
  rol: string
  commune: string | null
  region: string | null
  ownerName: string | null
  contactAvailable: boolean
  cirenStatus: CirenSignalStatus
  marketSampleCount: number
  anomaly: {
    level: "watch" | "strong"
    ndviDelta: number | null
    ndmiDelta: number | null
    interpretation: string
    observationCount: number
  }
}

export type ProspectingSignal = {
  score: number
  level: "alta" | "media" | "observar"
  dimensions: {
    identity: number
    location: number
    owner: number
    ciren: number
    satellite: number
    market: number
  }
  reasons: string[]
  nextAction: string
  guardrail: string
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function cirenPoints(status: CirenSignalStatus) {
  if (status === "matched") return 15
  if (status === "partial") return 10
  if (status === "ambiguous") return 5
  return 0
}

function marketPoints(sampleCount: number) {
  if (sampleCount >= 20) return 15
  if (sampleCount >= 5) return 10
  if (sampleCount > 0) return 5
  return 0
}

export function scoreProspectingSignal(input: ProspectingSignalInput): ProspectingSignal {
  const identity = input.rol.trim() ? 10 : 0
  const location = input.commune && input.region ? 10 : input.commune || input.region ? 6 : 0
  const owner = input.contactAvailable ? 20 : input.ownerName ? 12 : 0
  const ciren = cirenPoints(input.cirenStatus)
  const satellite = input.anomaly.level === "strong" ? 30 : 20
  const market = marketPoints(Math.max(0, Number(input.marketSampleCount) || 0))
  const score = clamp(identity + location + owner + ciren + satellite + market)

  const reasons = [
    input.anomaly.level === "strong"
      ? `Cambio espectral fuerte con ${input.anomaly.observationCount} observaciones persistidas.`
      : `Cambio espectral a vigilar con ${input.anomaly.observationCount} observaciones persistidas.`,
    input.contactAvailable
      ? "Existe contacto verificable asociado al contexto del ROL."
      : input.ownerName
        ? "Existe propietario identificado, pero falta resolver contacto verificable."
        : "Propietario aún no resuelto con evidencia suficiente.",
    input.cirenStatus === "matched"
      ? "CIREN entrega coincidencia oficial para el contexto territorial."
      : input.cirenStatus === "partial"
        ? "CIREN entrega evidencia parcial."
        : input.cirenStatus === "ambiguous"
          ? "CIREN entrega una coincidencia ambigua que requiere revisión."
          : input.cirenStatus === "not_found"
            ? "CIREN no resolvió una feature utilizable; SII/Sentinel mantienen el ROL trazable."
            : "Sin señal CIREN utilizable para este ROL.",
    input.marketSampleCount > 0
      ? `Mercado dispone de ${input.marketSampleCount} muestras comparables recientes en la ubicación.`
      : "No hay muestra comparable reciente suficiente para sumar contexto de mercado.",
  ]

  const level = score >= 70 ? "alta" : score >= 50 ? "media" : "observar"
  const nextAction = input.contactAvailable
    ? "Revisar la evidencia convergente y preparar contacto humano; no asumir intención de venta."
    : input.ownerName
      ? "Resolver un contacto verificable del propietario antes de cualquier acercamiento."
      : "Investigar propietario del ROL y mantener la señal en revisión hasta resolver identidad."

  return {
    score,
    level,
    dimensions: { identity, location, owner, ciren, satellite, market },
    reasons,
    nextAction,
    guardrail: "Este score prioriza convergencia de evidencia. No estima intención de venta ni atribuye causalidad agronómica al cambio satelital.",
  }
}


export function isReliableSpectralProspectingSignal(input: {
  latestNdvi: number | null
  seasonalBaselineNdvi: number | null
  baselineCount: number
}) {
  if (input.baselineCount < 2) return false
  if (input.latestNdvi == null || input.seasonalBaselineNdvi == null) return false
  if (!Number.isFinite(input.latestNdvi) || !Number.isFinite(input.seasonalBaselineNdvi)) return false
  // Exact/saturated bounds are valid NDVI-domain values but too fragile for commercial prioritization.
  if (Math.abs(input.latestNdvi) >= 0.98 || Math.abs(input.seasonalBaselineNdvi) >= 0.98) return false
  return true
}
