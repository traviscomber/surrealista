import { NextRequest, NextResponse } from 'next/server'
import { POST as valuate } from '../valuar/route'
import { getCurrentLandContext } from '@/lib/valuation/current-context'
import { getNearbyIntelligence } from '@/lib/valuation/nearby-intelligence'
import { buildInternalRecommendation } from '@/lib/valuation/internal-recommendation'
import { persistValuationSnapshot } from '@/lib/valuation/persistence'
import { progressivelyGeocodeMarket } from '@/lib/valuation/progressive-geocode'

export const maxDuration = 30
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const requestBody = await request.clone().json().catch(() => ({}))
  const response = await valuate(request)
  let payload: any
  try { payload = await response.json() } catch { return response }
  if (!response.ok || payload?.status !== 'valued') return NextResponse.json(payload, { status: response.status })

  const resolved = payload.resolved_context ?? {}
  const [currentContext, nearbyIntelligence, geocoding] = await Promise.all([
    getCurrentLandContext({ commune: resolved.city ?? null, region: resolved.region ?? '' }),
    getNearbyIntelligence({
      lat: Number.isFinite(Number(resolved.lat)) ? Number(resolved.lat) : null,
      lng: Number.isFinite(Number(resolved.lng)) ? Number(resolved.lng) : null,
      commune: resolved.city ?? null,
      region: resolved.region ?? null,
      area_m2: Number.isFinite(Number(resolved.area_sqm)) ? Number(resolved.area_sqm) : null,
    }),
    progressivelyGeocodeMarket({ commune: resolved.city ?? null, region: resolved.region ?? null, limit: 3 }),
  ])

  const rawConfidence = Number(payload.confidence ?? 0)
  const confidence = Math.max(0, Math.min(100, rawConfidence + currentContext.confidence_adjustment))
  const currentMarketVerified = Boolean(payload.last_updated)
  const marketAgeDays = payload.last_updated ? Math.max(0, Math.floor((Date.now() - Date.parse(payload.last_updated)) / 86_400_000)) : null
  const refreshRecommended = Number(payload.sample_count ?? 0) < 5 || marketAgeDays === null || marketAgeDays > 14
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

  const canonical: any = {
    ...payload,
    response_contract: 'sr-canonical-valuation-v4',
    confidence,
    confidence_label: confidence >= 75 ? 'alta' : confidence >= 55 ? 'media' : 'baja',
    current_market: {
      status: currentMarketVerified ? 'verified' : 'unverified',
      last_market_observation: payload.last_updated ?? null,
      age_days: marketAgeDays,
      sources: payload.data_sources ?? [],
      refresh_recommended: refreshRecommended,
      summary: currentMarketVerified ? `Mercado contrastado con ${payload.sample_count ?? 0} comparables y ${payload.data_sources?.length ?? 0} fuentes.` : 'Mercado actual no verificado.',
    },
    progressive_geocoding: geocoding,
    nearby_intelligence: nearbyIntelligence,
    current_context: currentContext,
    recommendation_sr: internalRecommendation,
    canonical_summary: {
      estimated_price: payload.estimated_price,
      price_range: payload.price_range,
      market: currentMarketVerified ? 'verified' : 'unverified',
      market_refresh_recommended: refreshRecommended,
      nearby_market_neighbors: nearbyIntelligence.market_neighbors?.length ?? 0,
      nearby_kmz_neighbors: nearbyIntelligence.kmz_neighbors?.length ?? 0,
      news: currentContext.status,
      confidence,
      sr_verdict: internalRecommendation.verdict,
      caveat: currentContext.status === 'verified' ? 'Noticias y capas territoriales se muestran como evidencia y no alteran silenciosamente el precio.' : 'Contexto actual no verificado; se reduce la confianza.',
    },
  }
  const history = await persistValuationSnapshot(canonical, requestBody.address ?? resolved.address ?? null, requestBody.watchlist_id ?? null)
  canonical.history = history
  return NextResponse.json(canonical, { status: response.status })
}
