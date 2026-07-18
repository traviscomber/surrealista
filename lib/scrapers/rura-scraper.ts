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

async function fetchRuraCatalog(): Promise<string> {
  const res = await fetch(`${BASE}/venta/parcelas-y-terrenos`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`rura ${BASE}/venta/parcelas-y-terrenos → ${res.status}`)
  return res.text()
}

function parseRuraProperties(html: string): RuraProperty[] {
  if (!html) return []
  const $ = cheerio.load(html)
  const properties: RuraProperty[] = []

  $('a[href*="/propiedad/"], a[href*="/proyecto/"]').each((_, element) => {
    const card = $(element)
    const href = card.attr('href') ?? ''
    if (!href.includes('/propiedad/')) return

    const parent = card.closest('[class*="p-4"], [class*="card"], article, [role="article"]')
    const title = parent.find('h3, h2, [class*="title"]').first().text().trim() || card.text().trim()
    const image = parent.find('img').first()
    const imageUrl = image.attr('src') || image.attr('data-lazy')
    const description = parent.find('p, [class*="description"]').first().text().trim()

    const locationText = parent.find('[class*="location"], [class*="region"], svg + div, .text-sm').text()
    const areaMatch = description.match(/([\d.,]+)\s*m²/) || title.match(/([\d.,]+)\s*m²/)
    const priceMatch = parent.text().match(/\$\s*([\d.,]+)|Desde\s*\$?\s*([\d.,]+)/) || card.text().match(/\$\s*([\d.,]+)/)
    const price = priceMatch ? `$${priceMatch[1] || priceMatch[2]}` : undefined

    if (!title || !href) return

    properties.push({
      id: href.split('/').pop() || `rura-${Math.random()}`,
      titulo: title.slice(0, 400),
      url: href.startsWith('http') ? href : `${BASE}${href}`,
      precio: price,
      area: areaMatch ? areaMatch[1] : undefined,
      ubicacion: locationText || '',
      imagen: imageUrl && imageUrl.startsWith('http') ? imageUrl : undefined,
      tipo: 'parcela',
      descripcion: description,
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
    commune: property.ubicacion ? property.ubicacion.split(',').pop()?.trim() ?? null : null,
    description: property.descripcion || null,
    images: property.imagen ? [property.imagen] : [],
    sourceUrl: property.url,
  }
}

export async function scrapeRura(opts?: { pages?: number; types?: string[] }): Promise<ScrapeResult> {
  const { pages = 2 } = opts || {}
  const allRaw: RawProperty[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  try {
    const html = await fetchRuraCatalog()
    const properties = parseRuraProperties(html)

    const batch = properties
      .map((property) => mapToRaw(property, 'venta'))
      .filter((property): property is RawProperty => property !== null)
      .filter((property) => {
        if (seen.has(property.externalId)) return false
        seen.add(property.externalId)
        return true
      })

    allRaw.push(...batch)

    if (pages > 1) {
      for (let page = 2; page <= pages; page++) {
        try {
          const pageUrl = `${BASE}/venta/parcelas-y-terrenos?pagina=${page}`
          const res = await fetch(pageUrl, {
            headers: HEADERS,
            signal: AbortSignal.timeout(60_000),
          })
          if (!res.ok) break
          const pageHtml = await res.text()
          const pageProps = parseRuraProperties(pageHtml)
            .map((p) => mapToRaw(p, 'venta'))
            .filter((p): p is RawProperty => p !== null)
            .filter((p) => {
              if (seen.has(p.externalId)) return false
              seen.add(p.externalId)
              return true
            })

          if (pageProps.length === 0) break
          allRaw.push(...pageProps)
          await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))
        } catch (err) {
          errors.push(`rura/page${page}: ${(err as Error).message}`)
          break
        }
      }
    }
  } catch (err) {
    errors.push(`rura/catalogo: ${(err as Error).message}`)
  }

  const normalized = allRaw.map(normaliseProperty).filter((p) => p !== null)

  return {
    scraperName: 'rura',
    timestamp: new Date().toISOString(),
    itemsScraped: allRaw.length,
    itemsInserted: 0,
    errors,
    ...(await upsertProperties(normalized, 'rura')),
  }
}
