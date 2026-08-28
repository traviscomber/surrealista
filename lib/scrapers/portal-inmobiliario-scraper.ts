/**
 * Portal Inmobiliario scraper — HTTP-first, no Puppeteer required.
 * Uses the public terrenos search surface and embedded listing data.
 */
import * as cheerio from 'cheerio'
import type { RawProperty, ScrapeResult } from './base-scraper'
import {
  normaliseProperty,
  upsertProperties,
  logScrapeRun,
} from './base-scraper'

const BASE_URL = 'https://www.portalinmobiliario.com'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Referer: BASE_URL,
}

export interface PortalScraperOptions {
  regions?: string[]
  operation?: 'venta' | 'arriendo'
  propertyTypes?: string[]
  maxPerQuery?: number
}

const REGION_SLUGS: Record<string, string> = {
  'Región Metropolitana': 'metropolitana',
  'Región de Valparaíso': 'valparaiso',
  'Región del Biobío': 'biobio',
  'Región de La Araucanía': 'araucania',
  'Región de Los Lagos': 'los-lagos',
}

function asFiniteNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function validChilePoint(latValue: unknown, lngValue: unknown): { lat: number; lng: number } | null {
  const lat = asFiniteNumber(latValue)
  const lng = asFiniteNumber(lngValue)
  if (lat === null || lng === null) return null
  const broadChile = lat >= -57 && lat <= -17 && lng >= -111 && lng <= -65
  if (!broadChile) return null
  return { lat, lng }
}

function coordinatesFromObject(value: unknown, depth = 0): { lat: number; lng: number } | null {
  if (depth > 5 || value == null) return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const point = coordinatesFromObject(item, depth + 1)
      if (point) return point
    }
    return null
  }
  if (typeof value !== 'object') return null

  const obj = value as Record<string, unknown>
  const direct = validChilePoint(
    obj.latitude ?? obj.lat ?? obj['geo:latitude'],
    obj.longitude ?? obj.lng ?? obj.lon ?? obj['geo:longitude'],
  )
  if (direct) return direct

  const preferredKeys = ['geo', 'location', 'coordinates', 'map', 'itemOffered', 'additionalProperty']
  for (const key of preferredKeys) {
    if (!(key in obj)) continue
    const point = coordinatesFromObject(obj[key], depth + 1)
    if (point) return point
  }

  for (const child of Object.values(obj)) {
    const point = coordinatesFromObject(child, depth + 1)
    if (point) return point
  }
  return null
}

function coordinatesFromText(text: string): { lat: number; lng: number } | null {
  const patterns = [
    /["']?(?:latitude|lat)["']?\s*[:=]\s*["']?(-?\d{1,3}(?:\.\d+)?)["']?[\s\S]{0,160}?["']?(?:longitude|lng|lon)["']?\s*[:=]\s*["']?(-?\d{1,3}(?:\.\d+)?)/i,
    /["']?(?:longitude|lng|lon)["']?\s*[:=]\s*["']?(-?\d{1,3}(?:\.\d+)?)["']?[\s\S]{0,160}?["']?(?:latitude|lat)["']?\s*[:=]\s*["']?(-?\d{1,3}(?:\.\d+)?)/i,
    /data-(?:latitude|lat)=["'](-?\d{1,3}(?:\.\d+)?)["'][^>]{0,300}?data-(?:longitude|lng|lon)=["'](-?\d{1,3}(?:\.\d+)?)["']/i,
  ]

  for (let index = 0; index < patterns.length; index++) {
    const match = text.match(patterns[index])
    if (!match) continue
    const point = index === 1 ? validChilePoint(match[2], match[1]) : validChilePoint(match[1], match[2])
    if (point) return point
  }
  return null
}

export function extractPortalCoordinatesFromHTML(html: string): { lat: number; lng: number } | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      const point = coordinatesFromObject(data)
      if (point) return point
    } catch { /* malformed JSON-LD */ }
  }

  const statePatterns = [
    /window\.__PRELOADED_STATE__\s*=\s*(\{.+?\});?\s*<\/script>/s,
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  ]
  for (const pattern of statePatterns) {
    const stateMatch = html.match(pattern)
    if (!stateMatch) continue
    try {
      const point = coordinatesFromObject(JSON.parse(stateMatch[1]))
      if (point) return point
    } catch { /* malformed state */ }
  }

  return coordinatesFromText(html)
}

