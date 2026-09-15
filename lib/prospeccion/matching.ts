import { listRealOpportunities } from "@/lib/home-spotter/opportunities"
import { canonicalRegionName, normalizeProspectingCriteria, normalizeSearchText } from "@/lib/prospeccion/normalization"

type RawOpportunity = Awaited<ReturnType<typeof listRealOpportunities>>[number]
type Opportunity = NonNullable<RawOpportunity>

export type ProspectingCriteria = {
  region?: string | null
  commune?: string | null
  species?: string | null
  minHa?: number | null
  maxHa?: number | null
}

function hectares(areaM2: number) {
  return areaM2 / 10_000
}

function isOpportunity(item: RawOpportunity): item is Opportunity {
  return item !== null
}

function scoreCandidate(item: Opportunity, rawCriteria: ProspectingCriteria) {
  const criteria = normalizeProspectingCriteria(rawCriteria)
  const areaHa = hectares(Number(item.area_m2 || 0))
  const region = String(criteria.region || "").trim()
  const commune = String(criteria.commune || "").trim()
  const itemRegion = normalizeSearchText(canonicalRegionName(item.region))
  const wantedRegion = normalizeSearchText(canonicalRegionName(region))
  const regionMatch = !region || itemRegion === wantedRegion || itemRegion.includes(wantedRegion) || wantedRegion.includes(itemRegion)
  const communeMatch = !commune || normalizeSearchText(item.commune).includes(normalizeSearchText(commune))
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

function rankCandidates(opportunities: RawOpportunity[], rawCriteria: ProspectingCriteria, limit: number) {
  const criteria = normalizeProspectingCriteria(rawCriteria)
  return opportunities
    .filter(isOpportunity)
    .map((item) => scoreCandidate(item, criteria))
    .filter(isScoredCandidate)
    .sort((a, b) => b.prospecting_fit_score - a.prospecting_fit_score)
    .slice(0, Math.min(Math.max(limit, 1), 100))
}

export async function findProspectingCandidates(criteria: ProspectingCriteria, limit = 60) {
  const opportunities = await listRealOpportunities(500)
  return rankCandidates(opportunities, criteria, limit)
}

export async function findProspectingCandidatesBatch(
  criteriaList: Array<{ id: string; criteria: ProspectingCriteria }>,
  limit = 100,
) {
  const opportunities = await listRealOpportunities(500)
  return criteriaList.map((entry) => ({
    id: entry.id,
    candidates: rankCandidates(opportunities, entry.criteria, limit),
  }))
}