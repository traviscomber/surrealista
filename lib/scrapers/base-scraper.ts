/**
 * Base scraper: shared types, UF conversion, normalisation helpers,
 * and Supabase upsert for all property sources.
 */
import { createClient } from '@supabase/supabase-js'

export type ScraperSource =
  | 'portal_inmobiliario'
  | 'yapo'
  | 'toctoc'
  | 'icasas'
  | 'ichiloe'
  | 'surealista'
  | 'camposchile'
  | 'terrachiloe'
  | 'portalterreno'
  | 'rura'
  | 'goplaceit'
  | 'other'

export type PropertyOperation = 'venta' | 'arriendo' | 'otro'

export interface RawProperty {
  externalId: string
  source: ScraperSource
  title: string
  priceRaw?: string | number | null
  currencyRaw?: string | null
  areaRaw?: string | number | null
  bedrooms?: number | null
  bathrooms?: number | null
  parking?: number | null
  propertyType?: string | null
  operation?: PropertyOperation | null
  region?: string | null
  city?: string | null
  commune?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  description?: string | null
  features?: string[]
  images?: string[]
  sourceUrl?: string | null
  contactName?: string | null
  contactPhone?: string | null
  daysActive?: number | null
  isNewConstruction?: boolean
}

export interface NormalisedProperty {
  external_id: string
  source: ScraperSource
  title: string
  price_clp: number | null
  price_uf: number | null
  currency: string
  area_m2: number | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  property_type: string | null
  operation: PropertyOperation
  region: string | null
  city: string | null
  commune: string | null
  address: string | null
  lat: number | null
  lng: number | null
  coordinates?: { lat: number; lng: number } | null
  geocode_status?: string | null
  geocode_confidence?: number | null
  geocode_precision?: string | null
  geocode_attempted_at?: string | null
  geocode_attempt_count?: number | null
  geocode_next_retry_at?: string | null
  geocode_last_error?: string | null
  description: string | null
  features: string[]
  images: string[]
  source_url: string | null
  contact_name: string | null
  contact_phone: string | null
  price_per_m2_clp: number | null
  price_per_m2_uf: number | null
  days_active: number | null
  is_new_construction: boolean
  scraped_at: string
}

export interface ScrapeResult {
  source: ScraperSource
  found: number
  inserted: number
  updated: number
  skipped: number
  errors: string[]
  durationMs: number
}

let _ufCache: { value: number; fetchedAt: number } | null = null

// Match the precision of the corresponding Postgres columns. Invalid source
// values are omitted instead of aborting persistence or polluting comparables.
const MAX_PRICE_UF = 10_000_000_000 // numeric(12,2)
const MAX_AREA_M2 = 10_000_000_000 // numeric(12,2)
const MAX_PRICE_PER_M2_UF = 100_000_000 // numeric(12,4)

function numericWithin(value: number | null, exclusiveMax: number): number | null {
  return value !== null && Number.isFinite(value) && Math.abs(value) < exclusiveMax ? value : null
}

function validCoordinatePair(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const parsedLat = Number(lat)
  const parsedLng = Number(lng)
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null
  if (parsedLat === 0 && parsedLng === 0) return null
  return { lat: parsedLat, lng: parsedLng }
}