function absolutePortalUrl(value: string): string {
  if (!value) return ''
  try {
    return new URL(value, BASE_URL).toString()
  } catch {
    return value
  }
}

/** Fetch only the land category. The old /propiedades route mixed apartments,
 * houses and developments into the market inventory and polluted geocoding. */
async function fetchViaSearch(
  regionSlug: string,
  operation: string,
  _propertyType: string,
  offset: number,
  limit: number
): Promise<RawProperty[]> {
  const opPath = operation === 'venta' ? 'venta' : 'arriendo'
  const url = new URL(`${BASE_URL}/${opPath}/terrenos/${regionSlug}/_Desde_${offset + 1}_NoIndex_True`)
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString(), {
    headers: { ...HEADERS, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`Portal returned ${res.status} for ${url}`)
  const html = await res.text()

  return parsePortalHTML(html, operation as 'venta' | 'arriendo', regionSlug)
}

function parsePortalHTML(
  html: string,
  operation: 'venta' | 'arriendo',
  regionSlug: string
): RawProperty[] {
  const results: RawProperty[] = []

  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      const nodes = Array.isArray(parsed) ? parsed : [parsed]
      const expanded = nodes.flatMap((node) => {
        if (!node || typeof node !== 'object') return []
        const graph = (node as Record<string, unknown>)['@graph']
        return Array.isArray(graph) ? [node, ...graph] : [node]
      })
      for (const data of expanded) {
        if (!data || typeof data !== 'object') continue
        const record = data as Record<string, unknown>
        const type = record['@type']
        const types = Array.isArray(type) ? type.map(String) : [String(type ?? '')]
        if (types.some((item) => item === 'Product' || item === 'RealEstateListing')) {
          const prop = mapJsonLdToRaw(record, operation, regionSlug)
          if (prop) results.push(prop)
        }
      }
    } catch { /* skip malformed */ }
  }

  if (results.length === 0) {
    const stateMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{.+?\});?\s*<\/script>/s)
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1])
        const items =
          state?.listingPage?.listing?.results ||
          state?.search?.results ||
          []
        for (const item of items) {
          const prop = mapPreloadedToRaw(item, operation)
          if (prop) results.push(prop)
        }
      } catch { /* skip */ }
    }
  }

  if (results.length === 0) {
    const $ = cheerio.load(html)
    $('.poly-card').each((index, element) => {
      const card = $(element)
      const titleLink = card.find('a.poly-component__title, a[href*="MLC-"]').first()
      const rawSourceUrl = titleLink.attr('href') || card.find('a').filter((_, link) => /MLC-\d+/.test($(link).attr('href') || '')).first().attr('href') || ''
      const sourceUrl = absolutePortalUrl(rawSourceUrl)
      const id = sourceUrl.match(/MLC-?(\d+)/i)?.[1]
        ?? card.find('[data-id]').first().attr('data-id')?.replace(/\D/g, '')
        ?? `${regionSlug}-${index}`
      const text = card.text().replace(/\s+/g, ' ').trim()
      const title = titleLink.text().replace(/\s+/g, ' ').trim()
        || card.find('.poly-component__title').first().text().replace(/\s+/g, ' ').trim()
        || card.find('img').first().attr('alt')
        || 'Terreno Portal Inmobiliario'
      const price = text.match(/(?:UF\s*[\d.,]+|\$\s*[\d.,]+)/i)?.[0] ?? null
      const area = text.match(/[\d.,]+\s*(?:m²|m2|ha(?:s)?)/i)?.[0] ?? null
      const image = card.find('img.poly-component__picture, img').first().attr('src')
      const location = card.find('.poly-component__location').first().text().replace(/\s+/g, ' ').trim()
      const point = coordinatesFromText($.html(element))
      results.push({
        externalId: `portal-${id}`,
        source: 'portal_inmobiliario',
        title,
        priceRaw: price,
        areaRaw: area,
        propertyType: 'terreno',
        operation,
        region: regionSlug,
        address: location || null,
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
        images: image ? [image] : [],
        sourceUrl: sourceUrl || `${BASE_URL}/${operation}/terrenos/${regionSlug}`,
      })
    })
  }

  return results
}

