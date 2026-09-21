import { canonicalRegionName, normalizeSearchText } from "./normalization"
import { deriveSentinelAttentionQueue, type SentinelAttentionRow } from "./sentinel-attention"

export type ProspectingSignalIdentity = {
  kmzId: string
  rol: string
  rolKey: string
  commune: string
  region: string
  address: string | null
  destination: string | null
  hasCoordinates: boolean
  cirenStatus: "matched" | "partial" | "ambiguous" | "not_found" | null
}

export type ProspectingMarketContext = {
  region: string
  commune: string
  periodDate: string
  sampleCount: number
  sourceCount: number
}

export type ProspectingOwnerContext = {
  rolKey: string
  commune: string
  decision: "contactar" | "validar_propietario" | "descartar" | string
  ownerName: string | null
  ownerConfidence: number | null
  researchedAt: string | null
}

export type ProspectingSignal = {
  rol: string
  rolKey: string
  commune: string
  region: string
  address: string | null
  destination: string | null
  priorityScore: number
  priorityBand: "alta" | "media" | "vigilar"
  signalStrength: number
  evidenceConfidence: number
  latestPeriod: string | null
  observationCount: number
  latest: { ndvi: number | null; ndre: number | null; ndmi: number | null }
  anomaly: {
    level: "watch" | "strong"
    direction: "above" | "below" | "similar" | "insufficient_data"
    ndviDelta: number | null
    ndmiDelta: number | null
    interpretation: string
  }
  identity: {
    status: "complete" | "partial"
    cirenStatus: ProspectingSignalIdentity["cirenStatus"]
  }
  market: {
    scope: "commune" | "region" | "none"
    sampleCount: number
    sourceCount: number
    periodDate: string | null
  }
  owner: {
    status: "candidate" | "pending" | "not_researched"
    name: string | null
    confidence: number | null
    researchedAt: string | null
  }
  reasons: string[]
  nextAction: string
}

export type ProspectingSignalSummary = {
  generatedAt: string
  monitoredRols: number
  actionableCount: number
  strongCount: number
  watchCount: number
  highPriorityCount: number
  ownerCandidateCount: number
  items: ProspectingSignal[]
  methodology: {
    purpose: string
    priority: string
    marketGuardrail: string
    satelliteGuardrail: string
  }
}

function rolKey(value: string) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "")
}

function locationKey(value: string) {
  return normalizeSearchText(value).replace(/^region de /, "").replace(/^region del /, "").replace(/^region /, "")
}

function regionKey(value: string) {
  return locationKey(canonicalRegionName(value))
}

function identityScore(identity: ProspectingSignalIdentity | null) {
  if (!identity) return 0
  let score = 0
  if (identity.rol) score += 8
  if (identity.commune) score += 7
  if (identity.region) score += 5
  if (identity.hasCoordinates) score += 8
  if (identity.address) score += 4
  if (identity.destination) score += 3
  return score
}

function cirenScore(status: ProspectingSignalIdentity["cirenStatus"]) {
  if (status === "matched") return 16
  if (status === "partial") return 12
  if (status === "ambiguous") return 7
  if (status === "not_found") return 4
  return 0
}

function historyScore(observationCount: number) {
  if (observationCount >= 18) return 28
  if (observationCount >= 12) return 23
  if (observationCount >= 6) return 15
  if (observationCount >= 2) return 8
  return 0
}

function marketScore(sampleCount: number, sourceCount: number) {
  const samples = sampleCount >= 20 ? 10 : sampleCount >= 5 ? 7 : sampleCount > 0 ? 4 : 0
  const sources = sourceCount >= 2 ? 4 : sourceCount === 1 ? 2 : 0
  return samples + sources
}

function ownerScore(owner: ProspectingOwnerContext | null) {
  if (!owner) return 0
  if (owner.ownerName) return 7
  return 3
}

function priorityBand(score: number): ProspectingSignal["priorityBand"] {
  if (score >= 82) return "alta"
  if (score >= 66) return "media"
  return "vigilar"
}

