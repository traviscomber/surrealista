import { createClient } from '@supabase/supabase-js'
import { geocodeChileAddress } from '@/lib/geocoding/forward-geocode'

type GeocodeInput = {
  commune?: string | null
  region?: string | null
  limit?: number
  requireSpecificLocation?: boolean
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalize(value: unknown) {
  return String(value ?? '').trim()
}

function sameRegion(expected: string | null | undefined, actual: string | null | undefined) {
  if (!expected || !actual) return true
  const a = normalize(expected).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const b = normalize(actual).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const tokens = ['los lagos','los rios','araucania','biobio','nuble','maule','ohiggins','metropolitana','valparaiso','coquimbo','atacama','antofagasta','tarapaca','arica','aysen','magallanes']
  const ta = tokens.find((token) => a.includes(token))
  const tb = tokens.find((token) => b.includes(token))
  return ta ? ta === tb : a === b
}

export async function progressivelyGeocodeMarket(input: GeocodeInput = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { attempted: 0, updated: 0, repairedRegions: 0, skipped: 0, failed: 0 }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const limit = Math.min(Math.max(input.limit ?? 3, 1), 15)
  const requireSpecificLocation = input.requireSpecificLocation ?? false

  let query = db
    .from('properties_external')
    .select('id,source,address,location,commune,city,region,scraped_at')
    .eq('is_active', true)
    .is('lat', null)
    .order('scraped_at', { ascending: false })
    .limit(limit * 4)

  if (input.commune) query = query.ilike('commune', `%${input.commune}%`)
  else if (input.region) query = query.ilike('region', `%${input.region}%`)

  const { data, error } = await query
  if (error) {
    console.error('[Geocoding] No se pudieron cargar candidatos:', error.message)
    return { attempted: 0, updated: 0, repairedRegions: 0, skipped: 0, failed: 1 }
  }

  const candidates = (data ?? [])
    .filter((row) => {
      const specific = normalize(row.address || row.location)
      const commune = normalize(row.commune || row.city)
      if (requireSpecificLocation && !specific) return false
      return Boolean(specific || commune)
    })
    .slice(0, limit)

  let updated = 0
  let repairedRegions = 0
  let skipped = 0
  let failed = 0

  for (const row of candidates) {
    const specific = normalize(row.address || row.location)
    const commune = normalize(row.commune || row.city)
    const region = normalize(row.region)
    const search = [specific, commune, 'Chile'].filter(Boolean).join(', ')

    try {
      const matches = await geocodeChileAddress(search)
      const strictMatch = matches.find((item) => item.confidence >= 0.55 && sameRegion(region, item.region))
      const repairablePortalMatch = row.source === 'portal_inmobiliario'
        ? matches.find((item) => item.confidence >= 0.65 && Boolean(item.region) && Boolean(specific))
        : undefined
      const match = strictMatch ?? repairablePortalMatch

      if (!match) {
        skipped += 1
      } else {
        const regionMismatch = Boolean(region && match.region && !sameRegion(region, match.region))
        const patch: Record<string, unknown> = {
          lat: match.lat,
          lng: match.lng,
          coordinates: { lat: match.lat, lng: match.lng },
          updated_at: new Date().toISOString(),
        }

        // Portal Inmobiliario's HTML fallback occasionally tags a listing with the
        // queried region instead of the actual address region. Only repair this
        // canonical field when geocoding is high-confidence and address-specific.
        if (regionMismatch && row.source === 'portal_inmobiliario' && match.confidence >= 0.65) {
          patch.region = match.region
          if (!commune && match.commune) patch.commune = match.commune
        }

        const { error: updateError } = await db
          .from('properties_external')
          .update(patch)
          .eq('id', row.id)
          .is('lat', null)

        if (updateError) failed += 1
        else {
          updated += 1
          if (regionMismatch && patch.region) repairedRegions += 1
        }
      }
    } catch (err) {
      failed += 1
      console.error('[Geocoding] Falló candidato', row.id, err)
    }

    // Nominatim public usage policy: keep requests serialized and conservative.
    await sleep(1100)
  }

  return { attempted: candidates.length, updated, repairedRegions, skipped, failed }
}
