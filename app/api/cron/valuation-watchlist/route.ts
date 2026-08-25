import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POST as canonicalValuation } from '@/app/api/cotizador/valuar-canonico/route'

export const runtime = 'nodejs'
export const maxDuration = 300

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase configuration')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function accessCookie() {
  const password = process.env.APP_PASSWORD?.trim()
  if (!password) throw new Error('APP_PASSWORD is not configured')
  const token = createHash('sha256').update(`sur-realista:${password}`).digest('hex')
  return `sur_realista_access=${token}`
}

async function evaluate(req: NextRequest, item: any) {
  const valuationReq = new NextRequest(req.nextUrl.origin + '/api/cotizador/valuar-canonico', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: accessCookie() },
    body: JSON.stringify({
      address: item.address,
      region: item.region,
      city: item.commune,
      lat: item.lat,
      lng: item.lng,
      area_sqm: item.area_m2,
      watchlist_id: item.id,
    }),
  })
  const response = await canonicalValuation(valuationReq)
  const payload = await response.json().catch(() => null)
  return { ok: response.ok, payload }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = admin()
  const { data: items, error } = await db.from('valuation_watchlist').select('*').eq('active', true).order('last_checked_at', { ascending: true, nullsFirst: true }).limit(5)
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const results: any[] = []
  for (const item of items ?? []) {
    const previousPrice = Number(item.last_price ?? item.baseline_price ?? 0)
    const previousConfidence = Number(item.last_confidence ?? 0)
    try {
      const valuation = await evaluate(req, item)
      const payload = valuation.payload
      if (!valuation.ok || payload?.status !== 'valued') {
        results.push({ id: item.id, status: 'valuation_failed', error: payload?.error ?? 'No valuation' })
        continue
      }

      const currentPrice = Number(payload.estimated_price ?? 0)
      const currentConfidence = Number(payload.confidence ?? 0)
      const priceDelta = previousPrice > 0 ? (currentPrice - previousPrice) / previousPrice : 0
      const confidenceDelta = currentConfidence - previousConfidence
      const alerts: any[] = []

      if (previousPrice > 0 && Math.abs(priceDelta) >= 0.08) {
        alerts.push({
          watchlist_id: item.id,
          alert_type: priceDelta > 0 ? 'price_up' : 'price_down',
          severity: Math.abs(priceDelta) >= 0.15 ? 'high' : 'medium',
          title: `El valor estimado ${priceDelta > 0 ? 'subió' : 'bajó'} ${Math.round(Math.abs(priceDelta) * 100)}%`,
          detail: `Nuevo valor ${currentPrice.toLocaleString('es-CL')} CLP.`,
          previous_value: previousPrice,
          current_value: currentPrice,
          metadata: { confidence: currentConfidence, sample_count: payload.sample_count ?? 0 },
        })
      }
      if (Math.abs(confidenceDelta) >= 10) {
        alerts.push({
          watchlist_id: item.id,
          alert_type: confidenceDelta > 0 ? 'confidence_up' : 'confidence_down',
          severity: confidenceDelta < 0 ? 'medium' : 'info',
          title: `La confianza ${confidenceDelta > 0 ? 'mejoró' : 'bajó'} ${Math.abs(Math.round(confidenceDelta))} puntos`,
          detail: `Confianza actual ${Math.round(currentConfidence)}%.`,
          previous_value: previousConfidence,
          current_value: currentConfidence,
          metadata: { sample_count: payload.sample_count ?? 0 },
        })
      }
      if (payload.market_refresh?.inserted > 0) {
        alerts.push({
          watchlist_id: item.id,
          alert_type: 'new_market_evidence',
          severity: 'info',
          title: 'Apareció nueva evidencia de mercado',
          detail: `${payload.market_refresh.inserted} avisos nuevos incorporados durante la revisión.`,
          current_value: payload.market_refresh.inserted,
          metadata: payload.market_refresh,
        })
      }
      if (alerts.length) await db.from('valuation_watchlist_alerts').insert(alerts)
      results.push({ id: item.id, status: 'checked', alerts: alerts.length, price: currentPrice, confidence: currentConfidence })
    } catch (err) {
      results.push({ id: item.id, status: 'error', error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ success: true, checked: results.length, results })
}
