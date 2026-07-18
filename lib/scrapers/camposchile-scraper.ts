/**
 * CamposChile.cl scraper — campos, fundos, parcelas, terrenos rurales.
 *
 * Specialised portal for rural/agricultural properties across southern Chile.
 * URL pattern: https://www.camposchile.cl/propiedades/?tipo={tipo}&region={region}&pagina={n}
 * HTML-based, standard WP Real Estate theme.
 */
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun, normaliseRegion } from './base-scraper'

const BASE = 'https://www.camposchile.cl'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Referer: BASE,
}

const SOUTH_REGIONS = [
  'Los Lagos',
  'Los Ríos',
  'Aysén',
  'La Araucanía',
  'Biobío',
  'Maule',
]

const PROPERTY_TYPES = ['campo', 'parcela', 'terreno', 'fundo', 'isla']

async function fetchPage(type: string, region: string, page: number): Promise<string> {
  const urls = [
    `${BASE}/propiedades/?tipo=${encodeURIComponent(type)}&region=${encodeURIComponent(region)}&pagina=${page}`,
    `${BASE}/propiedades/?tipo=${encodeURIComponent(type)}&region=${encodeURIComponent(region)}&page=${page}`,
    `${BASE}/${type}s/?region=${encodeURIComponent(region)}&page=${page}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) })
      if (res.ok) return res.text()
      if (res.status === 404) return ''
    } catch { /* try next */ }
  }
  return ''
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

function parseCards(html: string, fallbackType: string, fallbackRegion: string): CamposListing[] {
  const results: CamposListing[] = []
  if (!html) return results

  // Try __NEXT_DATA__ first
  const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (ndMatch) {
    try {
      const nd = JSON.parse(ndMatch[1])
      const props = nd?.props?.pageProps
      const listings = props?.propiedades ?? props?.listings ?? props?.properties ?? []
      for (const l of listings) {
        const id = String(l.id ?? l.slug ?? '').trim()
        if (!id) continue
        results.push({
          id,
          title: String(l.titulo ?? l.title ?? 'Campo').slice(0, 300),
          url: l.url ?? l.slug ?? '',
          priceRaw: l.precio_uf != null ? `${l.precio_uf} UF` : String(l.precio ?? ''),
          areaRaw: String(l.superficie ?? l.area ?? ''),
          region: normaliseRegion(l.region ?? fallbackRegion) ?? fallbackRegion,
          commune: l.comuna ?? l.ciudad ?? '',
          type: l.tipo ?? fallbackType,
          image: Array.isArray(l.imagenes) ? l.imagenes[0] : (l.imagen ?? ''),
        })
      }
      if (results.length > 0) return results
    } catch { /* fallback to HTML */ }
  }

  // HTML card fallback
  const articleRe = /<(?:article|div)[^>]*class="[^"]*(?:property|listing|propiedad)[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi
  let m
  while ((m = articleRe.exec(html)) !== null) {
    const block = m[0]
    const hrefMatch = block.match(/href="([^"]+)"/)
    if (!hrefMatch) continue
    const url = hrefMatch[1]
    const id = url.split('/').filter(Boolean).pop() ?? ''
    if (!id || id.length < 2) continue

    const titleMatch = block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i)
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Propiedad'

    const priceMatch = block.match(/\$[\d.,\s]+|[\d.,]+\s*(?:UF|uf)/i)
    const areaMatch = block.match(/([\d.,]+\s*(?:m[²2]|ha[s]?|hect[aá]rea[s]?))/i)
    const imgMatch = block.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)

    results.push({
      id,
      title: title.slice(0, 300),
      url,
      priceRaw: priceMatch ? priceMatch[0] : '',
      areaRaw: areaMatch ? areaMatch[1] : '',
      region: fallbackRegion,
      commune: '',
      type: fallbackType,
      image: imgMatch ? imgMatch[1] : '',
    })
  }

  return results
}

export async function scrapeCamposChile(opts: {
  regions?: string[]
  types?: string[]
  pages?: number
} = {}): Promise<ScrapeResult> {
  const {
    regions = SOUTH_REGIONS,
    types = PROPERTY_TYPES,
    pages = 2,
  } = opts

  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  for (const region of regions) {
    for (const type of types) {
      for (let page = 1; page <= pages; page++) {
        try {
          const html = await fetchPage(type, region, page)
          if (!html) break

          const cards = parseCards(html, type, region)
          if (cards.length === 0) break

          for (const card of cards) {
            if (seen.has(card.id)) continue
            seen.add(card.id)
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
              sourceUrl: card.url.startsWith('http') ? card.url : `${BASE}${card.url}`,
            })
          }

          await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))
        } catch (err) {
          errors.push(`camposchile/${region}/${type}/p${page}: ${(err as Error).message}`)
          break
        }
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
  await logScrapeRun('camposchile', result)
  return { source: 'camposchile', ...result }
}