function bestIdentity(
  candidates: ProspectingSignalIdentity[],
  commune: string,
) {
  if (!candidates.length) return null
  const wantedCommune = locationKey(commune)
  return [...candidates].sort((a, b) => {
    const communeA = Number(locationKey(a.commune) === wantedCommune)
    const communeB = Number(locationKey(b.commune) === wantedCommune)
    const cirenWeight = (item: ProspectingSignalIdentity) =>
      item.cirenStatus === "matched" ? 4 :
      item.cirenStatus === "partial" ? 3 :
      item.cirenStatus === "ambiguous" ? 2 :
      item.cirenStatus === "not_found" ? 1 : 0
    return communeB - communeA ||
      cirenWeight(b) - cirenWeight(a) ||
      identityScore(b) - identityScore(a)
  })[0] ?? null
}

function marketFor(
  identity: ProspectingSignalIdentity | null,
  markets: ProspectingMarketContext[],
) {
  if (!identity) return { context: null, scope: "none" as const }
  const commune = locationKey(identity.commune)
  const region = regionKey(identity.region)

  const communeRows = markets.filter((row) => locationKey(row.commune) === commune && commune)
  if (communeRows.length) {
    return {
      context: [...communeRows].sort((a, b) =>
        b.periodDate.localeCompare(a.periodDate) || b.sampleCount - a.sampleCount,
      )[0] ?? null,
      scope: "commune" as const,
    }
  }

  const regionRows = markets.filter((row) => regionKey(row.region) === region && region)
  if (regionRows.length) {
    return {
      context: [...regionRows].sort((a, b) =>
        b.periodDate.localeCompare(a.periodDate) || b.sampleCount - a.sampleCount,
      )[0] ?? null,
      scope: "region" as const,
    }
  }

  return { context: null, scope: "none" as const }
}

function ownerFor(
  signalRolKey: string,
  commune: string,
  owners: ProspectingOwnerContext[],
) {
  const wantedCommune = locationKey(commune)
  return owners.find((owner) =>
    rolKey(owner.rolKey) === signalRolKey &&
    (!wantedCommune || locationKey(owner.commune) === wantedCommune),
  ) ?? owners.find((owner) => rolKey(owner.rolKey) === signalRolKey) ?? null
}

