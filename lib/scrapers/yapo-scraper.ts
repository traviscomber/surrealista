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
  const category = operation === 'venta'
    ? 'bienes-raices-venta-de-propiedades-casas'
    : 'bienes-raices-alquiler-casas'
  const url = `${BASE}/${category}${page > 1 ? `.${page}` : ''}`

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

  $('.d3-ad-tile').each((_, element) => {
    try {
      const card = $(element)
      const href = card.find('a[href*="bienes-raices-"]').first().attr('href') || ''
      const id = href.match(/\/(\d+)(?:\?|$)/)?.[1]
      if (!id) return
      const title = card.find('.d3-ad-tile__title').text().replace(/\s+/g, ' ').trim() || 'Propiedad Yapo'
      const price = card.find('.d3-ad-tile__price').text().replace(/\s+/g, ' ').trim()
      const location = card.find('.d3-ad-tile__location').text().replace(/\s+/g, ' ').trim()
      const description = card.find('.d3-ad-tile__short-description').text().replace(/\s+/g, ' ').trim()
      const details = card.find('.d3-ad-tile__details').text().replace(/\s+/g, ' ').trim()
      const numbers = card.find('.d3-ad-tile__details-item').map((_, detail) => $(detail).text().trim()).get()
      const image = card.find('img').first().attr('data-src') || card.find('img').first().attr('src')
      results.push({
        externalId: `yapo-${id}`,
        source: 'yapo',
        title: title.slice(0, 300),
        priceRaw: price || null,
        areaRaw: details.match(/[\d.,]+\s*(?:m²|m2|ha)/i)?.[0] ?? null,
        bedrooms: numbers.length > 1 ? parseInt(numbers[1], 10) || null : null,
        bathrooms: numbers.length > 2 ? parseInt(numbers[2], 10) || null : null,
        operation,
        region: regionPath,
        commune: location.split(',')[0]?.trim() || null,
        address: location || null,
        sourceUrl: `${BASE}${href}`,
        images: image && !image.startsWith('data:') ? [image] : [],
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
        region: null,
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

  // Yapo's current category URL is national; card locations remain authoritative.
  for (let page = 1; page <= pages; page++) {
    try {
      const batch = await fetchYapoPage(REGION_PATHS[regions[0]] ?? 'chile', operation, page)
      allRaw.push(...batch)
      if (page < pages) await new Promise((resolve) => setTimeout(resolve, 800))
    } catch (err) {
      errors.push(`yapo/p${page}: ${(err as Error).message}`)
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