function mapJsonLdToRaw(
  data: Record<string, unknown>,
  operation: 'venta' | 'arriendo',
  regionSlug: string
): RawProperty | null {
  const id = String(data['productID'] || data['sku'] || data['@id'] || '').replace(/\D/g, '')
  if (!id) return null
  const offer = (data['offers'] as Record<string, unknown>) ?? {}
  const addr = (data['address'] as Record<string, unknown>) ?? {}
  const point = coordinatesFromObject(data)
  return {
    externalId: id,
    source: 'portal_inmobiliario',
    title: String(data['name'] || 'Terreno Portal'),
    priceRaw: String(offer['price'] || ''),
    currencyRaw: String(offer['priceCurrency'] || 'CLP'),
    propertyType: 'terreno',
    region: String(addr['addressRegion'] || regionSlug),
    commune: String(addr['addressLocality'] || ''),
    address: String(addr['streetAddress'] || ''),
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    operation,
    sourceUrl: absolutePortalUrl(String(data['url'] || data['@id'] || '')),
    description: String(data['description'] || ''),
  }
}

function mapPreloadedToRaw(
  item: Record<string, unknown>,
  operation: 'venta' | 'arriendo'
): RawProperty | null {
  const id = String(item['id'] || item['item_id'] || '')
  if (!id) return null

  const attrs: Record<string, string> = {}
  const attributes = (item['attributes'] as { id: string; values: { name: string }[] }[]) ?? []
  for (const attr of attributes) {
    attrs[attr.id] = attr.values?.[0]?.name ?? ''
  }

  const priceObj = item['prices'] as { amount: number; currency_id: string }[] | undefined
  const priceAmount = priceObj?.[0]?.amount ?? item['price']
  const priceCurrency = priceObj?.[0]?.currency_id ?? 'CLP'

  const location = item['location'] as {
    state?: { name: string }
    city?: { name: string }
    neighborhood?: { name: string }
    latitude?: number | string
    longitude?: number | string
  } | undefined
  const point = coordinatesFromObject(location) ?? coordinatesFromObject(item)

  return {
    externalId: id,
    source: 'portal_inmobiliario',
    title: String(item['title'] || 'Terreno'),
    priceRaw: typeof priceAmount === 'number' || typeof priceAmount === 'string' ? priceAmount : null,
    currencyRaw: typeof priceCurrency === 'string' ? priceCurrency : 'CLP',
    areaRaw: attrs['TOTAL_AREA'] || attrs['COVERED_AREA'] || null,
    bedrooms: parseInt(attrs['BEDROOMS'] || '0') || null,
    bathrooms: parseInt(attrs['FULL_BATHROOMS'] || '0') || null,
    parking: parseInt(attrs['PARKING_LOTS'] || '0') || null,
    propertyType: 'terreno',
    operation,
    region: location?.state?.name ?? null,
    commune: location?.city?.name ?? location?.neighborhood?.name ?? null,
    address: String(item['address'] || ''),
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    sourceUrl: absolutePortalUrl(String(item['permalink'] || item['url'] || `${BASE_URL}/MLC-${id}`)),
    images: ((item['pictures'] as { url: string }[]) ?? []).map((p) => p.url),
    description: String(item['description'] || ''),
    daysActive: item['days_active'] as number ?? null,
  }
}

export async function scrapePortalInmobiliario(
  opts: PortalScraperOptions = {}
): Promise<ScrapeResult> {
  const {
    regions = ['Región Metropolitana', 'Región de Valparaíso', 'Región del Biobío', 'Región de Los Lagos'],
    operation = 'venta',
    maxPerQuery = 48,
  } = opts

  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []

  for (const region of regions) {
    const slug = REGION_SLUGS[region] ?? region.toLowerCase().replace(/[^a-z]+/g, '-')
    try {
      const props = await fetchViaSearch(slug, operation, 'terreno', 0, maxPerQuery)
      allRaw.push(...props)
    } catch (err) {
      errors.push(`portal/${region}: ${(err as Error).message}`)
    }
  }

  const normalised = await Promise.all(allRaw.map(normaliseProperty))
  const dbResult = await upsertProperties(normalised)
  errors.push(...dbResult.errors)

  const result: Omit<ScrapeResult, 'source'> = {
    found: allRaw.length,
    inserted: dbResult.inserted,
    updated: dbResult.updated,
    skipped: dbResult.skipped,
    errors,
    durationMs: Date.now() - start,
  }

  await logScrapeRun('portal_inmobiliario', result)

  return { source: 'portal_inmobiliario', ...result }
}
