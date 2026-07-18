/**
 * iChiloe.cl scraper — WordPress site, HTML parsing.
 *
 * URL pattern: https://www.ichiloe.cl/propiedades/tipo-propiedad/{slug}/page/{n}/
 * Listing cards: <article class="property-item ...">
 *
 * Covers all property types listed on iChiloe, focused on Chiloé archipelago
 * and surrounding Los Lagos zone (parcelas, campos, casas, islas, terrenos).
 */
import * as cheerio from 'cheerio'
import type { RawProperty, ScrapeResult } from './base-scraper'
import { normaliseProperty, upsertProperties, logScrapeRun } from './base-scraper'

const BASE = 'https://www.ichiloe.cl'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-CL,es;q=0.9',
  Referer: BASE,
}

// All category slugs exposed by iChiloe
const PROPERTY_TYPE_SLUGS = [
  'parcela',
  'campo',
  'campo-agricola',
  'campo-forestal',
  'casa',
  'casa-rural',
  'casa-urbana',
  'isla',
  'loteo-parcelacion',
  'terreno',
  'comercial',
] as const

// Map slug → normalised property_type label
const SLUG_TO_TYPE: Record<string, string> = {
  parcela: 'parcela',
  campo: 'campo',
  'campo-agricola': 'campo agrícola',
  'campo-forestal': 'campo forestal',
  casa: 'casa',
  'casa-rural': 'casa rural',
  'casa-urbana': 'casa urbana',
  isla: 'isla',
  'loteo-parcelacion': 'loteo / parcelación',
  terreno: 'terreno',
  comercial: 'comercial',
}

async function fetchPage(typeSlug: string, page: number): Promise<string> {
  const url =
    page === 1
      ? `${BASE}/propiedades/tipo-propiedad/${typeSlug}/`
      : `${BASE}/propiedades/tipo-propiedad/${typeSlug}/page/${page}/`

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(18_000),
  })
  if (res.status === 404) return ''
  if (!res.ok) throw new Error(`iChiloe ${url} → ${res.status}`)
  return res.text()
}

interface ParsedCard {
  id: string
  title: string
  url: string
  priceRaw: string
  areaRaw: string
  address: string
  image: string
  typeSlug: string
}

/** Parse the real RealHomes cards used by iChiloe (`article.rh_list_card`). */
export function parsePropertyCards(html: string, typeSlug: string): ParsedCard[] {
  const $ = cheerio.load(html)
  const cards: ParsedCard[] = []

  $('article.rh_list_card, article[class*="property"]').each((_, element) => {
    const card = $(element)
    const propertyLink = card
      .find('a[href*="/propiedades/propiedad/"]')
      .first()
      .attr('href')
      ?.trim() ?? ''
    const slugMatch = propertyLink.match(/\/propiedad\/([^/?#]+)/)
    if (!slugMatch) return

    const title = card.find('h1, h2, h3, h4').first().text().replace(/\s+/g, ' ').trim()
    const text = card.text().replace(/\s+/g, ' ').trim()

    // Prefer currency-qualified values so title numbers are never mistaken for prices.
    const priceMatch = text.match(/(?:UF\s*[\d.,]+|\$\s*[\d.,]+|[\d.,]+\s*UF)\b/i)

    // iChiloe occasionally labels hectares as m2 in the card while the title says Ha.
    const titleArea = title.match(/([\d.,]+)\s*(ha|has|hect[aá]rea[s]?|m[²2])/i)
    const cardArea = text.match(/Área\s*([\d.,]+)\s*(ha|has|hect[aá]rea[s]?|m[²2])/i)
    const areaMatch = titleArea ?? cardArea

    const image = card.find('img').first().attr('data-src')
      ?? card.find('img').first().attr('src')
      ?? ''
    const location = card.find('[class*="location"], address').first().text().replace(/\s+/g, ' ').trim()

    cards.push({
      id: slugMatch[1],
      title: title || 'Propiedad iChiloe',
      url: propertyLink,
      priceRaw: priceMatch?.[0] ?? '',
      areaRaw: areaMatch ? `${areaMatch[1]} ${areaMatch[2]}` : '',
      address: location,
      image,
      typeSlug,
    })
  })

  return cards
}

/** Parse commune from address/title. iChiloe titles always end with commune name. */
function extractCommune(title: string, address: string): string | null {
  const COMMUNES = [
    'Ancud', 'Castro', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón',
    'Queilén', 'Quemchi', 'Quinchao', 'Quellón', 'Maullín', 'Los Muermos',
    'Puerto Montt', 'Puerto Varas', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar',
    'Llanquihue', 'Osorno', 'San Juan de la Costa', 'Puerto Octay',
  ]
  const src = `${title} ${address}`.toLowerCase()
  for (const c of COMMUNES) {
    if (src.includes(c.toLowerCase())) return c
  }
  return null
}

function cardToRaw(card: ParsedCard): RawProperty {
  const commune = extractCommune(card.title, card.address)
  return {
    externalId: `ichiloe-${card.id}`,
    source: 'ichiloe',
    title: card.title.slice(0, 400),
    priceRaw: card.priceRaw || null,
    areaRaw: card.areaRaw || null,
    propertyType: SLUG_TO_TYPE[card.typeSlug] ?? card.typeSlug,
    operation: 'venta', // iChiloe is mostly sales; arriendo is rare
    region: 'Región de Los Lagos',
    commune,
    address: card.address || commune || 'Chiloé',
    images: card.image ? [card.image] : [],
    sourceUrl: card.url.startsWith('http') ? card.url : `${BASE}${card.url}`,
  }
}

export async function scrapeIChiloe(opts: {
  types?: string[]
  pages?: number
} = {}): Promise<ScrapeResult> {
  const {
    types = [...PROPERTY_TYPE_SLUGS],
    pages = 3,
  } = opts

  const start = Date.now()
  const allRaw: RawProperty[] = []
  const errors: string[] = []

  for (const typeSlug of types) {
    for (let page = 1; page <= pages; page++) {
      try {
        const html = await fetchPage(typeSlug, page)
        if (!html) break // 404 = no more pages

        const cards = parsePropertyCards(html, typeSlug)
        if (cards.length === 0) break // empty page = done

        allRaw.push(...cards.map(cardToRaw))

        // Polite delay
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))
      } catch (err) {
        errors.push(`ichiloe/${typeSlug}/p${page}: ${(err as Error).message}`)
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
  await logScrapeRun('ichiloe', result, 'Región de Los Lagos')
  return { source: 'ichiloe', ...result }
}
