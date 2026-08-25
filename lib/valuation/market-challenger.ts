export const MARKET_CHALLENGER_VERSION = 'sr-market-challenger-v5'

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
  lat?: number | null
  lng?: number | null
}

type GeographicTier = 'same_commune' | 'radius_15km' | 'radius_50km' | 'region'
type AreaNormalization = 'none' | 'title_m2' | 'title_ha' | 'source_thousand_m2'
type AreaConfidence = 'high' | 'medium'

export type RankedComparable = MarketComparableInput & {
  effective_area_m2: number
  effective_price_per_m2_clp: number
  area_normalization: AreaNormalization
  area_confidence: AreaConfidence
  data_quality_score: number
  data_quality_reasons: string[]
  property_type_fit_score: number
  property_type_fit_reason: string
  geographic_tier: GeographicTier
  distance_km: number | null
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
    evidence_quality: number
  }
  confidence_reasons: string[]
  sample_count: number
  candidate_count: number
  normalized_surface_count: number
  average_data_quality: number
  geographic_mix: Record<GeographicTier, number>
  dispersion_cv: number
  comparables: RankedComparable[]
  snapshot: {
    algorithm_version: string
    generated_at: string
    subject: {
      area_m2: number
      region: string
      commune: string | null
      property_type: string
      lat: number | null
      lng: number | null
    }
    selected_count: number
    excluded_count: number
    normalized_surface_count: number
    average_data_quality: number
    geographic_mix: Record<GeographicTier, number>
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
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value
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

function propertyTypeEvidence(item: MarketComparableInput, propertyType: string) {
  const type = normalizeText(propertyType)
  const title = normalizeText(item.title)
  if (!title) return { conflict: false, score: 75, reason: 'titulo_no_especifica_subtipo' }

  const landFamilyTarget = ['terreno', 'parcela', 'campo', 'agrícola', 'agricola', 'terreno rural', 'campo agrícola', 'campo forestal'].includes(type)
  if (!landFamilyTarget) return { conflict: false, score: 80, reason: 'tipo_sin_taxonomia_sr' }

  const hasLandSignal = /\b(terreno|parcela|parcelaci[oó]n|sitio|lote|loteo|campo|fundo|predio|hect[aá]rea|agr[ií]cola|forestal)\b/i.test(title)
  const hasBuiltAsset = /\b(casa|caba(?:n|ñ)a|caba(?:n|ñ)as|complejo tur[ií]stico|hotel|hostal|bodega|galp[oó]n|vivienda|departamento|oficina|local comercial)\b/i.test(title)
  const clearlyNonLand = /\b(departamento|oficina|local comercial|casa urbana)\b/i.test(title)

  if (clearlyNonLand && !hasLandSignal) {
    return { conflict: true, score: 0, reason: 'activo_principal_no_es_suelo' }
  }

  if (hasLandSignal && hasBuiltAsset) {
    return { conflict: false, score: 68, reason: 'suelo_con_mejoras_construidas' }
  }

  if (hasLandSignal) {
    if (type === 'campo' && /\b(campo|fundo|predio|hect[aá]rea|agr[ií]cola|forestal)\b/i.test(title)) {
      return { conflict: false, score: 100, reason: 'misma_familia_campo' }
    }
    if (type === 'parcela' && /\b(parcela|parcelaci[oó]n|lote|loteo)\b/i.test(title)) {
      return { conflict: false, score: 100, reason: 'misma_familia_parcela' }
    }
    if (type === 'terreno' && /\b(terreno|sitio|lote|parcela|campo|fundo|predio)\b/i.test(title)) {
      return { conflict: false, score: 92, reason: 'familia_suelo_compatible' }
    }
    return { conflict: false, score: 82, reason: 'familia_suelo_compatible' }
  }

  if (hasBuiltAsset) {
    return { conflict: true, score: 0, reason: 'construccion_sin_evidencia_de_suelo' }
  }

  return { conflict: false, score: 72, reason: 'titulo_ambiguo_sin_conflicto' }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => value * Math.PI / 180
  const earthKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function geographicEvidence(
  item: MarketComparableInput,
  subjectCommune: string | null,
  subjectLat: number | null,
  subjectLng: number | null,
) {
  const subjectCity = normalizeText(subjectCommune)
  const itemCity = normalizeText(item.commune)
  if (subjectCity && itemCity && (itemCity.includes(subjectCity) || subjectCity.includes(itemCity))) {
    return { tier: 'same_commune' as const, score: 100, distance_km: null }
  }

  if (
    subjectLat !== null && subjectLng !== null &&
    Number.isFinite(item.lat) && Number.isFinite(item.lng)
  ) {
    const distance = haversineKm(subjectLat, subjectLng, Number(item.lat), Number(item.lng))
    if (distance <= 15) return { tier: 'radius_15km' as const, score: 90, distance_km: Number(distance.toFixed(1)) }
    if (distance <= 50) return { tier: 'radius_50km' as const, score: 70, distance_km: Number(distance.toFixed(1)) }
  }

  return { tier: 'region' as const, score: 45, distance_km: null }
}

function qualityEvidence(item: RankedComparable) {
  const reasons: string[] = []
  let score = 0

  if (item.area_confidence === 'high') {
    score += 25
    reasons.push('superficie_confiable')
  } else {
    score += 16
    reasons.push('superficie_inferida')
  }

  if (item.price_clp > 0 && item.effective_price_per_m2_clp > 0) {
    score += 20
    reasons.push('precio_recalculable')
  }
  if (item.source_url) {
    score += 15
    reasons.push('fuente_trazable')
  }

  const age = ageDays(item.scraped_at)
  if (age <= 30) score += 20
  else if (age <= 90) score += 17
  else if (age <= 180) score += 12
  else if (age <= 365) score += 7
  else score += 2
  reasons.push(age <= 90 ? 'evidencia_reciente' : 'evidencia_antigua')

  if (item.commune) {
    score += 10
    reasons.push('comuna_identificada')
  }
  if (item.source) {
    score += 10
    reasons.push('origen_identificado')
  }

  return { score: clamp(score, 0, 100), reasons }
}

function comparableSimilarity(item: RankedComparable, subjectArea: number) {
  const area = areaSimilarity(subjectArea, item.effective_area_m2)
  const recency = recencyScore(item.scraped_at)
  const location = item.geographic_tier === 'same_commune' ? 100
    : item.geographic_tier === 'radius_15km' ? 90
      : item.geographic_tier === 'radius_50km' ? 70
        : 45
  return Math.round(area * 0.35 + location * 0.25 + recency * 0.1 + item.data_quality_score * 0.2 + item.property_type_fit_score * 0.1)
}

function emptyGeographicMix(): Record<GeographicTier, number> {
  return { same_commune: 0, radius_15km: 0, radius_50km: 0, region: 0 }
}

export function buildMarketChallenger(input: {
  comparables: MarketComparableInput[]
  area_m2: number
  region: string
  commune?: string | null
  property_type: string
  lat?: number | null
  lng?: number | null
}): ChallengerResult | null {
  const subjectLat = Number.isFinite(input.lat) ? Number(input.lat) : null
  const subjectLng = Number.isFinite(input.lng) ? Number(input.lng) : null

  const candidates = input.comparables
    .filter((item) => Number.isFinite(item.price_clp) && item.price_clp > 0 && Number.isFinite(item.area_m2) && item.area_m2 > 0)
    .map((item) => {
      const normalized = normalizeComparableSurface(item, input.property_type)
      const geographic = geographicEvidence(item, input.commune ?? null, subjectLat, subjectLng)
      const typeEvidence = propertyTypeEvidence(item, input.property_type)
      const ranked: RankedComparable = {
        ...item,
        ...normalized,
        effective_price_per_m2_clp: item.price_clp / normalized.effective_area_m2,
        data_quality_score: 0,
        data_quality_reasons: [],
        property_type_fit_score: typeEvidence.score,
        property_type_fit_reason: typeEvidence.reason,
        geographic_tier: geographic.tier,
        distance_km: geographic.distance_km,
        similarity_score: 0,
        included: true,
        exclusion_reason: typeEvidence.conflict ? 'property_type_conflict' : null,
      }
      const quality = qualityEvidence(ranked)
      ranked.data_quality_score = quality.score
      ranked.data_quality_reasons = quality.reasons
      ranked.similarity_score = comparableSimilarity(ranked, input.area_m2)
      return ranked
    })
    .filter((item) => Number.isFinite(item.effective_price_per_m2_clp) && item.effective_price_per_m2_clp > 0)
    .sort((a, b) => b.similarity_score - a.similarity_score)

  if (candidates.length < 3) return null

  const typeEligible = candidates.filter((item) => item.exclusion_reason !== 'property_type_conflict')
  const qualityEligible = typeEligible.filter((item) => item.data_quality_score >= 45)
  const basePool = qualityEligible.length >= 3 ? qualityEligible : typeEligible.length >= 3 ? typeEligible : candidates
  const prices = basePool.map((item) => item.effective_price_per_m2_clp)
  const q1 = quantile(prices, 0.25)
  const q3 = quantile(prices, 0.75)
  const iqr = Math.max(0, q3 - q1)
  const lowerFence = Math.max(0, q1 - 1.5 * iqr)
  const upperFence = q3 + 1.5 * iqr

  const ranked = candidates.map((item) => {
    if (item.exclusion_reason === 'property_type_conflict' && typeEligible.length >= 3) return item
    if (item.data_quality_score < 45 && qualityEligible.length >= 3) {
      return { ...item, included: false, exclusion_reason: 'low_data_quality' }
    }
    const areaRatio = Math.min(input.area_m2, item.effective_area_m2) / Math.max(input.area_m2, item.effective_area_m2)
    if (areaRatio < 0.2) return { ...item, included: false, exclusion_reason: 'surface_mismatch' }
    const isOutlier = iqr > 0 && (item.effective_price_per_m2_clp < lowerFence || item.effective_price_per_m2_clp > upperFence)
    return isOutlier ? { ...item, included: false, exclusion_reason: 'price_outlier_iqr' } : { ...item, included: true, exclusion_reason: null }
  })

  const usable = ranked.filter((item) => item.included)
  if (usable.length < 3) return null

  const sameCommune = usable.filter((item) => item.geographic_tier === 'same_commune')
  const radius15 = usable.filter((item) => item.geographic_tier === 'radius_15km')
  const radius50 = usable.filter((item) => item.geographic_tier === 'radius_50km')
  const regional = usable.filter((item) => item.geographic_tier === 'region')
  const orderedTiers = [...sameCommune, ...radius15, ...radius50, ...regional]
  const selected = orderedTiers.slice(0, 20)

  const selectedKeys = new Set(selected.map((item) => `${item.source}|${item.source_url ?? ''}|${item.price_clp}|${item.effective_area_m2}`))
  const finalComparables = ranked.map((item) => {
    const key = `${item.source}|${item.source_url ?? ''}|${item.price_clp}|${item.effective_area_m2}`
    if (selectedKeys.has(key)) return { ...item, included: true, exclusion_reason: null }
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
  const normalizedSurfaceCount = selected.filter((item) => item.area_normalization !== 'none').length
  const mediumSurfaceCount = selected.filter((item) => item.area_confidence === 'medium').length
  const averageDataQuality = Math.round(selected.reduce((sum, item) => sum + item.data_quality_score, 0) / selected.length)
  const geographicMix = emptyGeographicMix()
  selected.forEach((item) => { geographicMix[item.geographic_tier] += 1 })

  const sampleComponent = clamp(Math.round((selected.length / 15) * 25), 6, 25)
  const recencyComponent = avgAge <= 45 ? 15 : avgAge <= 90 ? 13 : avgAge <= 180 ? 9 : avgAge <= 365 ? 5 : 2
  const dispersionComponent = cv <= 0.2 ? 20 : cv <= 0.35 ? 17 : cv <= 0.5 ? 12 : cv <= 0.75 ? 7 : 3
  const localShare = (geographicMix.same_commune + geographicMix.radius_15km + geographicMix.radius_50km * 0.6) / selected.length
  const geographicComponent = clamp(Math.round(localShare * 15), 3, 15)
  const surfaceComponent = clamp(Math.round(10 - (mediumSurfaceCount / selected.length) * 5), 5, 10)
  const evidenceQualityComponent = clamp(Math.round((averageDataQuality / 100) * 15), 5, 15)
  const confidence = clamp(sampleComponent + recencyComponent + dispersionComponent + geographicComponent + surfaceComponent + evidenceQualityComponent, 0, 100)

  const confidenceReasons = [
    `${selected.length} comparables seleccionados de ${candidates.length} candidatos`,
    `Calidad media de evidencia: ${averageDataQuality}/100`,
    `Antigüedad media de la muestra: ${Math.round(avgAge)} días`,
    `Dispersión relativa del precio/m²: ${(cv * 100).toFixed(1)}%`,
    `${normalizedSurfaceCount}/${selected.length} superficies requirieron normalización trazable`,
    `Cobertura territorial: ${geographicMix.same_commune} misma comuna, ${geographicMix.radius_15km} a ≤15 km, ${geographicMix.radius_50km} a ≤50 km, ${geographicMix.region} regionales`,
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
      evidence_quality: evidenceQualityComponent,
    },
    confidence_reasons: confidenceReasons,
    sample_count: selected.length,
    candidate_count: candidates.length,
    normalized_surface_count: normalizedSurfaceCount,
    average_data_quality: averageDataQuality,
    geographic_mix: geographicMix,
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
        lat: subjectLat,
        lng: subjectLng,
      },
      selected_count: selected.length,
      excluded_count: finalComparables.filter((item) => !item.included).length,
      normalized_surface_count: normalizedSurfaceCount,
      average_data_quality: averageDataQuality,
      geographic_mix: geographicMix,
      price_per_sqm: {
        q25: Math.round(lowM2),
        median: Math.round(medianM2),
        q75: Math.round(highM2),
      },
    },
  }
}
