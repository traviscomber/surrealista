import { findProspectingCandidates, type ProspectingCriteria } from "@/lib/prospeccion/matching"
import { getPublicAgriEvidence, type OffMarketProspect, type PublicAgriEvidence } from "@/lib/prospeccion/public-agri-intelligence"
import { getTerritorialInfrastructureEvidence, type TerritorialInfrastructureEvidence } from "@/lib/prospeccion/territorial-infrastructure"
import { linkCandidatesToKmz, linkOffMarketProspectsToKmz } from "@/lib/prospeccion/kmz-linking"

type MarketCandidate = Awaited<ReturnType<typeof findProspectingCandidates>>[number]
type MarketKmz = Awaited<ReturnType<typeof linkCandidatesToKmz>>
type OffMarketKmz = Awaited<ReturnType<typeof linkOffMarketProspectsToKmz>>

export type ProspectingSpecialist =
  | "prospecting_core"
  | "market_scout"
  | "territory_scout"
  | "agri_context"
  | "infrastructure"
  | "ownership"
  | "verification"

export type ProspectingSourceRef = {
  source?: string
  tool?: string
  mode: "read"
}

export type ProspectingCase = {
  id: string
  kind: "market" | "off_market"
  status: "ready_to_contact" | "owner_identified" | "verify_owner" | "review_market"
  score: number
  title: string
  location: string
  rol: string | null
  areaHa: number | null
  speciesEvidence: {
    target: string | null
    declared: string[]
    satelliteVerified: false
  }
  owner: { name: string; confidence: number; basis: string } | null
  contact: { name: string | null; phone: string | null; email: string | null } | null
  market: {
    published: boolean
    source: string | null
    sourceUrl: string | null
    opportunityScore: number | null
    fitScore: number | null
  }
  evidence: Array<{ label: string; authority: "canonical" | "official" | "derived"; source: string }>
  nextAction: string
}

export type ProspectingCoreResult = {
  criteria: ProspectingCriteria
  marketCandidates: MarketCandidate[]
  marketCount: number
  offMarketProspects: OffMarketProspect[]
  offMarketCount: number
  publicEvidence: PublicAgriEvidence
  infrastructure: TerritorialInfrastructureEvidence
  marketKmz: MarketKmz
  offMarketKmz: OffMarketKmz
  cases: ProspectingCase[]
  priorityCases: ProspectingCase[]
  scopeFallback: "region" | null
  sourceRefs: ProspectingSourceRef[]
  observedSpecialists: {
    specialists: ProspectingSpecialist[]
    observedTools: string[]
    attributionAuthority: "observed_tool_trace_only"
    inferredFromPrompt: false
  }
  groundedEvaluation: {
    state: "pass" | "warn"
    failedChecks: string[]
    authority: "deterministic_evidence_guard"
  }
  operationalMutationExecuted: false
}

function locationLabel(commune?: string | null, region?: string | null) {
  return [commune, region].filter(Boolean).join(" · ") || "Ubicación pendiente"
}

