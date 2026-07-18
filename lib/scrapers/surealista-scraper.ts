/**
 * Sur Realista scraper — surealista.cl
 *
 * Next.js site. Tries __NEXT_DATA__ JSON extraction first,
 * falls back to HTML card parsing.
 *
 * Covers: Valparaíso → Magallanes. Specialises in campos, fundos,
 * parcelas and rural/coastal properties.
 */
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun, normaliseRegion } from './base-scraper'

const BASE = 'https://surealista.cl'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-CL,es;q=0.9',
  Referer: BASE,
}

// Sur Realista covers broad south Chile — these are their focus regions
const FOCUS_REGIONS = [
  'Los Lagos',
  'Los Ríos',
  'La Araucanía',
  'Aysén',
  'Chiloé',
]

async function fetchListingPage(region: string, page: number): Promise<string> {
  // Try common Next.js URL patterns for this site
  const candidates = [
    `${BASE}/propiedades?region=${encodeURIComponent(region)}&page=${page}`,
    `${BASE}/buscar?region=${encodeURIComponent(region)}&pagina=${page}`,
    `${BASE}/campos?region=${encodeURIComponent(region)}&page=${page}`,
    page === 1 ? `${BASE}/propiedades` : `${BASE}/propiedades?page=${page}`,
  ]

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15_000),
        redirect: 'follow',
      })
      if (res.ok) return res.text()
    } catch { /* try next */ }
  }
  throw new Error(`surealista: could not fetch page ${page} for ${region}`)
}

interface SuRealistaListing {
  id?: string | number
  slug?: string
  titulo?: string
  title?: string
  nombre?: string
  precio?: string | number
  precio_uf?: string | number
  superficie?: string | number
  area?: string | number
  dormitorios?: number
  banos?: number
  tipo?: string
  tipo_propiedad?: string
  operacion?: string
  region?: string
  ciudad?: string
  comuna?: string
  descripcion?: string
  imagenes?: string[] | { url: string }[]
  imagen?: string
  url?: string
  lat?: number
  lng?: number
}

function extractFromNextData(html: string): SuRealistaListing[] {
  const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!ndMatch) return []
  try {
    const nd = JSON.parse(ndMatch[1])
    const props = nd?.props?.pageProps
    return (
      props?.propiedades ??
      props?.listings ??
      props?.properties ??
      props?.data?.propiedades ??
      props?.data?.listings ??
      []
    )
  } catch {
    return []
  }
}

function extractFromHTML(html: string): SuRealistaListing[] {
  const results: SuRealistaListing[] = []
  // Look for JSON-LD ItemList
  const jsonLdRe = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = jsonLdRe.exec(html)) !== null) {
    try {
      const d = JSON.parse(m[1])
      if (d?.['@type'] === 'ItemList') {
        for (const item of d.itemListElement ?? []) {
          const listing = item?.item ?? item
          const id = String(listing?.['@id'] ?? '').replace(/\D/g, '').slice(-10) || listing?.url?.split('/').filter(Boolean).pop()
          if (id) {
            results.push({
              id,
              titulo: listing?.name,
              precio: listing?.offers?.price,
              url: listing?.url,
              imagen: listing?.image ?? listing?.image?.[0],
            })
          }
        }
      }
    } catch { /* skip */ }
  }

  // Article/card fallback
  if (results.length === 0) {
    const cardRe = /<article[^>]*>([\s\S]*?)<\/article>/gi
    while ((m = cardRe.exec(html)) !== null) {
      const block = m[1]
      const hrefMatch = block.match(/href="([^"]*propiedad[^"]*)"/)
      if (!hrefMatch) continue
      const urlPath = hrefMatch[1]
      const id = urlPath.split('/').filter(Boolean).pop() ?? ''
      const titleMatch = block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i)
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : ''
      const priceMatch = block.match(/\$[\d.,\s]+|[\d.,]+\s*UF/i)
      results.push({
        id,
        titulo: title,
        precio: priceMatch ? priceMatch[0] : undefined,
        url: urlPath,
      })
    }
  }

  return results
}

function toRaw(listing: SuRealistaListing, fallbackRegion: string): RawProperty | null {
  const id = String(listing.id ?? listing.slug ?? '').trim()
  if (!id) return null

  const images = Array.isArray(listing.imagenes)
    ? listing.imagenes.map((i) => (typeof i === 'string' ? i : i.url))
    : listing.imagen ? [listing.imagen] : []

  const rawRegion = listing.region ?? fallbackRegion
  return {
    externalId: `surealista-${id}`,
    source: 'surealista',
    title: String(listing.titulo ?? listing.title ?? listing.nombre ?? 'Propiedad Sur').slice(0, 400),
    priceRaw: listing.precio_uf != null ? `${listing.precio_uf} UF` : (listing.precio ?? null),
    areaRaw: listing.superficie ?? listing.area ?? null,
    bedrooms: listing.dormitorios ?? null,
    bathrooms: listing.banos ?? null,
    propertyType: String(listing.tipo ?? listing.tipo_propiedad ?? '').toLowerCase() || null,
    operation: String(listing.operacion ?? 'venta').toLowerCase().includes('arriendo') ? 'arriendo' : 'venta',
    region: normaliseRegion(rawRegion),
    commune: listing.comuna ?? null,
    city: listing.ciudad ?? null,
    description: String(listing.descripcion ?? '').slice(0, 2000),
    images: images.slice(0, 10),
    sourceUrl: listing.url ? (listing.url.startsWith('http') ? listing.url : `${BASE}${listing.url}`) : null,
    lat: listing.lat ?? null,
    lng: listing.lng ?? null,
  }
}

export async function scrapeSurRealista(opts: {
  regions?: string[]
  pages?: number
} = {}): Promise<ScrapeResult> {
  const { regions = FOCUS_REGIONS, pages = 3 } = opts

  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []

  for (const region of regions) {
    for (let page = 1; page <= pages; page++) {
      try {
        const html = await fetchListingPage(region, page)
        const listings = extractFromNextData(html).length > 0
          ? extractFromNextData(html)
          : extractFromHTML(html)

        if (listings.length === 0) break

        const raws = listings.map((l) => toRaw(l, region)).filter((r): r is RawProperty => r !== null)
        allRaw.push(...raws)

        await new Promise((r) => setTimeout(r, 700 + Math.random() * 300))
      } catch (err) {
        errors.push(`surealista/${region}/p${page}: ${(err as Error).message}`)
        break
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
  await logScrapeRun('surealista', result)
  return { source: 'surealista', ...result }
}