export function deriveProspectingSignals({
  observations,
  identities,
  markets,
  owners,
  now = new Date(),
}: {
  observations: SentinelAttentionRow[]
  identities: ProspectingSignalIdentity[]
  markets: ProspectingMarketContext[]
  owners: ProspectingOwnerContext[]
  now?: Date
}): ProspectingSignalSummary {
  const attention = deriveSentinelAttentionQueue(observations, now)
  const identityByRol = new Map<string, ProspectingSignalIdentity[]>()

  for (const identity of identities) {
    const key = rolKey(identity.rolKey || identity.rol)
    if (!key) continue
    const current = identityByRol.get(key) ?? []
    current.push(identity)
    identityByRol.set(key, current)
  }

  const items = attention.items.map((item): ProspectingSignal => {
    const key = rolKey(item.rol)
    const identity = bestIdentity(identityByRol.get(key) ?? [], item.commune)
    const owner = ownerFor(key, identity?.commune || item.commune, owners)
    const marketMatch = marketFor(identity, markets)
    const market = marketMatch.context

    const evidenceConfidence = Math.min(
      100,
      identityScore(identity) +
      cirenScore(identity?.cirenStatus ?? null) +
      historyScore(item.observationCount) +
      marketScore(market?.sampleCount ?? 0, market?.sourceCount ?? 0) +
      ownerScore(owner),
    )
    const signalStrength = item.anomaly.level === "strong" ? 100 : 65
    const priorityScore = Math.round(signalStrength * 0.72 + evidenceConfidence * 0.28)

    const reasons = [
      item.anomaly.interpretation,
      identity
        ? `SII: ROL y ubicación resueltos en ${identity.commune || item.commune}.`
        : "SII/KMZ: identidad territorial por completar.",
      identity?.cirenStatus
        ? `CIREN: estado ${identity.cirenStatus}; se usa como evidencia territorial, no como intención comercial.`
        : "CIREN: sin evidencia enlazada para este ROL.",
      market
        ? `Mercado: ${market.sampleCount} muestras recientes (${market.sourceCount} fuente${market.sourceCount === 1 ? "" : "s"}) a nivel ${marketMatch.scope === "commune" ? "comunal" : "regional"}.`
        : "Mercado: sin contexto comparable reciente enlazado.",
      owner?.ownerName
        ? `Propietario candidato disponible con confianza ${Math.round((owner.ownerConfidence ?? 0) * 100)}%; requiere validación registral.`
        : owner
          ? "Propietario investigado, todavía sin identidad suficientemente validada."
          : "Propietario aún no investigado en la capa de prospección.",
    ]

    const nextAction = item.anomaly.level === "strong"
      ? owner?.ownerName
        ? "Validar dominio vigente y revisar la causa del cambio antes de decidir cualquier acercamiento."
        : "Priorizar investigación de propietario y revisar la causa del cambio espectral antes de cualquier acercamiento."
      : owner?.ownerName
        ? "Mantener vigilancia, revalidar propietario y escalar sólo si la señal persiste o aparece evidencia comercial."
        : "Mantener en observación y completar propietario si el cambio persiste; no contactar sólo por la señal satelital."

    return {
      rol: item.rol,
      rolKey: key,
      commune: identity?.commune || item.commune,
      region: identity?.region || "",
      address: identity?.address ?? null,
      destination: identity?.destination ?? null,
      priorityScore,
      priorityBand: priorityBand(priorityScore),
      signalStrength,
      evidenceConfidence,
      latestPeriod: item.latestPeriod,
      observationCount: item.observationCount,
      latest: item.latest,
      anomaly: {
        level: item.anomaly.level as "watch" | "strong",
        direction: item.anomaly.direction,
        ndviDelta: item.anomaly.ndviDelta,
        ndmiDelta: item.anomaly.ndmiDelta,
        interpretation: item.anomaly.interpretation,
      },
      identity: {
        status: identity && identity.hasCoordinates && identity.commune ? "complete" : "partial",
        cirenStatus: identity?.cirenStatus ?? null,
      },
      market: {
        scope: marketMatch.scope,
        sampleCount: market?.sampleCount ?? 0,
        sourceCount: market?.sourceCount ?? 0,
        periodDate: market?.periodDate ?? null,
      },
      owner: {
        status: owner?.ownerName ? "candidate" : owner ? "pending" : "not_researched",
        name: owner?.ownerName ?? null,
        confidence: owner?.ownerConfidence ?? null,
        researchedAt: owner?.researchedAt ?? null,
      },
      reasons,
      nextAction,
    }
  }).sort((a, b) =>
    b.priorityScore - a.priorityScore ||
    b.evidenceConfidence - a.evidenceConfidence ||
    a.rol.localeCompare(b.rol, "es-CL"),
  )

  return {
    generatedAt: now.toISOString(),
    monitoredRols: attention.monitoredRols,
    actionableCount: items.length,
    strongCount: items.filter((item) => item.anomaly.level === "strong").length,
    watchCount: items.filter((item) => item.anomaly.level === "watch").length,
    highPriorityCount: items.filter((item) => item.priorityBand === "alta").length,
    ownerCandidateCount: items.filter((item) => item.owner.status === "candidate").length,
    items,
    methodology: {
      purpose: "Prioridad de investigación comercial, no probabilidad de venta.",
      priority: "72% fuerza de cambio Sentinel + 28% confianza de evidencia cruzada.",
      marketGuardrail: "Mercado aporta profundidad/contexto de comparables; no se usa tendencia mientras price_trend_30d, absorción y días activos no estén poblados.",
      satelliteGuardrail: "Cambio NDVI/NDMI indica variación espectral; no diagnostica causa, especie ni intención de vender.",
    },
  }
}