function marketCase(candidate: MarketCandidate, kmz: MarketKmz, species?: string | null): ProspectingCase {
  const links = kmz.links.filter((link) => link.candidate_id === String(candidate.id))
  const best = links.find((link) => link.identity_status === "spatial_candidate") ?? links[0] ?? null
  const owner = best?.owner ?? null
  const contact = best && (best.pic || best.pic_phone || best.pic_email)
    ? { name: best.pic || null, phone: best.pic_phone || null, email: best.pic_email || null }
    : null
  const status = contact?.phone || contact?.email
    ? "ready_to_contact"
    : owner
      ? "owner_identified"
      : "review_market"

  return {
    id: `market:${candidate.id}`,
    kind: "market",
    status,
    score: Math.max(0, Math.min(100, Number(candidate.prospecting_fit_score || 0))),
    title: candidate.title || "Predio publicado",
    location: locationLabel(candidate.commune, candidate.region),
    rol: Array.isArray(best?.rol_numbers) && best.rol_numbers.length ? String(best.rol_numbers[0]) : null,
    areaHa: Number.isFinite(Number(candidate.area_ha)) ? Number(candidate.area_ha) : null,
    speciesEvidence: { target: species || null, declared: [], satelliteVerified: false },
    owner: owner ? { name: owner.name, confidence: owner.confidence, basis: owner.basis } : null,
    contact,
    market: {
      published: true,
      source: candidate.source || null,
      sourceUrl: candidate.source_url || null,
      opportunityScore: Number(candidate.opportunity_score || 0),
      fitScore: Number(candidate.prospecting_fit_score || 0),
    },
    evidence: [
      { label: `${Number(candidate.area_ha || 0).toLocaleString("es-CL")} ha publicadas`, authority: "canonical", source: "properties_external" },
      { label: `ajuste ${candidate.prospecting_fit_score}/100`, authority: "derived", source: "prospecting_matching" },
      ...(best ? [{ label: `KMZ cercano a ${best.distance_km} km; no equivale a identidad catastral`, authority: "derived" as const, source: "kmz_search_index" }] : []),
    ],
    nextAction: status === "ready_to_contact"
      ? "Validar identidad/contacto y preparar acercamiento humano."
      : status === "owner_identified"
        ? "Validar propietario y resolver un contacto verificable."
        : "Revisar evidencia del aviso y resolver identidad/propietario antes de contacto.",
  }
}

function offMarketCase(prospect: OffMarketProspect, kmz: OffMarketKmz, species?: string | null): ProspectingCase {
  const exact = kmz.links.find((link) => link.prospect_id === prospect.id) ?? null
  const owner = exact?.owner ?? null
  const contact = exact && (exact.pic || exact.pic_phone || exact.pic_email)
    ? { name: exact.pic || null, phone: exact.pic_phone || null, email: exact.pic_email || null }
    : null
  const contactable = Boolean(contact?.phone || contact?.email)
  const score = Math.min(100,
    40
      + (prospect.areaHa != null ? 20 : 0)
      + (prospect.targetSpeciesMatch ? 15 : 0)
      + (exact ? 15 : 0)
      + (owner ? 5 : 0)
      + (contactable ? 5 : 0),
  )
  const status = contactable ? "ready_to_contact" : owner ? "owner_identified" : "verify_owner"

  return {
    id: prospect.id,
    kind: "off_market",
    status,
    score,
    title: `ROL ${prospect.rol}`,
    location: prospect.commune || "Comuna pendiente",
    rol: prospect.rol,
    areaHa: prospect.areaHa,
    speciesEvidence: {
      target: species || null,
      declared: prospect.declaredSpecies,
      satelliteVerified: false,
    },
    owner: owner ? { name: owner.name, confidence: owner.confidence, basis: owner.basis } : null,
    contact,
    market: { published: false, source: prospect.source, sourceUrl: prospect.sourceUrl, opportunityScore: null, fitScore: null },
    evidence: [
      { label: `ROL ${prospect.rol} en catastro CIREN ${prospect.surveyYear}`, authority: "official", source: prospect.source },
      ...(prospect.areaHa != null ? [{ label: `${prospect.areaHa.toLocaleString("es-CL")} ha estimadas desde polígono oficial`, authority: "derived" as const, source: prospect.source }] : []),
      ...(prospect.declaredSpecies.length ? [{ label: `especies declaradas: ${prospect.declaredSpecies.join(", ")}`, authority: "official" as const, source: prospect.source }] : []),
      ...(exact ? [{ label: "ROL coincidente exactamente con inventario KMZ", authority: "canonical" as const, source: "kmz_collection" }] : []),
    ],
    nextAction: contactable
      ? "Revalidar propietario y contacto; luego decidir acercamiento humano."
      : owner
        ? "Resolver teléfono/email verificable del propietario antes de contacto."
        : "Investigar propietario por ROL y descartar si la evidencia no alcanza.",
  }
}

