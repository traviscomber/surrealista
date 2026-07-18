/**
 * CamposChile.cl scraper — campos, fundos, parcelas, terrenos rurales.
 *
 * Specialised portal for rural/agricultural properties across southern Chile.
 * URL pattern: https://www.camposchile.cl/propiedades/?tipo={tipo}&region={region}&pagina={n}
 * HTML-based, standard WP Real Estate theme.
 */
import * as cheerio from 'cheerio'
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun, normaliseRegion } from './base-scraper'

const BASE = 'https://camposchile.com'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Referer: BASE,
}

function simplifyLocation(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/regi[oó]n de(?:l)?/g, '')
    .trim()
}

async function fetchCatalog(): Promise<string> {
  const res = await fetch(BASE, {
    headers: HEADERS,
    signal: AbortSignal.timeout(180_000),
  })
  if (!res.ok) throw new Error(`camposchile ${BASE} → ${res.status}`)
  return res.text()
}

interface CamposListing {
  id: string
  title: string
  url: string
  priceRaw: string
  areaRaw: string
  region: string
  commune: string
  type: string
  image: string
}

export function parseCamposCards(html: string): CamposListing[] {
  if (!html) return []
  const $ = cheerio.load(html)

  return $('.prop-card').map((index, element) => {
    const card = $(element)
    const id = card.attr('onclick')?.match(/openFichaGate\((\d+)\)/)?.[1] ?? String(index + 1)
    const title = card.find('.prop-title').text().replace(/\s+/g, ' ').trim()
    const metadata = card.find('.prop-meta span').map((_, item) => $(item).text().replace(/\s+/g, ' ').trim()).get()
    const locationParts = (metadata[0] ?? '').split('·').map((part) => part.trim())
    const details = (metadata[1] ?? '').split('·').map((part) => part.trim())
    const badge = card.find('.prop-badge').text().replace(/\s+/g, ' ').trim()

    return {
      id,
      title: title || 'Propiedad rural CamposChile',
      url: BASE,
      priceRaw: card.find('.prop-price').text().replace(/\s+/g, ' ').trim(),
      areaRaw: details[0] ?? '',
      region: normaliseRegion(locationParts[1] ?? '') ?? locationParts[1] ?? '',
      commune: locationParts[0] ?? '',
      type: badge || title.split(' ')[0] || 'campo',
      image: card.find('img').first().attr('src') ?? '',
    }
  }).get()
}

export async function scrapeCamposChile(opts: {
  regions?: string[]
  types?: string[]
  pages?: number
} = {}): Promise<ScrapeResult> {
  const {
    regions = [],
    types = [],
  } = opts

  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []

  try {
    const html = await fetchCatalog()
    const requestedRegions = regions.map(simplifyLocation)
    const requestedTypes = types.map((type) => type.toLowerCase())
    const cards = parseCamposCards(html).filter((card) => {
      const matchesRegion = requestedRegions.length === 0
        || requestedRegions.some((region) => simplifyLocation(`${card.region} ${card.commune}`).includes(region))
      const matchesType = requestedTypes.length === 0
        || requestedTypes.some((type) => card.type.toLowerCase().includes(type) || card.title.toLowerCase().includes(type))
      return matchesRegion && matchesType
    })

    for (const card of cards) {
      allRaw.push({
        externalId: `camposchile-${card.id}`,
        source: 'camposchile',
        title: card.title,
        priceRaw: card.priceRaw || null,
        areaRaw: card.areaRaw || null,
        propertyType: card.type,
        operation: 'venta',
        region: card.region,
        commune: card.commune || null,
        images: card.image ? [card.image] : [],
        sourceUrl: card.url,
      })
    }
  } catch (err) {
    errors.push(`camposchile/catalogo: ${(err as Error).message}`)
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
  await logScrapeRun('camposchile', result)
  return { source: 'camposchile', ...result }
}
