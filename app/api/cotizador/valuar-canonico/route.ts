import { NextRequest, NextResponse } from 'next/server'
import { POST as valuate } from '../valuar/route'
import { getCurrentLandContext } from '@/lib/valuation/current-context'

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
  const currentContext = await getCurrentLandContext({
    commune: resolved.city ?? null,
    region: resolved.region ?? '',
  })

  const rawConfidence = Number(payload.confidence ?? 0)
  const confidence = Math.max(0, Math.min(100, rawConfidence + currentContext.confidence_adjustment))
  const currentMarketVerified = Boolean(payload.last_updated)
  const marketAgeDays = payload.last_updated
    ? Math.max(0, Math.floor((Date.now() - Date.parse(payload.last_updated)) / 86_400_000))
    : null

  const canonical = {
    ...payload,
    response_contract: 'sr-canonical-valuation-v1',
    confidence,
    confidence_label: confidence >= 75 ? 'alta' : confidence >= 55 ? 'media' : 'baja',
    current_market: {
      status: currentMarketVerified ? 'verified' : 'unverified',
      last_market_observation: payload.last_updated ?? null,
      age_days: marketAgeDays,
      sources: payload.data_sources ?? [],
      summary: currentMarketVerified
        ? `Mercado contrastado con ${payload.sample_count ?? 0} comparables y ${payload.data_sources?.length ?? 0} fuentes.`
        : 'Mercado actual no verificado.',
    },
    current_context: currentContext,
    canonical_summary: {
      estimated_price: payload.estimated_price,
      price_range: payload.price_range,
      market: currentMarketVerified ? 'verified' : 'unverified',
      news: currentContext.status,
      confidence,
      caveat: currentContext.status === 'verified'
        ? 'Las noticias/contexto se muestran como evidencia y no alteran silenciosamente el precio calculado.'
        : 'Contexto actual no verificado; se reduce la confianza y no se aplica ajuste de precio por noticias.',
    },
  }

  return NextResponse.json(canonical, { status: response.status })
}
