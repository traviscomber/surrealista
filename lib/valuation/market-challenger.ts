export const MARKET_CHALLENGER_VERSION = 'sr-market-challenger-v1'

export type MarketComparableInput = {
  price_clp: number
  price_uf: number | null
  area_m2: number
  price_per_m2_clp: number
  commune: string | null
  source: string
  source_url: string | null
  days_active: number | null
  scraped_at: string | null
}

export type RankedComparable = MarketComparableInput & {
  similarity_score: number
  included: boolean
  exclusion_reason: string | null
}

export type ChallengerResult = {
  algorithm_version: string
  estimated_price: number
  price_per_sqm: number
  price_range: { low: number; base: number; high: number }
  confidence: number
  confidence_components: {
    sample: number
    recency: number
    dispersion: number
    geographic_specificity: number
  }
  confidence_reasons: string[]
  sample_count: number
  candidate_count: number
  dispersion_cv: number
  comparables: RankedComparable[]
  snapshot: {
    algorithm_version: string
    generated_at: string
    subject: { area_m2: number; region: string; commune: string | null; property_type: string }
    selected_count: number
    excluded_count: number
    price_per_sqm: { q25: number; median: number; q75: number }
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sorted(values: number[]) {
  return [...values].sort((a, b) => a - b)
}

export function quantile(values: number[], q: number): number {
  if (!values.length) return 0
  const ordered = sorted(values)
  const position = (ordered.length - 1) * clamp(q, 0, 1)
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return ordered[lower]
  const weight = position - lower
  return ordered[lower] * (1 - weight) + ordered[upper] * weight
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim().toLocaleLowerCase('es-CL')
}

function ageDays(date: string | null) {
  if (!date) return 365
  const timestamp = Date.parse(date)
  if (!Number.isFinite(timestamp)) return 365
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
}

function areaSimilarity(subjectArea: number, comparableArea: number) {
  if (subjectArea <= 0 || comparableArea <= 0) return 0
  const ratio = Math.min(subjectArea, comparableArea) / Math.max(subjectArea, comparableArea)
  return clamp(ratio * 100, 0, 100)
}

function recencyScore(scrapedAt: string | null) {
  const days = ageDays(scrapedAt)
  if (days <= 30) return 100
  if (days <= 90) return 85
  if (days <= 180) return 65
  if (days <= 365) return 40
  return 20
}

function comparableSimilarity(
  item: MarketComparableInput,
  subjectArea: number,
  subjectCommune: string | null,
) {
  const area = areaSimilarity(subjectArea, item.area_m2)
  const subjectCity = normalizeText(subjectCommune)
  const itemCity = normalizeText(item.commune)
  const location = subjectCity ? (itemCity.includes(subjectCity) || subjectCity.includes(itemCity) ? 100 : 35) : 65
  const recency = recencyScore(item.scraped_at)
  const traceability = item.source_url ? 100 : 60

  // Generic N3uralia ranking: subject similarity + evidence quality. No customer-specific calibration.
  return Math.round(area * 0.5 + location * 0.25 + recency * 0.15 + traceability * 0.1)
}

export function buildMarketChallenger(input: {
  comparables: MarketComparableInput[]
  area_m2: number
  region: string
  commune?: string | null
  property_type: string
}): ChallengerResult | null {
  const candidates = input.comparables
    .filter((item) => Number.isFinite(item.price_per_m2_clp) && item.price_per_m2_clp > 0 && Number.isFinite(item.area_m2) && item.area_m2 > 0)
    .map((item) => ({
      ...item,
      similarity_score: comparableSimilarity(item, input.area_m2, input.commune ?? null),
      included: true,
      exclusion_reason: null as string | null,
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score)

  if (candidates.length < 3) return null

  const prices = candidates.map((item) => item.price_per_m2_clp)
  const q1 = quantile(prices, 0.25)
  const q3 = quantile(prices, 0.75)
  const iqr = Math.max(0, q3 - q1)
  const lowerFence = Math.max(0, q1 - 1.5 * iqr)
  const upperFence = q3 + 1.5 * iqr

  const ranked = candidates.map((item) => {
    const isOutlier = iqr > 0 && (item.price_per_m2_clp < lowerFence || item.price_per_m2_clp > upperFence)
    return isOutlier
      ? { ...item, included: false, exclusion_reason: 'price_outlier_iqr' }
      : item
  })

  let selected = ranked.filter((item) => item.included).slice(0, 20)
  if (selected.length < 3) {
    selected = ranked.slice(0, Math.min(20, ranked.length)).map((item) => ({ ...item, included: true, exclusion_reason: null }))
  }
  const selectedUrls = new Set(selected.map((item) => `${item.source}|${item.source_url ?? ''}|${item.price_clp}|${item.area_m2}`))
  const finalComparables = ranked.map((item) => {
    const key = `${item.source}|${item.source_url ?? ''}|${item.price_clp}|${item.area_m2}`
    if (selectedUrls.has(key)) return { ...item, included: true, exclusion_reason: null }
    if (!item.exclusion_reason) return { ...item, included: false, exclusion_reason: 'lower_similarity_rank' }
    return item
  })

  const selectedPrices = selected.map((item) => item.price_per_m2_clp)
  const lowM2 = quantile(selectedPrices, 0.25)
  const medianM2 = quantile(selectedPrices, 0.5)
  const highM2 = quantile(selectedPrices, 0.75)
  const mean = selectedPrices.reduce((sum, value) => sum + value, 0) / selectedPrices.length
  const variance = selectedPrices.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / selectedPrices.length
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1

  const avgAge = selected.reduce((sum, item) => sum + ageDays(item.scraped_at), 0) / selected.length
  const exactCommuneCount = input.commune
    ? selected.filter((item) => normalizeText(item.commune).includes(normalizeText(input.commune))).length
    : 0

  const sampleComponent = clamp(Math.round((selected.length / 15) * 35), 8, 35)
  const recencyComponent = avgAge <= 45 ? 20 : avgAge <= 90 ? 17 : avgAge <= 180 ? 12 : avgAge <= 365 ? 7 : 3
  const dispersionComponent = cv <= 0.2 ? 30 : cv <= 0.35 ? 24 : cv <= 0.5 ? 17 : cv <= 0.75 ? 10 : 4
  const geographicComponent = input.commune
    ? clamp(Math.round((exactCommuneCount / selected.length) * 15), 2, 15)
    : 7
  const confidence = clamp(sampleComponent + recencyComponent + dispersionComponent + geographicComponent, 0, 100)

  const confidenceReasons = [
    `${selected.length} comparables seleccionados de ${candidates.length} candidatos`,
    `Antigüedad media de la muestra: ${Math.round(avgAge)} días`,
    `Dispersión relativa del precio/m²: ${(cv * 100).toFixed(1)}%`,
    input.commune
      ? `${exactCommuneCount}/${selected.length} comparables coinciden con la comuna indicada`
      : 'Sin comuna: precisión geográfica limitada a región',
  ]

  const generatedAt = new Date().toISOString()
  return {
    algorithm_version: MARKET_CHALLENGER_VERSION,
    estimated_price: Math.round(medianM2 * input.area_m2),
    price_per_sqm: Math.round(medianM2),
    price_range: {
      low: Math.round(lowM2 * input.area_m2),
      base: Math.round(medianM2 * input.area_m2),
      high: Math.round(highM2 * input.area_m2),
    },
    confidence,
    confidence_components: {
      sample: sampleComponent,
      recency: recencyComponent,
      dispersion: dispersionComponent,
      geographic_specificity: geographicComponent,
    },
    confidence_reasons: confidenceReasons,
    sample_count: selected.length,
    candidate_count: candidates.length,
    dispersion_cv: Number(cv.toFixed(4)),
    comparables: finalComparables,
    snapshot: {
      algorithm_version: MARKET_CHALLENGER_VERSION,
      generated_at: generatedAt,
      subject: {
        area_m2: input.area_m2,
        region: input.region,
        commune: input.commune ?? null,
        property_type: input.property_type,
      },
      selected_count: selected.length,
      excluded_count: finalComparables.filter((item) => !item.included).length,
      price_per_sqm: {
        q25: Math.round(lowM2),
        median: Math.round(medianM2),
        q75: Math.round(highM2),
      },
    },
  }
}
