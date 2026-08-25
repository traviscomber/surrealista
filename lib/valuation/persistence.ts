import { createClient } from '@supabase/supabase-js'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function persistValuationSnapshot(payload: any, queryText?: string | null, watchlistId?: string | null) {
  const db = admin()
  if (!db || payload?.status !== 'valued') return null
  const resolved = payload.resolved_context ?? {}
  const row = {
    watchlist_id: watchlistId ?? null,
    query_text: queryText ?? resolved.address ?? null,
    resolved_address: resolved.display_name ?? resolved.address ?? null,
    commune: resolved.city ?? null,
    region: resolved.region ?? null,
    lat: resolved.lat ?? null,
    lng: resolved.lng ?? null,
    area_m2: resolved.area_sqm ?? null,
    estimated_price: payload.estimated_price ?? null,
    range_min: payload.price_range?.min ?? payload.price_range?.low ?? null,
    range_max: payload.price_range?.max ?? payload.price_range?.high ?? null,
    confidence: payload.confidence ?? null,
    sample_count: payload.sample_count ?? 0,
    model_used: payload.model_source ?? payload.model_used ?? null,
    response_contract: payload.response_contract ?? null,
    recommendation_verdict: payload.recommendation_sr?.verdict ?? null,
    market_refresh_recommended: Boolean(payload.current_market?.refresh_recommended),
    snapshot: payload,
  }
  const { data, error } = await db.from('valuation_history').insert(row).select('id,created_at').single()
  if (error) { console.error('[Valuation history]', error.message); return null }
  if (watchlistId) {
    await db.from('valuation_watchlist').update({
      last_price: payload.estimated_price ?? null,
      last_confidence: payload.confidence ?? null,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', watchlistId)
  }
  return data
}

export async function createWatchlistItem(payload: any) {
  const db = admin()
  if (!db) throw new Error('Servicio de datos no configurado')
  const resolved = payload.resolved_context ?? {}
  const label = String(payload.label || resolved.display_name || resolved.address || 'Terreno').slice(0, 180)
  const { data, error } = await db.from('valuation_watchlist').insert({
    label,
    address: resolved.address || resolved.display_name || payload.address,
    commune: resolved.city ?? null,
    region: resolved.region ?? null,
    lat: resolved.lat ?? null,
    lng: resolved.lng ?? null,
    area_m2: resolved.area_sqm ?? null,
    baseline_price: payload.estimated_price ?? null,
    last_price: payload.estimated_price ?? null,
    last_confidence: payload.confidence ?? null,
    last_checked_at: new Date().toISOString(),
  }).select('*').single()
  if (error) throw error
  return data
}

export async function listValuationHistory(limit = 20) {
  const db = admin(); if (!db) return []
  const { data } = await db.from('valuation_history').select('id,resolved_address,commune,region,area_m2,estimated_price,confidence,recommendation_verdict,created_at').order('created_at',{ascending:false}).limit(limit)
  return data ?? []
}

export async function listWatchlist() {
  const db = admin(); if (!db) return []
  const { data } = await db.from('valuation_watchlist').select('*').eq('active',true).order('updated_at',{ascending:false}).limit(50)
  return data ?? []
}
