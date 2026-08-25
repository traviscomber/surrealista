import { NextRequest, NextResponse } from 'next/server'
import { POST as valuate } from '../valuar/route'
import { getCurrentLandContext } from '@/lib/valuation/current-context'
import { getNearbyIntelligence } from '@/lib/valuation/nearby-intelligence'
import { buildInternalRecommendation } from '@/lib/valuation/internal-recommendation'

export const maxDuration = 30
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const response = await valuate(request)
  let payload: any

  try {
    payload = await response.json()
  } catch {
    return response
  }

  if (!response.ok || payload?.status !== 'valued') {
    return NextResponse.json(payload, { status: response.status })
  }

  const resolved = payload.resolved_context ?? {}
  const [currentContext, nearbyIntelligence] = await Promise.all([
    getCurrentLandContext({
      commune: resolved.city ?? null,
      region: resolved.region ?? '',
    }),
    getNearbyIntelligence({
      lat: Number.isFinite(Number(resolved.lat)) ? Number(resolved.lat) : null,
      lng: Number.isFinite(Number(resolved.lng)) ? Number(resolved.lng) : null,
      commune: resolved.city ?? null,
      region: resolved.region ?? null,
      area_m2: Number.isFinite(Number(resolved.area_sqm)) ? Number(resolved.area_sqm) : null,
    }),
  ])

  const rawConfidence = Number(payload.confidence ?? 0)
  const confidence = Math.max(0, Math.min(100, rawConfidence + currentContext.confidence_adjustment))
  const currentMarketVerified = Boolean(payload.last_updated)
  const marketAgeDays = payload.last_updated
    ? Math.max(0, Math.floor((Date.now() - Date.parse(payload.last_updated)) / 86_400_000))
    : null

  const internalRecommendation = buildInternalRecommendation({
    estimatedPrice: Number.isFinite(Number(payload.estimated_price)) ? Number(payload.estimated_price) : null,
    priceRange: payload.price_range ?? null,
    confidence,
    sampleCount: Number(payload.sample_count ?? 0),
    marketAgeDays,
    marketNeighbors: nearbyIntelligence.market_neighbors ?? [],
    kmzNeighbors: nearbyIntelligence.kmz_neighbors ?? [],
    contextStatus: currentContext.status,
    contextSignals: currentContext.items,
  })

  const canonical = {
    ...payload,
    response_contract: 'sr-canonical-valuation-v3',
    confidence,
    confidence_label: confidence >= 75 ? 'alta' : confidence >= 55 ? 'media' : 'baja',
    current_market: {
      status: currentMarketVerified ? 'verified' : 'unverified',
      last_market_observation: payload.last_updated ?? null,
      age_days: marketAgeDays,
      sources: payload.data_sources ?? [],
      refresh_recommended: Number(payload.sample_count ?? 0) < 5 || marketAgeDays === null || marketAgeDays > 14,
      summary: currentMarketVerified
        ? `Mercado contrastado con ${payload.sample_count ?? 0} comparables y ${payload.data_sources?.length ?? 0} fuentes.`
        : 'Mercado actual no verificado.',
    },
    nearby_intelligence: nearbyIntelligence,
    current_context: currentContext,
    recommendation_sr: internalRecommendation,
    canonical_summary: {
      estimated_price: payload.estimated_price,
      price_range: payload.price_range,
      market: currentMarketVerified ? 'verified' : 'unverified',
      market_refresh_recommended: Number(payload.sample_count ?? 0) < 5 || marketAgeDays === null || marketAgeDays > 14,
      nearby_market_neighbors: nearbyIntelligence.market_neighbors?.length ?? 0,
      nearby_kmz_neighbors: nearbyIntelligence.kmz_neighbors?.length ?? 0,
      news: currentContext.status,
      confidence,
      sr_verdict: internalRecommendation.verdict,
      caveat: currentContext.status === 'verified'
        ? 'Las noticias y capas territoriales se muestran como evidencia y no alteran silenciosamente el precio calculado.'
        : 'Contexto actual no verificado; se reduce la confianza y no se aplica ajuste de precio por noticias.',
    },
  }

  return NextResponse.json(canonical, { status: response.status })
}
