import * as cheerio from 'cheerio'
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun, normaliseRegion } from './base-scraper'

const BASE = 'https://rura.cl'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-CL,es;q=0.9',
}

interface RuraProperty {
  id: string
  titulo: string
  url: string
  precio?: string
  area?: string
  ubicacion?: string
  imagen?: string
  tipo?: string
  descripcion?: string
}

const CATALOG_PATHS = [
  '/venta/parcelas-y-terrenos',
  '/venta/campos',
]

async function fetchRuraCatalog(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`rura ${BASE}${path} → ${res.status}`)
  return res.text()
}

function parseRuraProperties(html: string): RuraProperty[] {
  if (!html) return []
  const $ = cheerio.load(html)
  const properties: RuraProperty[] = []

  // Rura renders each listing as a card with stable data-testid hooks
  $('[data-testid="property-card"]').each((_, element) => {
    const card = $(element)
    const anchor = card.find('a[href*="/propiedad/"]').first()
    const href = (anchor.attr('href') ?? '').split(/[?#]/)[0]
    const title = card.find('[data-testid="property-card-title"]').text().replace(/\s+/g, ' ').trim()
      || (anchor.attr('aria-label') ?? '').trim()
    if (!href || !title) return

    const location = card.find('[data-testid="property-card-location"]').text().replace(/\s+/g, ' ').trim()
    const price = card.find('[data-testid="property-card-price"]').text().replace(/\s+/g, ' ').trim()

    // A badge above the title states the property type ("Terreno Rural", "Campo", ...).
    // Featured listings show a "Destacado" badge first, so scan all badges and fall back to the title.
    const badges = card.find('.inline-flex.items-center')
      .map((__, el) => $(el).text().replace(/\s+/g, ' ').trim().toLowerCase())
      .get()
    const typeSource = `${badges.join(' ')} ${title.toLowerCase()}`
    const type = typeSource.includes('parcela')
      ? 'parcela'
      : typeSource.includes('terreno')
        ? 'terreno'
        : typeSource.includes('campo')
          ? 'campo'
          : 'parcela'

    // Area appears as its own line near the price ("6 hectáreas", "5.000 m²")
    const areaText = card.find('span, div')
      .filter((__, el) => /^[\d.,]+\s*(?:hect[aá]reas?|has?|m²|m2)$/i.test($(el).text().trim()))
      .first()
      .text()
      .trim()

    const image = card.find('[data-testid="property-image"], img').first()
    const imageUrl = image.attr('src') || image.attr('data-lazy') || image.attr('data-src')

    properties.push({
      id: href.split('/').pop() || `rura-${Math.random()}`,
      titulo: title.slice(0, 400),
      url: href.startsWith('http') ? href : `${BASE}${href}`,
      precio: price || undefined,
      area: areaText || undefined,
      ubicacion: location,
      imagen: imageUrl && imageUrl.startsWith('http') ? imageUrl : undefined,
      tipo: type,
      descripcion: '',
    })
  })

  return properties
}

function mapToRaw(property: RuraProperty, operation: 'venta' | 'arriendo' = 'venta'): RawProperty | null {
  if (!property.id || !property.titulo) return null

  return {
    externalId: `rura-${property.id}`,
    source: 'rura',
    title: property.titulo,
    priceRaw: property.precio ?? null,
    areaRaw: property.area ?? null,
    propertyType: property.tipo || 'parcela',
    operation,
    region: normaliseRegion(property.ubicacion),
    commune: property.ubicacion ? property.ubicacion.split(',')[0]?.trim() || null : null,
    description: property.descripcion || null,
    images: property.imagen ? [property.imagen] : [],
    sourceUrl: property.url,
  }
}

export async function scrapeRura(_opts?: { pages?: number; types?: string[] }): Promise<ScrapeResult> {
  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  for (const path of CATALOG_PATHS) {
    const operation: 'venta' | 'arriendo' = path.startsWith('/arriendo') ? 'arriendo' : 'venta'
    try {
      const html = await fetchRuraCatalog(path)
      const batch = parseRuraProperties(html)
        .map((property) => mapToRaw(property, operation))
        .filter((property): property is RawProperty => property !== null)
        .filter((property) => {
          if (seen.has(property.externalId)) return false
          seen.add(property.externalId)
          return true
        })

      allRaw.push(...batch)
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400))
    } catch (err) {
      errors.push(`rura${path}: ${(err as Error).message}`)
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
  await logScrapeRun('rura', result)
  return { source: 'rura', ...result }
}
