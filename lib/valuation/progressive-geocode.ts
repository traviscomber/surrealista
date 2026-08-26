import { createClient } from '@supabase/supabase-js'
import { geocodeChileAddress, type ForwardGeocodeResult } from '@/lib/geocoding/forward-geocode'

type GeocodeInput = { commune?: string | null; region?: string | null; limit?: number; requireSpecificLocation?: boolean }
type GeocodeMethod = 'address_commune' | 'location_commune' | 'title_commune' | 'address_only' | 'location_only' | 'title_only' | 'kmz_hint'
type GeocodeAttempt = { query: string; method: GeocodeMethod }
type KmzHint = { name?: string | null; city?: string | null; address?: string | null; region?: string | null }

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)) }
function normalize(value: unknown) { return String(value ?? '').trim() }
function normalizedKey(value: unknown) { return normalize(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') }

function sameRegion(expected: string | null | undefined, actual: string | null | undefined) {
  if (!expected || !actual) return true
  const a = normalizedKey(expected), b = normalizedKey(actual)
  const tokens = ['los lagos','los rios','araucania','biobio','nuble','maule','ohiggins','metropolitana','valparaiso','coquimbo','atacama','antofagasta','tarapaca','arica','aysen','magallanes']
  const ta = tokens.find((token) => a.includes(token)), tb = tokens.find((token) => b.includes(token))
  return ta ? ta === tb : a === b
}

function nextRetryAt(attemptCount: number, outcome: 'no_match' | 'error') {
  const hours = outcome === 'error' ? 1 : attemptCount <= 1 ? 6 : attemptCount === 2 ? 24 : attemptCount === 3 ? 72 : 168
  return new Date(Date.now() + hours * 3600000).toISOString()
}

function titleLocation(title?: string | null) {
  const raw = normalize(title)
  if (!raw) return ''
  const cleaned = raw
    .replace(/^(terreno|sitio|parcela|agr[ií]cola|campo|lote)\s+en\s+venta\s+en\s+/i, '')
    .replace(/^en\s+/i, '')
    .trim()
  if (cleaned.length < 4) return ''
  const generic = /^(venta|terreno|sitio|parcela|agr[ií]cola|campo|propiedad)$/i
  if (generic.test(cleaned)) return ''
  return cleaned.slice(0, 180)
}

function buildAttempts(row: { address?: string | null; location?: string | null; title?: string | null; commune?: string | null; city?: string | null }, kmzHints: KmzHint[] = []) {
  const address = normalize(row.address)
  const location = normalize(row.location)
  const titleHint = titleLocation(row.title)
  const locality = normalize(row.commune) || normalize(row.city)
  const attempts: GeocodeAttempt[] = [], seen = new Set<string>()
  const add = (query: string, method: GeocodeMethod) => {
    const clean = query.replace(/\s+/g, ' ').trim().replace(/^,|,$/g, '')
    const key = normalizedKey(clean)
    if (clean.length < 3 || seen.has(key)) return
    seen.add(key); attempts.push({ query: clean, method })
  }
  if (address) add([address, locality, 'Chile'].filter(Boolean).join(', '), 'address_commune')
  if (location && normalizedKey(location) !== normalizedKey(address)) add([location, locality, 'Chile'].filter(Boolean).join(', '), 'location_commune')
  if (titleHint && ![address, location].some((v) => normalizedKey(v) === normalizedKey(titleHint))) add([titleHint, locality, 'Chile'].filter(Boolean).join(', '), 'title_commune')
  if (address) add(`${address}, Chile`, 'address_only')
  if (location && normalizedKey(location) !== normalizedKey(address)) add(`${location}, Chile`, 'location_only')
  if (titleHint) add(`${titleHint}, Chile`, 'title_only')

  const subject = address || location || titleHint
  if (subject) for (const hint of kmzHints.slice(0, 2)) {
    const anchor = normalize(hint.name) || normalize(hint.address) || normalize(hint.city)
    if (anchor) add([subject, anchor, normalize(hint.city), 'Chile'].filter(Boolean).join(', '), 'kmz_hint')
  }
  return attempts
}

function pickMatch(row: { source?: string | null; region?: string | null }, results: Array<{ result: ForwardGeocodeResult; method: GeocodeMethod }>) {
  const strict = results.find(({ result }) => result.confidence >= 0.55 && sameRegion(row.region, result.region))
  if (strict) return strict
  if (row.source === 'portal_inmobiliario') return results.find(({ result, method }) => result.confidence >= 0.65 && Boolean(result.region) && (method === 'address_commune' || method === 'address_only'))
  return undefined
}

async function findKmzHints(db: any, row: { address?: string | null; location?: string | null; title?: string | null; commune?: string | null; city?: string | null; region?: string | null }) {
  const terms = [row.location, row.address, titleLocation(row.title), row.commune, row.city].map(normalize).filter((v) => v.length >= 3)
  for (const term of terms) {
    let q = db.from('kmz_location_index').select('name,city,address,region').ilike('searchable_text', `%${term.replace(/[%_]/g, '')}%`).limit(4)
    if (row.region) q = q.ilike('region', `%${normalize(row.region).replace(/[%_]/g, '')}%`)
    const { data } = await q
    if (data?.length) return data as KmzHint[]
  }
  return [] as KmzHint[]
}

export async function progressivelyGeocodeMarket(input: GeocodeInput = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { attempted: 0, updated: 0, repairedRegions: 0, fallbackHits: 0, kmzHintHits: 0, titleHits: 0, skipped: 0, failed: 0 }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 30)
  const nowIso = new Date().toISOString()
  let query = db.from('properties_external')
    .select('id,source,title,address,location,commune,city,region,scraped_at,geocode_attempted_at,geocode_attempt_count,geocode_next_retry_at')
    .eq('is_active', true).is('lat', null)
    .or(`geocode_attempted_at.is.null,geocode_next_retry_at.lte.${nowIso}`)
    .order('geocode_attempted_at', { ascending: true, nullsFirst: true }).order('scraped_at', { ascending: false }).limit(limit * 12)
  if (input.commune) query = query.ilike('commune', `%${input.commune}%`)
  else if (input.region) query = query.ilike('region', `%${input.region}%`)
  const { data, error } = await query
  if (error) return { attempted: 0, updated: 0, repairedRegions: 0, fallbackHits: 0, kmzHintHits: 0, titleHits: 0, skipped: 0, failed: 1 }

  const candidates = (data ?? []).filter((row) => {
    const specific = normalize(row.address || row.location || titleLocation(row.title))
    const locality = normalize(row.commune || row.city)
    if (input.requireSpecificLocation && !specific) return false
    return Boolean(specific || locality)
  }).slice(0, limit)

  let updated = 0, repairedRegions = 0, fallbackHits = 0, kmzHintHits = 0, titleHits = 0, skipped = 0, failed = 0
  for (const row of candidates) {
    const commune = normalize(row.commune || row.city), region = normalize(row.region)
    const attemptCount = Number(row.geocode_attempt_count ?? 0) + 1
    await db.from('properties_external').update({ geocode_attempted_at: new Date().toISOString(), geocode_attempt_count: attemptCount, geocode_status: 'processing', geocode_last_error: null }).eq('id', row.id).is('lat', null)
    try {
      const attempts = buildAttempts(row, await findKmzHints(db, row))
      const collected: Array<{ result: ForwardGeocodeResult; method: GeocodeMethod }> = []
      let chosen: { result: ForwardGeocodeResult; method: GeocodeMethod } | undefined
      for (const attempt of attempts) {
        const matches = await geocodeChileAddress(attempt.query)
        for (const result of matches) collected.push({ result, method: attempt.method })
        chosen = pickMatch(row, collected)
        if (chosen) break
        await sleep(1050)
      }
      if (!chosen) {
        skipped++
        const bestConfidence = collected.reduce((best, item) => Math.max(best, item.result.confidence), 0)
        await db.from('properties_external').update({ geocode_status: 'no_match', geocode_confidence: bestConfidence || null, geocode_next_retry_at: nextRetryAt(attemptCount, 'no_match'), geocode_last_error: null }).eq('id', row.id).is('lat', null)
        continue
      }
      const match = chosen.result, regionMismatch = Boolean(region && match.region && !sameRegion(region, match.region))
      const patch: Record<string, unknown> = { lat: match.lat, lng: match.lng, coordinates: { lat: match.lat, lng: match.lng }, geocode_status: 'success', geocode_confidence: match.confidence, geocode_next_retry_at: null, geocode_last_error: null, updated_at: new Date().toISOString() }
      if (chosen.method !== 'address_commune') fallbackHits++
      if (chosen.method === 'kmz_hint') kmzHintHits++
      if (chosen.method === 'title_commune' || chosen.method === 'title_only') titleHits++
      if (regionMismatch && row.source === 'portal_inmobiliario' && match.confidence >= 0.65 && chosen.method.startsWith('address')) {
        patch.region = match.region
        if (!commune && match.commune) patch.commune = match.commune
      }
      const { error: updateError } = await db.from('properties_external').update(patch).eq('id', row.id).is('lat', null)
      if (updateError) {
        failed++
        await db.from('properties_external').update({ geocode_status: 'error', geocode_next_retry_at: nextRetryAt(attemptCount, 'error'), geocode_last_error: updateError.message }).eq('id', row.id).is('lat', null)
      } else { updated++; if (regionMismatch && patch.region) repairedRegions++ }
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      await db.from('properties_external').update({ geocode_status: 'error', geocode_next_retry_at: nextRetryAt(attemptCount, 'error'), geocode_last_error: message.slice(0, 500) }).eq('id', row.id).is('lat', null)
    }
    await sleep(1050)
  }
  return { attempted: candidates.length, updated, repairedRegions, fallbackHits, kmzHintHits, titleHits, skipped, failed }
}
