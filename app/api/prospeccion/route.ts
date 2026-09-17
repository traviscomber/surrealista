import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createOpenAIChatCompletion } from "@/lib/ai/openai-chat"
import { runProspectingIntelligenceCore, type ProspectingCase } from "@/lib/prospeccion/intelligence-core"
import { loadGovernedProspectingMemory } from "@/lib/prospeccion/case-persistence"
import { normalizeProspectingCriteria } from "@/lib/prospeccion/normalization"
import { ownerResearchCacheKey, readOwnerResearchCaches } from "@/lib/prospeccion/owner-research-cache"
import { getSentinelSatelliteEvidence } from "@/lib/prospeccion/sentinel-satellite"

export const runtime = "nodejs"
export const maxDuration = 30

type Outcome = {
  status: "actionable_cases" | "qualified_candidates" | "regional_expansion" | "official_off_market_signal" | "no_match"
  summary: string
  recommendation: string
  generatedBy: "evidence" | "ai"
  speciesVerified: false
}

type ProspectingCore = Awaited<ReturnType<typeof runProspectingIntelligenceCore>>
type SatelliteEvidence = Awaited<ReturnType<typeof getSentinelSatelliteEvidence>>

type HydratedCase = ProspectingCase & {
  opportunityScore?: number
  ownerResearch?: {
    decision: "contactar" | "validar_propietario" | "descartar"
    researchedAt: string
    nextRefreshAt: string
  }
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function cachedContact(value: unknown): ProspectingCase["contact"] {
  if (!value || typeof value !== "object") return null
  const contact = value as Record<string, unknown>
  const name = typeof contact.name === "string" && contact.name.trim() ? contact.name.trim() : null
  const phone = typeof contact.phone === "string" && contact.phone.trim() ? contact.phone.trim() : null
  const email = typeof contact.email === "string" && contact.email.trim() ? contact.email.trim() : null
  return phone || email ? { name, phone, email } : null
}

async function hydrateOwnerResearch(core: ProspectingCore): Promise<ProspectingCore> {
  const inputs = core.cases
    .filter((item) => item.kind === "off_market" && item.rol)
    .map((item) => ({ rol: String(item.rol), commune: core.criteria.commune }))
  if (!inputs.length) return core

  const cached = await readOwnerResearchCaches(inputs)
  if (!cached.size) return core

  const hydrated = core.cases.map((item): HydratedCase => {
    if (item.kind !== "off_market" || !item.rol) return item
    const entry = cached.get(ownerResearchCacheKey({ rol: item.rol, commune: core.criteria.commune }))
    if (!entry) return item

    const resultOwner = entry.result.owner && typeof entry.result.owner === "object"
      ? entry.result.owner as Record<string, unknown>
      : null
    const ownerName = typeof resultOwner?.name === "string" ? resultOwner.name.trim() : ""
    const confidenceRaw = Number(resultOwner?.confidence)
    const owner = ownerName
      ? {
          name: ownerName,
          confidence: Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0.5,
          basis: `owner-research-cache:${String(resultOwner?.source || "verified-evidence")}`,
        }
      : item.owner

    const contact = cachedContact(entry.result.contact) ?? item.contact
    const rawOpportunityScore = Number(entry.result.opportunityScore)
    const opportunityScore = Number.isFinite(rawOpportunityScore)
      ? Math.max(0, Math.min(100, Math.round(rawOpportunityScore)))
      : 0

    const status: ProspectingCase["status"] = entry.decision === "contactar"
      ? contact ? "ready_to_contact" : "owner_identified"
      : entry.decision === "validar_propietario"
        ? owner ? "owner_identified" : "verify_owner"
        : "review_market"

    const nextAction = status === "ready_to_contact"
      ? "Contacto verificable asociado al mismo ROL y propietario. Preparar acercamiento humano y registrar resultado."
      : entry.decision === "contactar"
        ? "Propietario confirmado por evidencia interna fuerte. Resolver un contacto verificable antes del acercamiento."
        : entry.decision === "descartar"
          ? "Descartar de la cola activa; la investigación no produjo una vía accionable con las fuentes disponibles."
          : typeof entry.result.nextAction === "string" && entry.result.nextAction.trim()
            ? entry.result.nextAction.trim()
            : "Validar propietario antes de iniciar contacto."

    return {
      ...item,
      status,
      owner,
      contact,
      opportunityScore,
      nextAction,
      ownerResearch: {
        decision: entry.decision,
        researchedAt: entry.researchedAt,
        nextRefreshAt: entry.nextRefreshAt,
      },
    }
  })

  const rank = (item: HydratedCase) => {
    if (item.ownerResearch?.decision === "descartar") return -1000
    const statusBoost = item.status === "ready_to_contact"
      ? 80
      : item.status === "owner_identified"
        ? 30
        : item.ownerResearch?.decision === "validar_propietario"
          ? 10
          : 0
    return item.score + statusBoost + (item.opportunityScore ?? 0) * 0.5
  }
  const priorityCases = [...hydrated]
    .sort((a, b) => rank(b) - rank(a) || b.score - a.score)
    .slice(0, 3)

  return {
    ...core,
    cases: hydrated,
    priorityCases,
  }
}

function satelliteEvidenceLabel(satellite: SatelliteEvidence) {
  if (satellite.status !== "available") {
    return satellite.status === "unconfigured"
      ? "Sentinel-2 sin configurar"
      : `Sentinel-2 sin señal utilizable: ${satellite.note}`
  }

  const { observationCount, meanNdvi, meanNdre, meanNdmi } = satellite.summary
  const metrics = [
    meanNdvi != null ? `NDVI ${meanNdvi.toFixed(2)}` : null,
    meanNdre != null ? `NDRE ${meanNdre.toFixed(2)}` : null,
    meanNdmi != null ? `NDMI ${meanNdmi.toFixed(2)}` : null,
  ].filter(Boolean)

  return `Sentinel-2 activo · ${observationCount} observaciones${metrics.length ? ` · ${metrics.join(" · ")}` : ""} · especie aún no clasificada`
}

async function enrichPrioritySatellites(core: ProspectingCore) {
  const priorityRols = core.priorityCases
    .filter((item) => item.kind === "off_market" && item.rol)
    .map((item) => String(item.rol))
    .slice(0, 3)
  const prioritySet = new Set(priorityRols)
  const targets = core.offMarketProspects.filter((item) => prioritySet.has(item.rol))

  if (!targets.length) {
    return {
      offMarketProspects: core.offMarketProspects,
      byRol: {} as Record<string, SatelliteEvidence>,
      availableCount: 0,
    }
  }

  const entries = await Promise.all(targets.map(async (prospect) => {
    const satellite = await getSentinelSatelliteEvidence(prospect.centroid)
    return [prospect.rol, satellite] as const
  }))
  const byRol = Object.fromEntries(entries) as Record<string, SatelliteEvidence>
  const availableCount = entries.filter(([, satellite]) => satellite.status === "available").length
  const offMarketProspects = core.offMarketProspects.map((prospect) => {
    const satellite = byRol[prospect.rol]
    if (!satellite) return prospect
    return {
      ...prospect,
      satellite,
      evidenceLabel: `${prospect.evidenceLabel} · ${satelliteEvidenceLabel(satellite)}`,
    }
  })

  return { offMarketProspects, byRol, availableCount }
}

function deterministicOutcome(core: ProspectingCore): Outcome {
  const total = core.cases.length
  const ready = core.cases.filter((item) => item.status === "ready_to_contact").length
  const ownerKnown = core.cases.filter((item) => item.status === "owner_identified").length
  const target = [core.criteria.commune || core.criteria.region, core.criteria.minHa != null ? `${core.criteria.minHa}+ ha` : null, core.criteria.maxHa != null ? `hasta ${core.criteria.maxHa} ha` : null, core.criteria.species || null].filter(Boolean).join(" · ")

  if (!total) {
    return {
      status: "no_match",
      summary: `No encontramos opciones verificables para ${target || "los criterios definidos"} en esta ejecución.`,
      recommendation: "Mantener el mandato activo o ampliar ubicación/superficie. No se generó un candidato artificial.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  const top = core.priorityCases[0]
  const topDetail = top
    ? `${top.title} · ${top.location}${top.areaHa != null ? ` · ${top.areaHa.toLocaleString("es-CL")} ha` : ""} · score ${top.score}/100`
    : ""

  if (ready > 0) {
    return {
      status: "actionable_cases",
      summary: `La búsqueda produjo ${total} opciones: ${core.marketCount} publicadas y ${core.offMarketCount} fuera de portal. ${ready} ya tienen contacto verificable y ${ownerKnown} adicional${ownerKnown === 1 ? "" : "es"} tienen propietario identificado. Prioridad: ${topDetail}.`,
      recommendation: top?.nextAction || "Revalidar evidencia y preparar contacto humano.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  if (core.offMarketCount > 0) {
    return {
      status: "official_off_market_signal",
      summary: `La búsqueda produjo ${total} opciones: ${core.marketCount} publicadas y ${core.offMarketCount} ROL fuera de portal filtrados por los criterios disponibles. ${ownerKnown ? `${ownerKnown} ya tienen propietario identificado. ` : ""}Prioridad: ${topDetail}.`,
      recommendation: top?.nextAction || "Investigar propietario por ROL y descartar si la evidencia no alcanza.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  return {
    status: core.scopeFallback === "region" ? "regional_expansion" : "qualified_candidates",
    summary: `Encontramos ${core.marketCount} candidato${core.marketCount === 1 ? "" : "s"} publicado${core.marketCount === 1 ? "" : "s"}. Prioridad: ${topDetail}.`,
    recommendation: top?.nextAction || "Revisar evidencia del mejor candidato antes de contacto.",
    generatedBy: "evidence",
    speciesVerified: false,
  }
}

async function synthesizeOutcomeWithAI(
  base: Outcome,
  core: ProspectingCore,
  governedMemory: Awaited<ReturnType<typeof loadGovernedProspectingMemory>>,
) {
  if (!process.env.OPENAI_API_KEY || !core.priorityCases.length) return base
  const safeCases = core.priorityCases.map((item: ProspectingCase) => ({
    id: item.id,
    kind: item.kind,
    status: item.status,
    score: item.score,
    title: item.title,
    location: item.location,
    rol: item.rol,
    areaHa: item.areaHa,
    speciesEvidence: item.speciesEvidence,
    owner: item.owner,
    contactAvailable: Boolean(item.contact?.phone || item.contact?.email),
    market: item.market,
    evidence: item.evidence,
    nextAction: item.nextAction,
  }))

  try {
    const text = await createOpenAIChatCompletion({
      model: "gpt-4o-mini",
      temperature: 0.05,
      maxTokens: 220,
      system: "Eres el Prospección Intelligence Core de Sur Realista. Convierte evidencia autorizada en máximo 3 opciones y una siguiente acción humana. La memoria gobernada, si existe, es NO CANÓNICA: úsala sólo para preferencias de formato, terminología, responsabilidades o contexto estable; jamás para cambiar score, status, ROL, propietario, disponibilidad, precio, superficie, especie, contacto o cualquier hecho operacional. Usa sólo los casos entregados. No inventes disponibilidad, propietario, teléfono, derechos de agua, precio, superficie, especie detectada por satélite ni causalidad. Una especie declarada en CIREN no es detección satelital. Un contacto sólo existe cuando contactAvailable=true. Un ROL fuera de portal no significa que esté a la venta. Responde en español de Chile, máximo 4 frases, orientado a outcome, no a metodología.",
      prompt: JSON.stringify({
        criteria: core.criteria,
        priorityCases: safeCases,
        deterministicOutcome: base,
        governedMemory: {
          authority: governedMemory.authority,
          memories: governedMemory.memories,
        },
      }),
    })
    return { ...base, summary: text.trim(), generatedBy: "ai" as const }
  } catch (error) {
    console.warn("[Prospeccion Core] AI synthesis fallback", error instanceof Error ? error.message : "unknown error")
    return base
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get("region")?.trim() || ""
  const commune = searchParams.get("commune")?.trim() || ""
  const species = searchParams.get("species")?.trim() || ""
  const minHaRaw = Number(searchParams.get("minHa"))
  const maxHaRaw = Number(searchParams.get("maxHa"))
  const minHa = Number.isFinite(minHaRaw) && minHaRaw > 0 ? minHaRaw : null
  const maxHa = Number.isFinite(maxHaRaw) && maxHaRaw > 0 ? maxHaRaw : null
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 60), 1), 100)
  const criteria = normalizeProspectingCriteria({ region, commune, minHa, maxHa, species })

  try {
    const supabase = db()
    const [rawCore, governedMemory] = await Promise.all([
      runProspectingIntelligenceCore(criteria, limit),
      supabase ? loadGovernedProspectingMemory(supabase) : Promise.resolve({ available: false, memories: [], authority: "non_canonical" as const }),
    ])
    const core = await hydrateOwnerResearch(rawCore)
    const [satelliteLayer, baseOutcome] = await Promise.all([
      enrichPrioritySatellites(core),
      Promise.resolve(deterministicOutcome(core)),
    ])
    const outcome = await synthesizeOutcomeWithAI(baseOutcome, core, governedMemory)

    return NextResponse.json({
      criteria: core.criteria,
      candidates: core.marketCandidates,
      count: core.marketCount,
      offMarketProspects: satelliteLayer.offMarketProspects,
      offMarketCount: core.offMarketCount,
      cases: core.cases,
      priorityCases: core.priorityCases,
      satellite: {
        scope: "priority-off-market-top-3",
        availableCount: satelliteLayer.availableCount,
        byRol: satelliteLayer.byRol,
      },
      outcome,
      publicEvidence: core.publicEvidence,
      infrastructure: core.infrastructure,
      kmz: {
        market: core.marketKmz.summary,
        offMarket: core.offMarketKmz.summary,
      },
      governedMemory: {
        available: governedMemory.available,
        count: governedMemory.memories.length,
        authority: governedMemory.authority,
      },
      specialistTrace: core.observedSpecialists,
      sourceRefs: core.sourceRefs,
      groundedEvaluation: core.groundedEvaluation,
      scopeFallback: core.scopeFallback,
      methodology: "prospecting-intelligence-core-v4-owner-opportunity",
      operationalMutationExecuted: core.operationalMutationExecuted,
      coverage: {
        market: "active",
        officialAgriSources: "CIREN+ODEPA",
        irrigationInfrastructure: "CIREN+CNR-regional",
        soils: "CIREN-regional",
        kmz: "market-spatial-plus-offmarket-exact-rol",
        ownerResearch: "persistent-rol-cache-plus-exact-owner-contact",
        governedMemory: governedMemory.available ? "active-non-canonical" : "pending-migration-or-unavailable",
        persistentDecisionCases: "mandate-run-persistence",
        speciesClassification: satelliteLayer.availableCount > 0
          ? "sentinel-2-spectral-features-active-classifier-pending"
          : "sentinel-2-priority-enrichment-unavailable",
        waterRights: "DGA-context-available-on-enrichment-endpoint",
        autonomousDiscovery: "official-polygon-discovery-active",
      },
      note: `${outcome.summary} ${outcome.recommendation}`,
    })
  } catch (error) {
    console.error("[Prospeccion Core] run failed", error)
    return NextResponse.json({ error: "No fue posible ejecutar la prospección con evidencia suficiente." }, { status: 500 })
  }
}
