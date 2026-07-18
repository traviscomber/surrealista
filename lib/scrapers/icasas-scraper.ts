/**
 * iCasas.com scraper — uses their REST API + HTML fallback.
 * iCasas exposes a JSON feed for property searches.
 */
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

async function fetchICasasJSON(
  operation: 'venta' | 'arriendo',
  communeSlug: string,
  page: number
): Promise<iCasasProperty[]> {
  const opParam = operation === 'venta' ? 'venta' : 'arriendo'
  const url = `${BASE}/api/v2/properties?tipo=${opParam}&comuna=${communeSlug}&page=${page}&per_page=24&orden=fecha`

  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) })
  if (!res.ok) throw new Error(`iCasas API ${url} → ${res.status}`)
  const json = await res.json()
  return json?.properties ?? json?.data ?? json?.results ?? []
}

async function fetchICasasHTML(
  operation: 'venta' | 'arriendo',
  regionSlug: string,
  page: number
): Promise<iCasasProperty[]> {
  const opSlug = operation === 'venta' ? 'venta' : 'arriendo'
  const url = `${BASE}/${opSlug}/${regionSlug}?pagina=${page}`

  const res = await fetch(url, {
    headers: { ...HEADERS, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`iCasas HTML ${url} → ${res.status}`)
  const html = await res.text()

  const results: iCasasProperty[] = []

  // __NEXT_DATA__ extraction
  const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (ndMatch) {
    try {
      const nd = JSON.parse(ndMatch[1])
      const listings: iCasasProperty[] =
        nd?.props?.pageProps?.properties ||
        nd?.props?.pageProps?.data ||
        []
      results.push(...listings)
    } catch { /* skip */ }
  }

  // JSON-LD fallback
  if (results.length === 0) {
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    let m
    while ((m = jsonLdRegex.exec(html)) !== null) {
      try {
        const d = JSON.parse(m[1])
        if (d?.['@type'] === 'ItemList') {
          for (const item of d.itemListElement ?? []) {
            const listing = item?.item || item
            const id = String(listing?.['@id'] || '').replace(/\D/g, '').slice(-10)
            if (id) results.push({ id, titulo: listing?.name, precio: listing?.offers?.price, url: listing?.url })
          }
        }
      } catch { /* skip */ }
    }
  }

  return results
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
  'Región Metropolitana': 'region-metropolitana',
  'Región de Valparaíso': 'region-valparaiso',
  'Región del Biobío': 'region-biobio',
  'Región de La Araucanía': 'region-araucania',
  'Región de Los Lagos': 'region-los-lagos',
}

export async function scrapeICasas(opts: {
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
    const slug = REGION_SLUGS[region] ?? 'region-metropolitana'
    for (let page = 1; page <= pages; page++) {
      try {
        let listings: iCasasProperty[] = []
        try {
          listings = await fetchICasasJSON(operation, slug, page)
        } catch {
          listings = await fetchICasasHTML(operation, slug, page)
        }
        const batch = listings
          .map((l) => mapToRaw(l, operation))
          .filter((p): p is RawProperty => p !== null)
        batch.forEach((p) => { p.region = p.region || region })
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
