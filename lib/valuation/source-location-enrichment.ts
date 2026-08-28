import { createClient } from '@supabase/supabase-js'
import { extractPortalCoordinatesFromHTML } from '@/lib/scrapers/portal-inmobiliario-scraper'
import { ReverseGeocoder } from '@/lib/geocoding/reverse-geocode'

type SourceCandidate = {
  id: string
  source: string | null
  source_url: string | null
  region: string | null
  commune: string | null
  city: string | null
  source_location_attempted_at: string | null
}

type EnrichmentResult = {
  attempted: number
  updated: number
  noCoordinates: number
  failed: number
  repairedRegions: number
  repairedCommunes: number
}

const reverseGeocoder = new ReverseGeocoder()

function nextRetryAt(outcome: 'no_coordinates' | 'error') {
  const hours = outcome === 'error' ? 6 : 24 * 7
  return new Date(Date.now() + hours * 3600000).toISOString()
}

function cleanSourceUrl(value: string) {
  try {
    const url = new URL(value)
    url.hash = ''
    return url.toString()
  } catch {
    return value
  }
}

async function fetchPortalPoint(sourceUrl: string) {
  const cleanUrl = cleanSourceUrl(sourceUrl)
  const expectedId = cleanUrl.match(/MLC-?(\d+)/i)?.[1]
  const response = await fetch(cleanUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
      Referer: 'https://www.portalinmobiliario.com/',
    },
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`source returned HTTP ${response.status}`)
  const html = await response.text()
  return extractPortalCoordinatesFromHTML(html, expectedId)
}

async function sourcePointFor(row: SourceCandidate) {
  if (!row.source_url) return null
  if (row.source === 'portal_inmobiliario') return fetchPortalPoint(row.source_url)
  return null
}

export async function enrichMarketSourceLocations(limit = 15): Promise<EnrichmentResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { attempted: 0, updated: 0, noCoordinates: 0, failed: 1, repairedRegions: 0, repairedCommunes: 0 }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('properties_external')
    .select('id,source,source_url,region,commune,city,source_location_attempted_at')
    .eq('is_active', true)
    .eq('source', 'portal_inmobiliario')
    .is('lat', null)
    .not('source_url', 'is', null)
    .or(`source_location_attempted_at.is.null,source_location_next_retry_at.lte.${now}`)
    .order('source_location_attempted_at', { ascending: true, nullsFirst: true })
    .limit(Math.min(Math.max(limit, 1), 30))

  if (error) return { attempted: 0, updated: 0, noCoordinates: 0, failed: 1, repairedRegions: 0, repairedCommunes: 0 }

  const candidates = (data ?? []) as SourceCandidate[]
  let updated = 0
  let noCoordinates = 0
  let failed = 0
  let repairedRegions = 0
  let repairedCommunes = 0

  for (const row of candidates) {
    const attemptedAt = new Date().toISOString()
    await db.from('properties_external').update({
      source_location_status: 'processing',
      source_location_attempted_at: attemptedAt,
      source_location_last_error: null,
    }).eq('id', row.id).is('lat', null)

    try {
      const point = await sourcePointFor(row)
      if (!point) {
        noCoordinates++
        await db.from('properties_external').update({
          source_location_status: 'no_coordinates',
          source_location_next_retry_at: nextRetryAt('no_coordinates'),
          source_location_last_error: null,
        }).eq('id', row.id).is('lat', null)
        continue
      }

      const details = await reverseGeocoder.getLocationDetails(point.lat, point.lng)
      const patch: Record<string, unknown> = {
        lat: point.lat,
        lng: point.lng,
        coordinates: point,
        geocode_status: 'success',
        geocode_confidence: 1,
        geocode_precision: 'point',
        geocode_next_retry_at: null,
        geocode_last_error: null,
        source_location_status: 'success',
        source_location_next_retry_at: null,
        source_location_last_error: null,
        updated_at: new Date().toISOString(),
      }

      if (details.region && details.region !== row.region) {
        patch.region = details.region
        repairedRegions++
      }
      const resolvedCommune = details.comuna || details.city || details.town || details.village
      if (resolvedCommune && !row.commune) {
        patch.commune = resolvedCommune
        repairedCommunes++
      }
      if (!row.city && (details.city || details.town)) patch.city = details.city || details.town

      const { error: updateError } = await db
        .from('properties_external')
        .update(patch)
        .eq('id', row.id)
        .is('lat', null)

      if (updateError) throw updateError
      updated++
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      await db.from('properties_external').update({
        source_location_status: 'error',
        source_location_next_retry_at: nextRetryAt('error'),
        source_location_last_error: message.slice(0, 500),
      }).eq('id', row.id).is('lat', null)
    }
  }

  return {
    attempted: candidates.length,
    updated,
    noCoordinates,
    failed,
    repairedRegions,
    repairedCommunes,
  }
}