function specialistTrace() {
  const refs: ProspectingSourceRef[] = [
    { source: "properties_external", tool: "read_market_candidates", mode: "read" },
    { source: "CIREN IDE MINAGRI", tool: "read_ciren_off_market", mode: "read" },
    { source: "ODEPA / CIREN", tool: "read_odepa_agri_context", mode: "read" },
    { source: "CIREN/CNR", tool: "read_irrigation_infrastructure", mode: "read" },
    { source: "CIREN", tool: "read_soils_context", mode: "read" },
    { source: "kmz_search_index", tool: "link_market_kmz", mode: "read" },
    { source: "kmz_collection", tool: "link_offmarket_rol_kmz", mode: "read" },
    { source: "prospecting_core", tool: "verify_and_rank_cases", mode: "read" },
  ]
  return {
    sourceRefs: refs,
    observedSpecialists: {
      specialists: [
        "prospecting_core",
        "market_scout",
        "territory_scout",
        "agri_context",
        "infrastructure",
        "ownership",
        "verification",
      ] as ProspectingSpecialist[],
      observedTools: refs.map((ref) => String(ref.tool)),
      attributionAuthority: "observed_tool_trace_only" as const,
      inferredFromPrompt: false as const,
    },
  }
}

function evaluateCases(cases: ProspectingCase[], criteria: ProspectingCriteria) {
  const failedChecks: string[] = []
  if (cases.some((item) => item.kind === "off_market" && !item.rol)) failedChecks.push("off_market_without_rol")
  if (cases.some((item) => item.contact && !item.contact.phone && !item.contact.email && item.status === "ready_to_contact")) failedChecks.push("contactable_without_contact")
  if (cases.some((item) => item.speciesEvidence.satelliteVerified !== false)) failedChecks.push("unsupported_satellite_claim")
  if (criteria.minHa != null && cases.some((item) => item.kind === "off_market" && item.areaHa != null && item.areaHa < criteria.minHa!)) failedChecks.push("off_market_below_min_area")
  if (criteria.maxHa != null && cases.some((item) => item.kind === "off_market" && item.areaHa != null && item.areaHa > criteria.maxHa!)) failedChecks.push("off_market_above_max_area")
  return {
    state: failedChecks.length ? "warn" as const : "pass" as const,
    failedChecks,
    authority: "deterministic_evidence_guard" as const,
  }
}

export async function runProspectingIntelligenceCore(criteria: ProspectingCriteria, limit = 60): Promise<ProspectingCoreResult> {
  const safeLimit = Math.max(1, Math.min(limit, 100))
  const [initialCandidates, publicEvidence, infrastructure] = await Promise.all([
    findProspectingCandidates(criteria, safeLimit),
    getPublicAgriEvidence(criteria),
    getTerritorialInfrastructureEvidence(criteria),
  ])

  let marketCandidates = initialCandidates
  let scopeFallback: "region" | null = null
  if (!marketCandidates.length && criteria.commune && criteria.region) {
    marketCandidates = await findProspectingCandidates({ ...criteria, commune: null }, safeLimit)
    if (marketCandidates.length) scopeFallback = "region"
  }

  const offMarketProspects = publicEvidence.ciren.offMarketProspects
  const [marketKmz, offMarketKmz] = await Promise.all([
    linkCandidatesToKmz(marketCandidates as any[], 20),
    linkOffMarketProspectsToKmz(offMarketProspects, 30),
  ])

  const cases = [
    ...offMarketProspects.map((prospect) => offMarketCase(prospect, offMarketKmz, criteria.species)),
    ...marketCandidates.map((candidate) => marketCase(candidate, marketKmz, criteria.species)),
  ].sort((a, b) => {
    const actionWeight = (item: ProspectingCase) => item.status === "ready_to_contact" ? 3 : item.status === "owner_identified" ? 2 : 1
    return actionWeight(b) - actionWeight(a) || b.score - a.score
  })

  const priorityCases = cases.slice(0, 3)
  const trace = specialistTrace()

  return {
    criteria,
    marketCandidates,
    marketCount: marketCandidates.length,
    offMarketProspects,
    offMarketCount: offMarketProspects.length,
    publicEvidence,
    infrastructure,
    marketKmz,
    offMarketKmz,
    cases,
    priorityCases,
    scopeFallback,
    ...trace,
    groundedEvaluation: evaluateCases(cases, criteria),
    operationalMutationExecuted: false,
  }
}
