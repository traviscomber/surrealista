/**
 * TerraChiloe + PortalTerreno scrapers
 *
 * terrachiloe.cl  — HTML/WP, terrenos and parcelas in Chiloé
 * portalterreno.cl — JSON API + HTML fallback, terrenos all Chile south
 *
 * Both are exported independently so the coordinator can run them separately.
 */
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun, normaliseRegion } from './base-scraper'

// ─── TerraChiloe ──────────────────────────────────────────────────────────────

const TC_BASE = 'https://www.terrachiloe.cl'
const TC_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  Referer: TC_BASE,
}

async function fetchTerraPage(page: number): Promise<string> {
  const url = page === 1 ? `${TC_BASE}/propiedades/` : `${TC_BASE}/propiedades/page/${page}/`
  const res = await fetch(url, { headers: TC_HEADERS, signal: AbortSignal.timeout(15_000) })
  if (res.status === 404) return ''
  if (!res.ok) throw new Error(`terrachiloe ${url} → ${res.status}`)
  return res.text()
}

function parseTerraCards(html: string): RawProperty[] {
  if (!html) return []
  const results: RawProperty[] = []

  const articleRe = /<article[^>]*>([\s\S]*?)<\/article>/gi
  let m
  while ((m = articleRe.exec(html)) !== null) {
    const block = m[0]
    const hrefM = block.match(/href="([^"]+)"/)
    if (!hrefM) continue
    const url = hrefM[1]
    const id = url.split('/').filter(Boolean).pop() ?? ''
    if (!id || id.length < 3) continue

    const titleM = block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i)
    const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : 'Terreno Chiloé'

    const priceM = block.match(/\$[\d.,\s]+|[\d.,]+\s*(?:UF|uf)/i)
    const areaM = block.match(/([\d.,]+\s*(?:m[²2]|ha[s]?|hect[aá]rea[s]?))/i)
    const imgM = block.match(/<img[^>]+src="([^"]+)"/i)

    // Try to extract commune from title (TerraChiloe includes location in title)
    const communeRe = /en\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+?)(?:\s*[-–,]|$)/i
    const communeM = title.match(communeRe)

    results.push({
      externalId: `terrachiloe-${id}`,
      source: 'terrachiloe',
      title: title.slice(0, 400),
      priceRaw: priceM ? priceM[0] : null,
      areaRaw: areaM ? areaM[1] : null,
      propertyType: 'terreno',
      operation: 'venta',
      region: 'Región de Los Lagos',
      commune: communeM ? communeM[1].trim() : null,
      images: imgM ? [imgM[1]] : [],
      sourceUrl: url.startsWith('http') ? url : `${TC_BASE}${url}`,
    })
  }

  return results
}

export async function scrapeTerraChiloe(opts: { pages?: number } = {}): Promise<ScrapeResult> {
  const { pages = 5 } = opts
  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []

  for (let page = 1; page <= pages; page++) {
    try {
      const html = await fetchTerraPage(page)
      if (!html) break
      const cards = parseTerraCards(html)
      if (cards.length === 0) break
      allRaw.push(...cards)
      await new Promise((r) => setTimeout(r, 600))
    } catch (err) {
      errors.push(`terrachiloe/p${page}: ${(err as Error).message}`)
      break
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
  await logScrapeRun('terrachiloe', result, 'Región de Los Lagos')
  return { source: 'terrachiloe', ...result }
}

// ─── PortalTerreno ────────────────────────────────────────────────────────────

const PT_BASE = 'https://www.portalterreno.com'
const PT_API = 'https://www.portalterreno.com/api'
const PT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  Accept: 'application/json, text/html',
  Referer: PT_BASE,
}

const PT_SOUTH_REGIONS = [
  'region-de-los-lagos',
  'region-de-los-rios',
  'region-de-la-araucania',
  'region-de-aysen',
  'region-de-magallanes',
]

interface PTListing {
  id?: string | number
  slug?: string
  titulo?: string
  title?: string
  precio?: string | number
  precio_uf?: string | number
  moneda?: string
  superficie?: string | number
  terreno?: string | number
  tipo?: string
  operacion?: string
  region?: string
  comuna?: string
  ciudad?: string
  lat?: number
  lng?: number
  descripcion?: string
  imagen?: string | string[]
  fotos?: string[]
  url?: string
}

async function fetchPTListings(regionSlug: string, page: number): Promise<PTListing[]> {
  // Try JSON API
  const apiUrl = `${PT_API}/propiedades?region=${regionSlug}&tipo=terreno&page=${page}&per_page=20`
  try {
    const res = await fetch(apiUrl, { headers: PT_HEADERS, signal: AbortSignal.timeout(12_000) })
    if (res.ok) {
      const json = await res.json()
      return json?.data ?? json?.propiedades ?? json?.results ?? []
    }
  } catch { /* fallback */ }

  // HTML fallback
  const url = `${PT_BASE}/terrenos/${regionSlug}?pagina=${page}`
  const res = await fetch(url, {
    headers: { ...PT_HEADERS, Accept: 'text/html' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`portalterreno ${url} → ${res.status}`)
  const html = await res.text()

  // __NEXT_DATA__
  const ndM = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (ndM) {
    try {
      const nd = JSON.parse(ndM[1])
      const p = nd?.props?.pageProps
      return p?.propiedades ?? p?.listings ?? p?.properties ?? []
    } catch { /* parse error */ }
  }

  return []
}

function ptToRaw(l: PTListing): RawProperty | null {
  const id = String(l.id ?? l.slug ?? '').trim()
  if (!id) return null

  const images = Array.isArray(l.fotos) ? l.fotos :
    Array.isArray(l.imagen) ? l.imagen :
    l.imagen ? [l.imagen as string] : []

  return {
    externalId: `portalterreno-${id}`,
    source: 'portalterreno',
    title: String(l.titulo ?? l.title ?? 'Terreno Sur Chile').slice(0, 400),
    priceRaw: l.precio_uf != null ? `${l.precio_uf} UF` : (l.precio ?? null),
    areaRaw: l.terreno ?? l.superficie ?? null,
    propertyType: String(l.tipo ?? 'terreno').toLowerCase(),
    operation: String(l.operacion ?? 'venta').toLowerCase().includes('arriendo') ? 'arriendo' : 'venta',
    region: normaliseRegion(l.region ?? ''),
    commune: l.comuna ?? null,
    city: l.ciudad ?? null,
    description: String(l.descripcion ?? '').slice(0, 2000),
    images: images.slice(0, 10),
    sourceUrl: l.url ? (l.url.startsWith('http') ? l.url : `${PT_BASE}${l.url}`) : null,
    lat: l.lat ?? null,
    lng: l.lng ?? null,
  }
}

export async function scrapePortalTerreno(opts: {
  regions?: string[]
  pages?: number
} = {}): Promise<ScrapeResult> {
  const { regions = PT_SOUTH_REGIONS, pages = 3 } = opts
  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []

  for (const region of regions) {
    for (let page = 1; page <= pages; page++) {
      try {
        const listings = await fetchPTListings(region, page)
        if (listings.length === 0) break
        const raws = listings.map(ptToRaw).filter((r): r is RawProperty => r !== null)
        allRaw.push(...raws)
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))
      } catch (err) {
        errors.push(`portalterreno/${region}/p${page}: ${(err as Error).message}`)
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
  await logScrapeRun('portalterreno', result)
  return { source: 'portalterreno', ...result }
}
