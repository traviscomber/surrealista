/**
 * Portal Inmobiliario scraper — HTTP-first, no Puppeteer required.
 * Uses the undocumented Elasticsearch JSON API that powers portal.
 */
import * as cheerio from 'cheerio'
import type { RawProperty, ScrapeResult } from './base-scraper'
import {
  normaliseProperty,
  upsertProperties,
  logScrapeRun,
} from './base-scraper'

const BASE_URL = 'https://www.portalinmobiliario.com'
const API_URL = `${BASE_URL}/noindex/ct1/listing/_search`

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

const OPERATION_MAP: Record<string, string> = {
  venta: 'sale',
  arriendo: 'rent',
}

function buildQuery(
  regionSlug: string,
  operation: string,
  propertyType: string,
  from: number,
  size: number
) {
  return {
    query: {
      bool: {
        filter: [
          { term: { 'site_id': 'MLC' } },
          { term: { 'listing_type_id': operation === 'venta' ? 'gold_special' : 'gold_special' } },
          {
            match: {
              'g_address.state_name': regionSlug,
            },
          },
        ],
      },
    },
    from,
    size,
    sort: [{ _score: 'desc' }, { 'date_created': 'desc' }],
  }
}

/** Alternative: use the public search endpoint */
async function fetchViaSearch(
  regionSlug: string,
  operation: string,
  propertyType: string,
  offset: number,
  limit: number
): Promise<RawProperty[]> {
  const opPath = operation === 'venta' ? 'venta' : 'arriendo'
  const url = new URL(`${BASE_URL}/${opPath}/propiedades/${regionSlug}/_Desde_${offset + 1}_NoIndex_True`)
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

  // Extract JSON-LD / embedded listing data
  const scriptRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      if (data['@type'] === 'Product' || data['@type'] === 'RealEstateListing') {
        const prop = mapJsonLdToRaw(data, operation, regionSlug)
        if (prop) results.push(prop)
      }
    } catch { /* skip malformed */ }
  }

  // Fallback: parse __PRELOADED_STATE__ from Next.js hydration
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
      const sourceUrl = titleLink.attr('href') || card.find('a').filter((_, link) => /MLC-\d+/.test($(link).attr('href') || '')).first().attr('href') || ''
      const id = sourceUrl.match(/MLC-?(\d+)/i)?.[1]
        ?? card.find('[data-id]').first().attr('data-id')?.replace(/\D/g, '')
        ?? `${regionSlug}-${index}`
      const text = card.text().replace(/\s+/g, ' ').trim()
      const title = titleLink.text().replace(/\s+/g, ' ').trim()
        || card.find('.poly-component__title').first().text().replace(/\s+/g, ' ').trim()
        || card.find('img').first().attr('alt')
        || 'Propiedad Portal Inmobiliario'
      const price = text.match(/(?:UF\s*[\d.,]+|\$\s*[\d.,]+)/i)?.[0] ?? null
      const area = text.match(/[\d.,]+\s*(?:m²|m2|ha(?:s)?)/i)?.[0] ?? null
      const image = card.find('img.poly-component__picture, img').first().attr('src')
      const location = card.find('.poly-component__location').first().text().replace(/\s+/g, ' ').trim()
      results.push({
        externalId: `portal-${id}`,
        source: 'portal_inmobiliario',
        title,
        priceRaw: price,
        areaRaw: area,
        operation,
        region: regionSlug,
        address: location || null,
        images: image ? [image] : [],
        sourceUrl: sourceUrl || `${BASE_URL}/${operation}`,
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
  const id = String(data['productID'] || data['@id'] || '').replace(/\D/g, '')
  if (!id) return null
  const offer = (data['offers'] as Record<string, unknown>) ?? {}
  const addr = (data['address'] as Record<string, unknown>) ?? {}
  return {
    externalId: id,
    source: 'portal_inmobiliario',
    title: String(data['name'] || 'Propiedad Portal'),
    priceRaw: String(offer['price'] || ''),
    currencyRaw: String(offer['priceCurrency'] || 'CLP'),
    region: String(addr['addressRegion'] || regionSlug),
    commune: String(addr['addressLocality'] || ''),
    address: String(addr['streetAddress'] || ''),
    operation,
    sourceUrl: String(data['url'] || ''),
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

  const location = item['location'] as Record<string, { name: string }> | undefined

  return {
    externalId: id,
    source: 'portal_inmobiliario',
    title: String(item['title'] || 'Propiedad'),
    priceRaw: priceAmount,
    currencyRaw: priceCurrency,
    areaRaw: attrs['TOTAL_AREA'] || attrs['COVERED_AREA'] || null,
    bedrooms: parseInt(attrs['BEDROOMS'] || '0') || null,
    bathrooms: parseInt(attrs['FULL_BATHROOMS'] || '0') || null,
    parking: parseInt(attrs['PARKING_LOTS'] || '0') || null,
    propertyType: attrs['PROPERTY_TYPE'] || String(item['category_id'] || ''),
    operation,
    region: location?.state?.name ?? null,
    commune: location?.city?.name ?? location?.neighborhood?.name ?? null,
    address: String(item['address'] || ''),
    lat: (location as Record<string, number>)?.latitude ?? null,
    lng: (location as Record<string, number>)?.longitude ?? null,
    sourceUrl: `${BASE_URL}/MLC-${id}`,
    images: ((item['pictures'] as { url: string }[]) ?? []).map((p) => p.url),
    description: String(item['description'] || ''),
    daysActive: item['days_active'] as number ?? null,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

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
      const props = await fetchViaSearch(slug, operation, 'all', 0, maxPerQuery)
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
