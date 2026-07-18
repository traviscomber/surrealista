/**
 * iCasas.com scraper — uses their REST API + HTML fallback.
 * iCasas exposes a JSON feed for property searches.
 */
import * as cheerio from 'cheerio'
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun } from './base-scraper'

const BASE = 'https://www.icasas.cl'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  Accept: 'application/json, text/html',
  Referer: BASE,
}

interface iCasasProperty {
  id?: string | number
  cod?: string
  titulo?: string
  title?: string
  precio?: string | number
  precio_uf?: string | number
  moneda?: string
  m2?: string | number
  m2_total?: string | number
  dormitorios?: string | number
  banos?: string | number
  estacionamientos?: string | number
  tipo?: string
  tipo_operacion?: string
  region?: string
  comuna?: string
  ciudad?: string
  direccion?: string
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
  descripcion?: string
  fotos?: string[] | { url: string }[]
  url?: string
  dias_publicado?: number
  nuevo?: boolean | number
}

async function fetchICasasHTML(
  operation: 'venta' | 'arriendo',
  regionSlug: string,
  page: number,
): Promise<iCasasProperty[]> {
  const url = `${BASE}/${operation}/terrenos/${regionSlug}/list${page > 1 ? `?page=${page}` : ''}`
  const res = await fetch(url, {
    headers: { ...HEADERS, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`iCasas HTML ${url} → ${res.status}`)

  const $ = cheerio.load(await res.text())
  return $('.serp-snippet').map((_, element) => {
    const card = $(element)
    const detail = card.find('a.detail-redirection').first()
    const href = detail.attr('href') ?? ''
    const description = card.find('.description').text().replace(/\s+/g, ' ').trim()
    const image = card.find('.slider-ad img').filter((_, img) => {
      const src = $(img).attr('data-lazy') ?? $(img).attr('src') ?? ''
      return !src.includes('loading-image')
    }).first()
    const imageUrl = image.attr('data-lazy') ?? image.attr('src')
    const area = description.match(/[\d.,]+\s*(?:hect[aá]reas?|ha|m[²2])/i)?.[0]

    return {
      id: card.attr('id'),
      titulo: detail.text().replace(/\s+/g, ' ').trim(),
      precio: card.find('.price').text().replace(/\s+/g, ' ').trim(),
      m2_total: area,
      tipo: 'terreno',
      tipo_operacion: operation,
      descripcion: description,
      fotos: imageUrl ? [imageUrl] : [],
      url: href,
    }
  }).get()
}

function mapToRaw(p: iCasasProperty, operation: 'venta' | 'arriendo'): RawProperty | null {
  const id = String(p.id || p.cod || '').trim()
  if (!id) return null

  const images = Array.isArray(p.fotos)
    ? p.fotos.map((f) => (typeof f === 'string' ? f : f.url))
    : []

  return {
    externalId: id,
    source: 'icasas',
    title: String(p.titulo || p.title || 'Propiedad iCasas').slice(0, 300),
    priceRaw: p.precio_uf != null ? `${p.precio_uf} UF` : p.precio ?? null,
    currencyRaw: p.moneda || (p.precio_uf != null ? 'UF' : 'CLP'),
    areaRaw: p.m2_total ?? p.m2 ?? null,
    bedrooms: p.dormitorios != null ? parseInt(String(p.dormitorios)) || null : null,
    bathrooms: p.banos != null ? parseInt(String(p.banos)) || null : null,
    parking: p.estacionamientos != null ? parseInt(String(p.estacionamientos)) || null : null,
    propertyType: String(p.tipo || '').toLowerCase() || null,
    operation,
    region: p.region ?? null,
    commune: p.comuna ?? null,
    city: p.ciudad ?? null,
    address: p.direccion ?? null,
    lat: p.lat ?? p.latitude ?? null,
    lng: p.lng ?? p.longitude ?? null,
    description: String(p.descripcion || '').slice(0, 2000),
    images: images.slice(0, 10),
    sourceUrl: p.url ? (p.url.startsWith('http') ? p.url : `${BASE}${p.url}`) : null,
    daysActive: p.dias_publicado ?? null,
    isNewConstruction: !!p.nuevo,
  }
}

const REGION_SLUGS: Record<string, string> = {
  'Región Metropolitana': 'metropolitana-de-santiago',
  'Región de Valparaíso': 'valparaiso-region-v',
  'Región del Biobío': 'bio-bio-region-viii',
  'Región de La Araucanía': 'araucania-region-ix',
  'Región de Los Lagos': 'lagos-region-x',
  'Región de Los Ríos': 'rios-region-xiv',
  'Región de Aysén': 'aysen-region-xi',
  'Región de Magallanes': 'magallanes-antartica-chilena-region-xii',
}

export async function scrapeICasas(opts: {
  regions?: string[]
  operation?: 'venta' | 'arriendo'
  pages?: number
} = {}): Promise<ScrapeResult> {
  const {
    regions = [
      'Región del Biobío',
      'Región de La Araucanía',
      'Región de Los Ríos',
      'Región de Los Lagos',
      'Región de Aysén',
      'Región de Magallanes',
    ],
    operation = 'venta',
    pages = 2,
  } = opts

  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  for (const region of regions) {
    const slug = REGION_SLUGS[region] ?? 'region-metropolitana'
    for (let page = 1; page <= pages; page++) {
      try {
        const listings = await fetchICasasHTML(operation, slug, page)
        if (listings.length === 0) break
        const batch = listings
          .map((listing) => mapToRaw(listing, operation))
          .filter((property): property is RawProperty => property !== null)
          .filter((property) => {
            if (seen.has(property.externalId)) return false
            seen.add(property.externalId)
            return true
          })
        batch.forEach((property) => { property.region = property.region || region })
        allRaw.push(...batch)
        if (page < pages) await new Promise((r) => setTimeout(r, 700))
      } catch (err) {
        errors.push(`icasas/${region}/p${page}: ${(err as Error).message}`)
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
  await logScrapeRun('icasas', result)
  return { source: 'icasas', ...result }
}