export async function getUFValue(): Promise<number> {
  if (_ufCache && Date.now() - _ufCache.fetchedAt < 3_600_000) {
    return _ufCache.value
  }
  try {
    const res = await fetch('https://mindicador.cl/api/uf', { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`mindicador.cl returned ${res.status}`)
    const json = await res.json()
    const value = json?.serie?.[0]?.valor ?? 39_000
    _ufCache = { value, fetchedAt: Date.now() }
    return value
  } catch {
    return _ufCache?.value ?? 39_000
  }
}

export function parseChileanPrice(raw: string | number | null | undefined): {
  value: number | null
  currency: 'CLP' | 'UF' | 'USD'
} {
  if (raw == null) return { value: null, currency: 'CLP' }
  const str = String(raw).trim()
  if (!str || str === '-' || str.toLowerCase() === 'consultar') return { value: null, currency: 'CLP' }

  const lower = str.toLowerCase()
  const currency: 'CLP' | 'UF' | 'USD' = lower.includes('uf')
    ? 'UF'
    : lower.includes('usd') || lower.includes('us$')
    ? 'USD'
    : 'CLP'

  const cleaned = str
    .replace(/uf|usd|us\$|\$|clp/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()

  const value = parseFloat(cleaned)
  return { value: isNaN(value) ? null : value, currency }
}

export function parseArea(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const str = String(raw).trim().toLowerCase()
  if (!str || str === '-') return null

  const haMatch = str.match(/^([\d.,]+)\s*(ha|has|hect[aá]rea[s]?)/)
  if (haMatch) {
    const n = parseFloat(haMatch[1].replace(',', '.'))
    return isNaN(n) || n <= 0 ? null : Math.round(n * 10_000)
  }

  const cleaned = str.replace(/m[²2]/gi, '').replace(',', '.').trim()
  const n = parseFloat(cleaned)
  return isNaN(n) || n <= 0 ? null : n
}

export function normaliseRegion(raw: string | null | undefined): string | null {
  if (!raw) return null
  const r = raw.trim().toLowerCase()
  if (r.includes('metropolitana') || r.includes('santiago') || r === 'rm') return 'Región Metropolitana'
  if (r.includes('valparaíso') || r.includes('valparaiso')) return 'Región de Valparaíso'
  if (r.includes('biobío') || r.includes('biobio') || r.includes('bío')) return 'Región del Biobío'
  if (r.includes('araucanía') || r.includes('araucania')) return 'Región de La Araucanía'
  if (r.includes('los lagos')) return 'Región de Los Lagos'
  if (r.includes('los ríos') || r.includes('los rios')) return 'Región de Los Ríos'
  if (r.includes("o'higgins") || r.includes('ohiggins')) return "Región del Libertador General Bernardo O'Higgins"
  if (r.includes('maule')) return 'Región del Maule'
  if (r.includes('ñuble') || r.includes('nuble')) return 'Región de Ñuble'
  if (r.includes('coquimbo')) return 'Región de Coquimbo'
  if (r.includes('atacama')) return 'Región de Atacama'
  if (r.includes('antofagasta')) return 'Región de Antofagasta'
  if (r.includes('tarapacá') || r.includes('tarapaca')) return 'Región de Tarapacá'
  if (r.includes('arica')) return 'Región de Arica y Parinacota'
  if (r.includes('aysén') || r.includes('aysen')) return 'Región de Aysén'
  if (r.includes('magallanes')) return 'Región de Magallanes'
  if (r.includes('la araucanía')) return 'Región de La Araucanía'
  if (r.includes('chiloé') || r.includes('chiloe') || r.includes('castro') || r.includes('ancud') ||
      r.includes('quellón') || r.includes('quellon') || r.includes('dalcahue') || r.includes('chonchi') ||
      r.includes('quemchi') || r.includes('curaco') || r.includes('quinchao') || r.includes('puqueldón') ||
      r.includes('achao')) return 'Región de Los Lagos'
  if (r.includes('panguipulli') || r.includes('valdivia') || r.includes('la unión') || r.includes('río bueno') ||
      r.includes('osorno') || r.includes('puerto montt') || r.includes('frutillar') || r.includes('puerto varas') ||
      r.includes('llanquihue') || r.includes('calbuco') || r.includes('maullín') || r.includes('maullin')) return 'Región de Los Lagos'
  if (r.includes('coyhaique') || r.includes('cochrane') || r.includes('tortel') || r.includes('puerto aysén') ||
      r.includes('chile chico') || r.includes('cisnes')) return 'Región de Aysén'
  if (r.includes('punta arenas') || r.includes('puerto natales') || r.includes('porvenir') ||
      r.includes('tierra del fuego') || r.includes('torres del paine')) return 'Región de Magallanes'
  return raw.trim()
}

export async function normaliseProperty(raw: RawProperty): Promise<NormalisedProperty> {
  const ufValue = await getUFValue()
  const { value: priceValue, currency } = parseChileanPrice(raw.priceRaw)

  let price_clp: number | null = null
  let price_uf: number | null = null

  if (priceValue !== null) {
    if (currency === 'UF') {
      price_uf = priceValue
      price_clp = Math.round(priceValue * ufValue)
    } else if (currency === 'CLP') {
      price_clp = Math.round(priceValue)
      price_uf = parseFloat((priceValue / ufValue).toFixed(2))
    } else if (currency === 'USD') {
      price_clp = Math.round(priceValue * 950)
      price_uf = parseFloat((price_clp / ufValue).toFixed(2))
    }
  }

  price_uf = numericWithin(price_uf, MAX_PRICE_UF)
  const area_m2 = numericWithin(parseArea(raw.areaRaw), MAX_AREA_M2)
  const price_per_m2_clp = price_clp && area_m2 ? Math.round(price_clp / area_m2) : null
  const price_per_m2_uf = numericWithin(
    price_uf && area_m2 ? parseFloat((price_uf / area_m2).toFixed(4)) : null,
    MAX_PRICE_PER_M2_UF,
  )
  const sourcePoint = validCoordinatePair(raw.lat, raw.lng)

  return {
    external_id: raw.externalId,
    source: raw.source,
    title: raw.title.trim().slice(0, 500),
    price_clp,
    price_uf,
    currency,
    area_m2,
    bedrooms: raw.bedrooms ?? null,
    bathrooms: raw.bathrooms ?? null,
    parking: raw.parking ?? null,
    property_type: raw.propertyType?.toLowerCase().trim() ?? null,
    operation: raw.operation ?? 'venta',
    region: normaliseRegion(raw.region),
    city: raw.city?.trim() ?? null,
    commune: raw.commune?.trim() ?? null,
    address: raw.address?.trim() ?? null,
    lat: sourcePoint?.lat ?? null,
    lng: sourcePoint?.lng ?? null,
    ...(sourcePoint ? {
      coordinates: sourcePoint,
      geocode_status: 'success',
      geocode_confidence: 1,
      geocode_precision: 'point',
      geocode_next_retry_at: null,
      geocode_last_error: null,
    } : {}),
    description: raw.description?.trim().slice(0, 2000) ?? null,
    features: raw.features ?? [],
    images: (raw.images ?? []).slice(0, 10),
    source_url: raw.sourceUrl ?? null,
    contact_name: raw.contactName?.trim() ?? null,
    contact_phone: raw.contactPhone?.trim() ?? null,
    price_per_m2_clp,
    price_per_m2_uf,
    days_active: raw.daysActive ?? null,
    is_new_construction: raw.isNewConstruction ?? false,
    scraped_at: new Date().toISOString(),
  }
}

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function upsertProperties(
  normalised: NormalisedProperty[]
): Promise<{ inserted: number; updated: number; skipped: number; errors: string[] }> {
  if (normalised.length === 0) return { inserted: 0, updated: 0, skipped: 0, errors: [] }

  const supabase = getAdminClient()
  const errors: string[] = []
  let inserted = 0
  let updated = 0
  let skipped = 0

  const unique = Array.from(new Map(normalised.map((property) => [property.external_id, property])).values())

  async function persistChunk(chunk: NormalisedProperty[], existingIds: Set<string>): Promise<void> {
    const { data, error } = await supabase
      .from('properties_external')
      .upsert(chunk, {
        onConflict: 'external_id',
        ignoreDuplicates: false,
      })
      .select('external_id')

    if (error) {
      // PostgREST rejects the whole request when a single row violates a database
      // constraint. Split failed batches so one malformed marketplace listing does
      // not discard every valid property travelling in the same chunk.
      if (chunk.length > 1) {
        const midpoint = Math.ceil(chunk.length / 2)
        await persistChunk(chunk.slice(0, midpoint), existingIds)
        await persistChunk(chunk.slice(midpoint), existingIds)
        return
      }

      const property = chunk[0]
      errors.push(`${property.source}/${property.external_id}: ${error.message}`)
      skipped++
      return
    }

    const persistedIds = new Set((data ?? []).map((row) => row.external_id))
    for (const property of chunk) {
      if (!persistedIds.has(property.external_id)) {
        skipped++
      } else if (existingIds.has(property.external_id)) {
        updated++
      } else {
        inserted++
      }
    }
  }

  const CHUNK = 100
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK)
    const externalIds = chunk.map((property) => property.external_id)
    const { data: existingRows, error: lookupError } = await supabase
      .from('properties_external')
      .select('external_id,lat,lng,coordinates,geocode_status,geocode_confidence,geocode_precision,geocode_attempted_at,geocode_attempt_count,geocode_next_retry_at,geocode_last_error')
      .in('external_id', externalIds)

    if (lookupError) {
      errors.push(`Lookup ${i}-${i + CHUNK}: ${lookupError.message}`)
      skipped += chunk.length
      continue
    }

    const existingIds = new Set((existingRows ?? []).map((row) => row.external_id))
    const existingById = new Map((existingRows ?? []).map((row) => [row.external_id, row]))
    const safeChunk = chunk.map((property) => {
      const existing = existingById.get(property.external_id)
      const existingPoint = existing ? validCoordinatePair(existing.lat, existing.lng) : null
      if (!existing || !existingPoint) return property

      // Scrapers refresh commercial data frequently. Missing or newly surfaced source
      // coordinates must never erase/replace an already accepted point.
      return {
        ...property,
        lat: existingPoint.lat,
        lng: existingPoint.lng,
        coordinates: existing.coordinates ?? existingPoint,
        geocode_status: existing.geocode_status ?? 'success',
        geocode_confidence: existing.geocode_confidence ?? property.geocode_confidence ?? null,
        geocode_precision: existing.geocode_precision ?? 'point',
        geocode_attempted_at: existing.geocode_attempted_at ?? null,
        geocode_attempt_count: existing.geocode_attempt_count ?? null,
        geocode_next_retry_at: existing.geocode_next_retry_at ?? null,
        geocode_last_error: existing.geocode_last_error ?? null,
      }
    })
    await persistChunk(safeChunk, existingIds)
  }

  return { inserted, updated, skipped, errors }
}

export async function logScrapeRun(
  source: ScraperSource,
  result: Omit<ScrapeResult, 'source'>,
  region?: string
) {
  const supabase = getAdminClient()
  await supabase.from('scrape_runs').insert({
    source,
    status: result.errors.length === 0 ? 'completed' : result.found > 0 ? 'partial' : 'failed',
    region: region ?? null,
    properties_found: result.found,
    properties_inserted: result.inserted,
    properties_updated: result.updated,
    properties_skipped: result.skipped,
    error_message: result.errors.length ? result.errors.slice(0, 3).join(' | ') : null,
    started_at: new Date(Date.now() - result.durationMs).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: Math.round(result.durationMs / 1000),
  })
}
