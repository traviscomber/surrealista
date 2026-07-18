/**
 * TocToc.com scraper — uses their unofficial JSON API.
 * TocToc exposes an AJAX endpoint that returns structured listing data.
 */
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun } from './base-scraper'

const BASE = 'https://www.toctoc.com'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'X-Requested-With': 'XMLHttpRequest',
  Referer: BASE,
}

interface TocTocListing {
  id?: string | number
  propertyId?: string | number
  title?: string
  price?: number
  priceCurrency?: string
  priceUF?: number
  areaTotal?: number
  areaUseful?: number
  bedrooms?: number
  bathrooms?: number
  parking?: number
  propertyType?: string
  transactionType?: string
  regionName?: string
  communeName?: string
  address?: string
  latitude?: number
  longitude?: number
  description?: string
  images?: string[] | { url: string }[]
  url?: string
  daysPublished?: number
  isNewProject?: boolean
}

async function fetchTocTocPage(
  operation: 'venta' | 'arriendo',
  regionId: number,
  page: number,
  perPage: number
): Promise<TocTocListing[]> {
  const operationType = operation === 'venta' ? 1 : 2
  const url = `${BASE}/api/v1/listings?operationType=${operationType}&regionId=${regionId}&page=${page}&pageSize=${perPage}&orderBy=date`

  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`TocToc ${url} → ${res.status}`)

  const json = await res.json()
  return json?.data ?? json?.listings ?? json?.results ?? json ?? []
}

/** Fallback: parse HTML search page */
async function fetchTocTocHTML(
  operation: 'venta' | 'arriendo',
  regionSlug: string,
  page: number
): Promise<RawProperty[]> {
  const opSlug = operation === 'venta' ? 'venta' : 'arriendo'
  const url = `${BASE}/${opSlug}/${regionSlug}?page=${page}`

  const res = await fetch(url, {
    headers: { ...HEADERS, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`TocToc HTML ${url} → ${res.status}`)
  const html = await res.text()

  const results: RawProperty[] = []
  // Extract window.__INITIAL_DATA__ or __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1])
      const listings: TocTocListing[] =
        nextData?.props?.pageProps?.listings ||
        nextData?.props?.pageProps?.data?.listings ||
        []
      results.push(...listings.map((l) => mapTocTocToRaw(l, operation, regionSlug)))
    } catch { /* skip */ }
  }
  return results.filter((p): p is RawProperty => !!p)
}

function mapTocTocToRaw(
  l: TocTocListing,
  operation: 'venta' | 'arriendo',
  regionSlug: string
): RawProperty {
  const id = String(l.id || l.propertyId || Math.random().toString(36).slice(2))
  const imageUrls = Array.isArray(l.images)
    ? l.images.map((img) => (typeof img === 'string' ? img : img.url))
    : []

  return {
    externalId: id,
    source: 'toctoc',
    title: l.title || 'Propiedad TocToc',
    priceRaw: l.priceUF != null ? `${l.priceUF} UF` : l.price != null ? String(l.price) : null,
    currencyRaw: l.priceCurrency || (l.priceUF != null ? 'UF' : 'CLP'),
    areaRaw: l.areaTotal ?? l.areaUseful ?? null,
    bedrooms: l.bedrooms ?? null,
    bathrooms: l.bathrooms ?? null,
    parking: l.parking ?? null,
    propertyType: l.propertyType ?? null,
    operation,
    region: l.regionName ?? regionSlug,
    commune: l.communeName ?? null,
    address: l.address ?? null,
    lat: l.latitude ?? null,
    lng: l.longitude ?? null,
    description: l.description ?? null,
    images: imageUrls.slice(0, 10),
    sourceUrl: l.url ? (l.url.startsWith('http') ? l.url : `${BASE}${l.url}`) : null,
    daysActive: l.daysPublished ?? null,
    isNewConstruction: l.isNewProject ?? false,
  }
}

const REGION_SLUGS: Record<string, { slug: string; id: number }> = {
  'Región Metropolitana': { slug: 'region-metropolitana', id: 13 },
  'Región de Valparaíso': { slug: 'region-de-valparaiso', id: 5 },
  'Región del Biobío': { slug: 'region-del-biobio', id: 8 },
  'Región de La Araucanía': { slug: 'region-de-la-araucania', id: 9 },
  'Región de Los Lagos': { slug: 'region-de-los-lagos', id: 10 },
  'Región de Coquimbo': { slug: 'region-de-coquimbo', id: 4 },
}

export async function scrapeTocToc(opts: {
  regions?: string[]
  operation?: 'venta' | 'arriendo'
  pages?: number
} = {}): Promise<ScrapeResult> {
  const {
    regions = ['Región Metropolitana', 'Región de Valparaíso', 'Región del Biobío'],
    operation = 'venta',
    pages = 2,
  } = opts

  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []

  for (const region of regions) {
    const { slug, id: regionId } = REGION_SLUGS[region] ?? { slug: 'region-metropolitana', id: 13 }
    for (let page = 1; page <= pages; page++) {
      try {
        // Try API first
        let batch: RawProperty[] = []
        try {
          const listings = await fetchTocTocPage(operation, regionId, page, 24)
          batch = listings.map((l) => mapTocTocToRaw(l, operation, slug))
        } catch {
          // Fallback to HTML
          batch = await fetchTocTocHTML(operation, slug, page)
        }
        batch.forEach((p) => { p.region = region })
        allRaw.push(...batch)
        if (page < pages) await new Promise((r) => setTimeout(r, 600))
      } catch (err) {
        errors.push(`toctoc/${region}/p${page}: ${(err as Error).message}`)
      }
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
  await logScrapeRun('toctoc', result)
  return { source: 'toctoc', ...result }
}
