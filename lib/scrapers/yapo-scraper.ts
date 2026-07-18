/**
 * Yapo.cl scraper — uses cheerio to parse HTML listings.
 * Yapo serves SSR HTML so no JS execution needed.
 */
import * as cheerio from 'cheerio'
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun } from './base-scraper'

const BASE = 'https://www.yapo.cl'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'es-CL,es;q=0.9',
}

const REGION_PATHS: Record<string, string> = {
  'Región Metropolitana': 'rm',
  'Región de Valparaíso': 'valparaiso',
  'Región del Biobío': 'biobio',
  'Región de La Araucanía': 'araucania',
  'Región de Los Lagos': 'los-lagos',
  'Región de Coquimbo': 'coquimbo',
}

async function fetchYapoPage(
  regionPath: string,
  operation: 'venta' | 'arriendo',
  page: number
): Promise<RawProperty[]> {
  const cat = operation === 'venta' ? 'inmuebles' : 'arriendo'
  const url = `${BASE}/${regionPath}/${cat}/propiedades?o=${page}`

  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Yapo ${url} → ${res.status}`)
  const html = await res.text()

  return parseYapoHTML(html, operation, regionPath)
}

function parseYapoHTML(
  html: string,
  operation: 'venta' | 'arriendo',
  regionPath: string
): RawProperty[] {
  const $ = cheerio.load(html)
  const results: RawProperty[] = []

  // Yapo listing cards
  $('li[class*="listing-item"], article[class*="listing"]').each((_, el) => {
    try {
      const $el = $(el)
      const linkEl = $el.find('a[href*="/prop/"]').first()
      const href = linkEl.attr('href') || ''
      const idMatch = href.match(/\/(\d+)(?:\?|$)/)
      if (!idMatch) return

      const externalId = idMatch[1]
      const title =
        $el.find('[class*="title"], h2, h3').first().text().trim() || 'Propiedad Yapo'
      const priceText = $el.find('[class*="price"], [class*="precio"]').first().text().trim()
      const location = $el
        .find('[class*="location"], [class*="address"], [class*="ubicacion"]')
        .first()
        .text()
        .trim()
      const description = $el
        .find('[class*="description"], [class*="descripcion"]')
        .first()
        .text()
        .trim()

      // Room / area details from list items
      const detailsText = $el.find('[class*="detail"], [class*="feature"]').text()
      const bedroomsMatch = detailsText.match(/(\d+)\s*(?:dorm|hab|piezas)/i)
      const bathroomsMatch = detailsText.match(/(\d+)\s*(?:ba[ñn])/i)
      const areaMatch = detailsText.match(/(\d[\d.,]*)\s*m[²2]/i)

      const img = $el.find('img[src*="yapo"]').attr('src') || ''

      results.push({
        externalId,
        source: 'yapo',
        title: title.slice(0, 300),
        priceRaw: priceText,
        areaRaw: areaMatch?.[1] ?? null,
        bedrooms: bedroomsMatch ? parseInt(bedroomsMatch[1]) : null,
        bathrooms: bathroomsMatch ? parseInt(bathroomsMatch[1]) : null,
        operation,
        region: null, // resolved later by normaliser from regionPath
        commune: location.split(',')[0]?.trim() ?? null,
        city: location.split(',')[1]?.trim() ?? null,
        address: location,
        sourceUrl: href.startsWith('http') ? href : `${BASE}${href}`,
        images: img ? [img] : [],
        description,
      })
    } catch { /* skip bad card */ }
  })

  // Fallback: JSON-LD
  if (results.length === 0) {
    const scripts = $('script[type="application/ld+json"]')
    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '')
        if (Array.isArray(data?.itemListElement)) {
          for (const item of data.itemListElement) {
            const listing = item?.item || item
            const id = String(listing?.['@id'] || listing?.url || '').replace(/\D/g, '').slice(-10)
            if (!id) continue
            results.push({
              externalId: `yapo-${id}`,
              source: 'yapo',
              title: String(listing?.name || 'Propiedad Yapo'),
              priceRaw: listing?.offers?.price,
              currencyRaw: listing?.offers?.priceCurrency || 'CLP',
              operation,
              region: regionPath,
              sourceUrl: listing?.url || null,
            })
          }
        }
      } catch { /* skip */ }
    })
  }

  return results
}

export async function scrapeYapo(opts: {
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
    const path = REGION_PATHS[region] ?? 'rm'
    for (let page = 1; page <= pages; page++) {
      try {
        const batch = await fetchYapoPage(path, operation, page)
        // Attach region so normaliser can pick it up
        batch.forEach((p) => { p.region = region })
        allRaw.push(...batch)
        // Polite delay
        if (page < pages) await new Promise((r) => setTimeout(r, 800))
      } catch (err) {
        errors.push(`yapo/${region}/p${page}: ${(err as Error).message}`)
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
  await logScrapeRun('yapo', result)
  return { source: 'yapo', ...result }
}
