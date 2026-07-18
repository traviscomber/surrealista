/**
 * GoPlaceIt scraper — uses the public JSON API (api.goplaceit.com/api/v4).
 *
 * Flow per southern region:
 *   1. GET /search/list  (columnar payload: ids, mts, prices, images, lat_lng)
 *   2. GET /properties/{id}  (rich detail: titulo, region, commune, precio + UF, dimension_terreno)
 *
 * tipo_propiedad=4 → "Terreno" (covers parcelas / campos / terrenos).
 */
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun } from './base-scraper'

const API = 'https://api.goplaceit.com/api/v4'
const SITE = 'https://www.goplaceit.com'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
  'Accept-Language': 'es-CL,es;q=0.9',
  Origin: SITE,
  Referer: `${SITE}/cl/mapa`,
}

const TERRENO_TYPE = 4

// Approximate bounding boxes: "SWlat,SWlng|NElat,NElng"
const REGION_VIEWPORTS: Record<string, string> = {
  'Región del Biobío': '-38.6,-73.7|-36.0,-71.0',
  'Región de La Araucanía': '-39.7,-73.8|-37.3,-70.9',
  'Región de Los Ríos': '-40.8,-73.8|-39.2,-71.4',
  'Región de Los Lagos': '-44.1,-74.9|-40.2,-71.4',
  'Región de Aysén': '-49.5,-75.8|-43.6,-71.0',
  'Región de Magallanes': '-56.0,-76.0|-48.5,-66.0',
}

interface GoPlaceItDetail {
  id: number
  titulo?: string
  precio?: number
  currency?: { codigo_moneda?: string }
  imagen?: string
  ubicacion?: unknown
  descripcion?: string
  dimension_terreno?: number
  dimension_propiedad?: number
  type?: { id: number; nombre: string }
  mode?: { id: number; nombre: string }
  region?: { id: number; nombre: string }
  commune?: { id: number; nombre: string }
  lat?: number
  lng?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchListIds(viewport: string, page: number, perPage: number): Promise<number[]> {
  const params = new URLSearchParams({
    country: 'cl',
    platform: 'web',
    's[tipo_propiedad][]': String(TERRENO_TYPE),
    's[sort]': 'featured',
    's[id_moneda_venta]': '2',
    's[id_moneda_arriendo]': '1',
    's[id_tipo_poligono]': '1',
    's[in_viewport]': viewport,
    page: String(page),
    per_page: String(perPage),
  })
  const res = await fetch(`${API}/search/list?${params}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`list ${res.status}`)
  const json = await res.json()
  const ids: number[] = json?.response?.ids ?? []
  return ids
}

async function fetchDetail(id: number): Promise<GoPlaceItDetail | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${API}/properties/${id}`, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) {
        await sleep(800)
        continue
      }
      const json = await res.json()
      // The detail payload is sometimes flat, sometimes wrapped in `response`.
      const detail: GoPlaceItDetail = json?.response ?? json
      if (detail?.titulo || detail?.id) return detail
    } catch {
      await sleep(800)
    }
  }
  return null
}

function mapDetailToRaw(id: number, detail: GoPlaceItDetail, fallbackRegion: string): RawProperty | null {
  const title = detail.titulo?.trim() || `Terreno en venta en ${fallbackRegion}`
  const operation = detail.mode?.id === 2 ? 'arriendo' : 'venta'
  const currency = detail.currency?.codigo_moneda || 'UF'
  const price = detail.precio != null ? `${detail.precio} ${currency}` : null
  const areaM2 = detail.dimension_terreno || detail.dimension_propiedad || null
  const image = detail.imagen?.replace(/-?\d+x\d+(?=\.[a-z]+$)/i, '') || detail.imagen

  return {
    externalId: `goplaceit-${id}`,
    source: 'goplaceit',
    title,
    priceRaw: price,
    areaRaw: areaM2 ? `${areaM2} m2` : null,
    propertyType: detail.type?.nombre?.toLowerCase() || 'terreno',
    operation,
    region: detail.region?.nombre || fallbackRegion,
    commune: detail.commune?.nombre || null,
    address: typeof detail.ubicacion === 'string' ? detail.ubicacion : null,
    lat: detail.lat ?? null,
    lng: detail.lng ?? null,
    description: detail.descripcion?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null,
    images: detail.imagen ? [image as string] : [],
    sourceUrl: `${SITE}/cl/propiedad/${operation}/${id}`,
  }
}

export async function scrapeGoPlaceIt(opts?: { pages?: number; perPage?: number; regions?: string[] }): Promise<ScrapeResult> {
  const start = Date.now()
  const pages = opts?.pages ?? 1
  const perPage = opts?.perPage ?? 30
  const regions = opts?.regions?.length ? opts.regions : Object.keys(REGION_VIEWPORTS)

  const allRaw: RawProperty[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  for (const region of regions) {
    const viewport = REGION_VIEWPORTS[region]
    if (!viewport) {
      errors.push(`goplaceit: región sin viewport → ${region}`)
      continue
    }

    const ids: number[] = []
    for (let page = 1; page <= pages; page++) {
      try {
        const batch = await fetchListIds(viewport, page, perPage)
        if (batch.length === 0) break
        ids.push(...batch)
        await sleep(400)
      } catch (err) {
        errors.push(`goplaceit/${region}/list p${page}: ${(err as Error).message}`)
        break
      }
    }

    for (const id of ids) {
      const externalId = `goplaceit-${id}`
      if (seen.has(externalId)) continue
      seen.add(externalId)

      const detail = await fetchDetail(id)
      await sleep(300)
      if (!detail) {
        errors.push(`goplaceit/${region}: detalle ${id} sin datos`)
        continue
      }
      const raw = mapDetailToRaw(id, detail, region)
      if (raw) allRaw.push(raw)
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
  await logScrapeRun('goplaceit', result)
  return { source: 'goplaceit', ...result }
}
