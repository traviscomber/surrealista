export const MARKET_CHALLENGER_VERSION = 'sr-market-challenger-v2'

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
  title?: string | null
}

export type RankedComparable = MarketComparableInput & {
  effective_area_m2: number
  effective_price_per_m2_clp: number
  area_normalization: 'none' | 'title_m2' | 'title_ha' | 'source_thousand_m2'
  area_confidence: 'high' | 'medium'
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
    surface_quality: number
  }
  confidence_reasons: string[]
  sample_count: number
  candidate_count: number
  normalized_surface_count: number
  dispersion_cv: number
  comparables: RankedComparable[]
  snapshot: {
    algorithm_version: string
    generated_at: string
    subject: { area_m2: number; region: string; commune: string | null; property_type: string }
    selected_count: number
    excluded_count: number
    normalized_surface_count: number
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

function parseLocaleNumber(raw: string) {
  const value = raw.trim()
  if (!value) return null

  if (/^\d{1,3}(?:\.\d{3})+$/.test(value)) {
    const parsed = Number(value.replace(/\./g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }

  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function explicitAreaFromTitle(title: string | null | undefined) {
  const text = String(title ?? '').toLocaleLowerCase('es-CL')
  if (!text) return null

  const m2Match = text.match(/(\d{1,3}(?:\.\d{3})+|\d+(?:[.,]\d+)?)\s*(?:m2|m²|mt2|mts2|mts\s*cuadrados|mtrs|metros\s*cuadrados)/i)
  if (m2Match) {
    const value = parseLocaleNumber(m2Match[1])
    if (value && value >= 100) return { area_m2: value, method: 'title_m2' as const, confidence: 'high' as const }
  }

  const haMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ha|hect[aá]reas?)/i)
  if (haMatch) {
    const value = parseLocaleNumber(haMatch[1])
    if (value && value > 0) return { area_m2: value * 10_000, method: 'title_ha' as const, confidence: 'high' as const }
  }

  return null
}

function normalizeComparableSurface(item: MarketComparableInput, propertyType: string) {
  const explicit = explicitAreaFromTitle(item.title)
  if (explicit) {
    return {
      effective_area_m2: explicit.area_m2,
      area_normalization: explicit.method,
      area_confidence: explicit.confidence,
    }
  }

  const type = normalizeText(propertyType)
  const ruralType = ['parcela', 'agrícola', 'agricola', 'terreno rural', 'loteo / parcelación'].includes(type)
  const source = normalizeText(item.source)
  const sourceUsesThousands = source === 'rura' || source === 'portalterreno'

  if (ruralType && sourceUsesThousands && item.area_m2 >= 1 && item.area_m2 < 100) {
    return {
      effective_area_m2: item.area_m2 * 1_000,
      area_normalization: 'source_thousand_m2' as const,
      area_confidence: 'medium' as const,
    }
  }

  return {
    effective_area_m2: item.area_m2,
    area_normalization: 'none' as const,
    area_confidence: 'high' as const,
  }
}

function comparableSimilarity(
  item: Pick<RankedComparable, 'effective_area_m2' | 'commune' | 'scraped_at' | 'source_url' | 'area_confidence'>,
  subjectArea: number,
  subjectCommune: string | null,
) {
  const area = areaSimilarity(subjectArea, item.effective_area_m2)
  const subjectCity = normalizeText(subjectCommune)
  const itemCity = normalizeText(item.commune)
  const location = subjectCity ? (itemCity.includes(subjectCity) || subjectCity.includes(itemCity) ? 100 : 35) : 65
  const recency = recencyScore(item.scraped_at)
  const traceability = item.source_url ? 100 : 60
  const surfaceQuality = item.area_confidence === 'high' ? 100 : 70

  return Math.round(area * 0.45 + location * 0.25 + recency * 0.15 + traceability * 0.1 + surfaceQuality * 0.05)
}

export function buildMarketChallenger(input: {
  comparables: MarketComparableInput[]
  area_m2: number
  region: string
  commune?: string | null
  property_type: string
}): ChallengerResult | null {
  const candidates = input.comparables
    .filter((item) => Number.isFinite(item.price_clp) && item.price_clp > 0 && Number.isFinite(item.area_m2) && item.area_m2 > 0)
    .map((item) => {
      const normalized = normalizeComparableSurface(item, input.property_type)
      const effectivePrice = item.price_clp / normalized.effective_area_m2
      const ranked: RankedComparable = {
        ...item,
        ...normalized,
        effective_price_per_m2_clp: effectivePrice,
        similarity_score: 0,
        included: true,
        exclusion_reason: null,
      }
      ranked.similarity_score = comparableSimilarity(ranked, input.area_m2, input.commune ?? null)
      return ranked
    })
    .filter((item) => Number.isFinite(item.effective_price_per_m2_clp) && item.effective_price_per_m2_clp > 0)
    .sort((a, b) => b.similarity_score - a.similarity_score)

  if (candidates.length < 3) return null

  const prices = candidates.map((item) => item.effective_price_per_m2_clp)
  const q1 = quantile(prices, 0.25)
  const q3 = quantile(prices, 0.75)
  const iqr = Math.max(0, q3 - q1)
  const lowerFence = Math.max(0, q1 - 1.5 * iqr)
  const upperFence = q3 + 1.5 * iqr

  const ranked = candidates.map((item) => {
    const areaRatio = Math.min(input.area_m2, item.effective_area_m2) / Math.max(input.area_m2, item.effective_area_m2)
    if (areaRatio < 0.2) return { ...item, included: false, exclusion_reason: 'surface_mismatch' }

    const isOutlier = iqr > 0 && (item.effective_price_per_m2_clp < lowerFence || item.effective_price_per_m2_clp > upperFence)
    return isOutlier
      ? { ...item, included: false, exclusion_reason: 'price_outlier_iqr' }
      : item
  })

  let selected = ranked.filter((item) => item.included).slice(0, 20)
  if (selected.length < 3) return null

  const selectedUrls = new Set(selected.map((item) => `${item.source}|${item.source_url ?? ''}|${item.price_clp}|${item.effective_area_m2}`))
  const finalComparables = ranked.map((item) => {
    const key = `${item.source}|${item.source_url ?? ''}|${item.price_clp}|${item.effective_area_m2}`
    if (selectedUrls.has(key)) return { ...item, included: true, exclusion_reason: null }
    if (!item.exclusion_reason) return { ...item, included: false, exclusion_reason: 'lower_similarity_rank' }
    return item
  })

  const selectedPrices = selected.map((item) => item.effective_price_per_m2_clp)
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
  const mediumSurfaceCount = selected.filter((item) => item.area_confidence === 'medium').length
  const normalizedSurfaceCount = selected.filter((item) => item.area_normalization !== 'none').length

  const sampleComponent = clamp(Math.round((selected.length / 15) * 30), 7, 30)
  const recencyComponent = avgAge <= 45 ? 20 : avgAge <= 90 ? 17 : avgAge <= 180 ? 12 : avgAge <= 365 ? 7 : 3
  const dispersionComponent = cv <= 0.2 ? 25 : cv <= 0.35 ? 20 : cv <= 0.5 ? 14 : cv <= 0.75 ? 8 : 3
  const geographicComponent = input.commune
    ? clamp(Math.round((exactCommuneCount / selected.length) * 15), 2, 15)
    : 7
  const surfaceComponent = clamp(Math.round(10 - (mediumSurfaceCount / selected.length) * 5), 5, 10)
  const confidence = clamp(sampleComponent + recencyComponent + dispersionComponent + geographicComponent + surfaceComponent, 0, 100)

  const confidenceReasons = [
    `${selected.length} comparables seleccionados de ${candidates.length} candidatos`,
    `Antigüedad media de la muestra: ${Math.round(avgAge)} días`,
    `Dispersión relativa del precio/m²: ${(cv * 100).toFixed(1)}%`,
    `${normalizedSurfaceCount}/${selected.length} superficies requirieron normalización trazable`,
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
      surface_quality: surfaceComponent,
    },
    confidence_reasons: confidenceReasons,
    sample_count: selected.length,
    candidate_count: candidates.length,
    normalized_surface_count: normalizedSurfaceCount,
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
      normalized_surface_count: normalizedSurfaceCount,
      price_per_sqm: {
        q25: Math.round(lowM2),
        median: Math.round(medianM2),
        q75: Math.round(highM2),
      },
    },
  }
}
