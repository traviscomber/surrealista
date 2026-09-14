import { listRealOpportunities } from "@/lib/home-spotter/opportunities"

type RawOpportunity = Awaited<ReturnType<typeof listRealOpportunities>>[number]
type Opportunity = NonNullable<RawOpportunity>

export type ProspectingCriteria = {
  region?: string | null
  commune?: string | null
  species?: string | null
  minHa?: number | null
  maxHa?: number | null
}

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toLocaleLowerCase("es-CL")
}

function hectares(areaM2: number) {
  return areaM2 / 10_000
}

function isOpportunity(item: RawOpportunity): item is Opportunity {
  return item !== null
}

function scoreCandidate(item: Opportunity, criteria: ProspectingCriteria) {
  const areaHa = hectares(Number(item.area_m2 || 0))
  const region = String(criteria.region || "").trim()
  const commune = String(criteria.commune || "").trim()
  const regionMatch = !region || normalize(item.region) === normalize(region)
  const communeMatch = !commune || normalize(item.commune).includes(normalize(commune))
  const minMatch = criteria.minHa == null || areaHa >= criteria.minHa
  const maxMatch = criteria.maxHa == null || areaHa <= criteria.maxHa

  if (!regionMatch || !communeMatch || !minMatch || !maxMatch) return null

  const geographicFit = commune ? 100 : region ? 85 : 65
  const areaFit = criteria.minHa != null || criteria.maxHa != null ? 100 : 70
  const marketSignal = Number(item.opportunity_score || 0)
  const fitScore = Math.round(geographicFit * 0.4 + areaFit * 0.25 + marketSignal * 0.35)

  return {
    ...item,
    area_ha: Number(areaHa.toFixed(2)),
    prospecting_fit_score: fitScore,
  }
}

type ScoredCandidate = NonNullable<ReturnType<typeof scoreCandidate>>

function isScoredCandidate(candidate: ReturnType<typeof scoreCandidate>): candidate is ScoredCandidate {
  return candidate !== null
}

function rankCandidates(opportunities: RawOpportunity[], criteria: ProspectingCriteria, limit: number) {
  return opportunities
    .filter(isOpportunity)
    .map((item) => scoreCandidate(item, criteria))
    .filter(isScoredCandidate)
    .sort((a, b) => b.prospecting_fit_score - a.prospecting_fit_score)
    .slice(0, Math.min(Math.max(limit, 1), 100))
}

export async function findProspectingCandidates(criteria: ProspectingCriteria, limit = 60) {
  const opportunities = await listRealOpportunities(100)
  return rankCandidates(opportunities, criteria, limit)
}

export async function findProspectingCandidatesBatch(
  criteriaList: Array<{ id: string; criteria: ProspectingCriteria }>,
  limit = 100,
) {
  const opportunities = await listRealOpportunities(100)
  return criteriaList.map((entry) => ({
    id: entry.id,
    candidates: rankCandidates(opportunities, entry.criteria, limit),
  }))
}
