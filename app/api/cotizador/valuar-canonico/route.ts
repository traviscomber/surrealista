import { NextRequest, NextResponse } from 'next/server'
import { POST as valuate } from '../valuar/route'
import { getCurrentLandContext } from '@/lib/valuation/current-context'
import { getNearbyIntelligence } from '@/lib/valuation/nearby-intelligence'
import { buildInternalRecommendation } from '@/lib/valuation/internal-recommendation'
import { persistValuationSnapshot } from '@/lib/valuation/persistence'
import { progressivelyGeocodeMarket } from '@/lib/valuation/progressive-geocode'
import { refreshMarketForValuation } from '@/lib/valuation/market-refresh'

export const maxDuration = 120
export const runtime = 'nodejs'

function valuationRequest(request: NextRequest, body: any) {
  return new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(body),
  })
}

async function runValuation(request: NextRequest, body: any) {
  const response = await valuate(valuationRequest(request, body))
  const payload = await response.json().catch(() => null)
  return { response, payload }
}

function marketAgeDays(payload: any) {
  if (!payload?.last_updated) return null
  const timestamp = Date.parse(payload.last_updated)
  if (!Number.isFinite(timestamp)) return null
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
}

export async function POST(request: NextRequest) {
  const requestBody = await request.clone().json().catch(() => ({}))
  let { response, payload } = await runValuation(request, requestBody)
  if (!payload) return response

  const initialResolved = payload.resolved_context ?? requestBody.resolved_context ?? {}
  const initialAge = marketAgeDays(payload)
  const needsRefresh =
    payload.status === 'insufficient_evidence' ||
    (payload.status === 'valued' && (Number(payload.sample_count ?? 0) < 5 || initialAge === null || initialAge > 14))

  let marketRefresh: any = null
  if (needsRefresh && initialResolved.region) {
    try {
      marketRefresh = await refreshMarketForValuation({
        region: initialResolved.region,
        commune: initialResolved.city ?? null,
      })
      const rerun = await runValuation(request, {
        ...requestBody,
        resolved_context: initialResolved,
        region: initialResolved.region,
        city: initialResolved.city,
        lat: initialResolved.lat,
        lng: initialResolved.lng,
        area_sqm: initialResolved.area_sqm,
      })
      if (rerun.payload) {
        response = rerun.response
        payload = rerun.payload
      }
    } catch (error) {
      marketRefresh = { status: 'failed', error: error instanceof Error ? error.message : String(error) }
    }
  }

  if (!response.ok || payload?.status !== 'valued') {
    return NextResponse.json({ ...payload, market_refresh: marketRefresh }, { status: response.status })
  }

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
  const ageDays = marketAgeDays(payload)
  const refreshRecommended = Number(payload.sample_count ?? 0) < 5 || ageDays === null || ageDays > 14
  const internalRecommendation = buildInternalRecommendation({
    estimatedPrice: Number.isFinite(Number(payload.estimated_price)) ? Number(payload.estimated_price) : null,
    priceRange: payload.price_range ?? null,
    confidence,
    sampleCount: Number(payload.sample_count ?? 0),
    marketAgeDays: ageDays,
    marketNeighbors: nearbyIntelligence.market_neighbors ?? [],
    kmzNeighbors: nearbyIntelligence.kmz_neighbors ?? [],
    contextStatus: currentContext.status,
    contextSignals: currentContext.items,
  })

  const canonical: any = {
    ...payload,
    response_contract: 'sr-canonical-valuation-v5',
    confidence,
    confidence_label: confidence >= 75 ? 'alta' : confidence >= 55 ? 'media' : 'baja',
    market_refresh: marketRefresh,
    current_market: {
      status: currentMarketVerified ? 'verified' : 'unverified',
      last_market_observation: payload.last_updated ?? null,
      age_days: ageDays,
      sources: payload.data_sources ?? [],
      refresh_recommended: refreshRecommended,
      refresh_executed: Boolean(marketRefresh && marketRefresh.status === 'completed'),
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
      market_refresh_executed: Boolean(marketRefresh && marketRefresh.status === 'completed'),
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
