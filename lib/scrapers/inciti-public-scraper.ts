import { createHash } from 'node:crypto'
import * as cheerio from 'cheerio'
import { getAdminClient } from '@/lib/scrapers/base-scraper'

const INCITI_PRESS_URL = 'https://www.inciti.com/cl/prensa'
const INCITI_ORIGIN = 'https://www.inciti.com'
const SOURCE = 'inciti_public'

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

type PublicMetric = {
  source: string
  article_url: string
  article_title: string | null
  published_at: string | null
  region: string | null
  commune: string | null
  dataset: string
  metric: string
  period: string | null
  value: number | null
  unit: string | null
  raw_label: string | null
  metadata: Record<string, unknown>
  fingerprint: string
  scraped_at: string
}

type ScrapeArticleResult = {
  url: string
  title: string | null
  publishedAt: string | null
  metrics: PublicMetric[]
  errors: string[]
}

export type IncitiPublicScrapeResult = {
  source: typeof SOURCE
  articlesFound: number
  articlesProcessed: number
  metricsFound: number
  inserted: number
  updated: number
  skipped: number
  persisted: boolean
  articles: ScrapeArticleResult[]
  errors: string[]
  durationMs: number
}

type MetricContext = {
  region: string | null
  commune: string | null
  territoryLevel: 'region' | 'commune' | 'market' | 'unknown'
  operation: 'venta' | 'arriendo' | null
  propertyType: 'casa' | 'departamento' | 'multifamily' | 'vivienda' | null
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120)
}

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeText(value: string) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function parseSpanishDate(value: string): string | null {
  const match = cleanText(value)
    .toLowerCase()
    .match(/(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})/i)
  if (!match) return null

  const monthKey = match[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const month = MONTHS[monthKey]
  if (month === undefined) return null

  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[1])))
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function parsePeriod(value: string): string | null {
  const normalized = cleanText(value).toLowerCase()
  const match = normalized.match(/([a-záéíóúñ]+)\s+(\d{4})/i)
  if (!match) return null

  const monthKey = match[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const month = MONTHS[monthKey]
  if (month === undefined) return null

  return new Date(Date.UTC(Number(match[2]), month, 1)).toISOString().slice(0, 10)
}

function parseNumber(value: string): number | null {
  const raw = cleanText(value)
  if (!raw || raw === '-' || raw === '—') return null

  let numeric = raw
    .replace(/uf|clp|unidades?|viviendas?|hogares?|edificios?|m²|m2|%/gi, '')
    .replace(/\s/g, '')

  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(numeric)) {
    numeric = numeric.replace(/\./g, '').replace(',', '.')
  } else if (/^-?\d+(,\d+)$/.test(numeric)) {
    numeric = numeric.replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d+)$/.test(numeric) && !raw.includes(',')) {
    const decimalPart = numeric.split('.')[1]
    if (decimalPart.length === 3) numeric = numeric.replace('.', '')
  }

  numeric = numeric.replace(/[^0-9.-]/g, '')
  const parsed = Number(numeric)
  return Number.isFinite(parsed) ? parsed : null
}

function inferUnit(header: string, rawValue: string, metric?: string): string | null {
  const text = `${header} ${rawValue} ${metric || ''}`.toLowerCase()
  if (text.includes('%') || text.includes('variación') || text.includes('variacion') || text.includes('vacancia')) return 'percent'
  if (/uf\s*\/\s*m²|uf\s*\/\s*m2/i.test(text)) return 'UF/m2'
  if (/\buf\b/i.test(text)) return 'UF'
  if (/\bclp\b|\$/i.test(text)) return 'CLP'
  if (/m²|m2/i.test(text)) return 'm2'
  if (/stock|unidades?|viviendas?|hogares?|edificios?|disponibilidad|oferta/i.test(text)) return 'count'
  return null
}

function inferRegion(text: string): string | null {
  const normalized = normalizeText(text)
  if (normalized.includes('region metropolitana') || /\brm\b/i.test(text)) return 'Región Metropolitana'
  if (normalized.includes('valparaiso')) return 'Región de Valparaíso'
  if (normalized.includes('los lagos')) return 'Región de Los Lagos'
  if (normalized.includes('los rios')) return 'Región de Los Ríos'
  if (normalized.includes('biobio')) return 'Región del Biobío'
  if (normalized.includes('araucania')) return 'Región de La Araucanía'
  return null
}

function inferOperation(text: string): MetricContext['operation'] {
  const normalized = normalizeText(text)
  if (/arriendo|renta|alquiler/.test(normalized)) return 'arriendo'
  if (/venta|compraventa|venta de/.test(normalized)) return 'venta'
  return null
}

function inferPropertyType(text: string): MetricContext['propertyType'] {
  const normalized = normalizeText(text)
  if (/multifamily/.test(normalized)) return 'multifamily'
  if (/departamentos?|deptos?/.test(normalized)) return 'departamento'
  if (/casas?/.test(normalized)) return 'casa'
  if (/viviendas?|habitacional|residencial/.test(normalized)) return 'vivienda'
  return null
}

function inferTerritory(rowLabel: string, firstHeader: string, fallbackRegion: string | null): MetricContext {
  const header = normalizeText(firstHeader)
  const row = cleanText(rowLabel)
  const normalizedRow = normalizeText(row)
  const isAggregate = /^(total|otras? comunas?|rm|region metropolitana)$/i.test(row)

  if (/region/.test(header)) {
    return {
      region: isAggregate ? fallbackRegion : row,
      commune: null,
      territoryLevel: 'region',
      operation: null,
      propertyType: null,
    }
  }

  if (/comuna/.test(header)) {
    return {
      region: fallbackRegion,
      commune: isAggregate ? null : row,
      territoryLevel: isAggregate ? 'region' : 'commune',
      operation: null,
      propertyType: null,
    }
  }

  if (/santiago|nunoa|la florida|macul|cerrillos|puente alto|estacion central|providencia|las condes|vitacura|valparaiso|vina del mar/.test(normalizedRow)) {
    return {
      region: fallbackRegion,
      commune: isAggregate ? null : row,
      territoryLevel: isAggregate ? 'region' : 'commune',
      operation: null,
      propertyType: null,
    }
  }

  return {
    region: fallbackRegion,
    commune: null,
    territoryLevel: 'market',
    operation: null,
    propertyType: null,
  }
}

function semanticMetric(dataset: string, header: string, period: string | null) {
  const normalized = normalizeText(`${dataset} ${header}`)
  if (/variacion/.test(normalized)) return 'annual_change_pct'
  if (/vacancia/.test(normalized)) return 'vacancy_rate_pct'
  if (/uf\s*\/\s*m|uf_m/.test(normalized)) return 'price_uf_m2'
  if (/superficie/.test(normalized)) return 'avg_surface_m2'
  if (/recaudacion/.test(normalized)) return 'annual_tax_revenue'
  if (/contribuciones|viviendas afectadas|propiedades afectadas/.test(normalized)) return 'affected_properties'
  if (/edificios/.test(normalized)) return 'building_count'
  if (/disponibilidad|disponibles/.test(normalized)) return 'available_units'
  if (/stock|entrega inmediata/.test(normalized)) return period ? 'stock_units' : 'stock_units'
  if (/oferta|unidades/.test(normalized)) return 'available_units'
  if (/precio/.test(normalized) && /uf/.test(normalized)) return 'price_uf'
  return slugify(header) || 'value'
}

function stableFingerprint(parts: Array<string | null | undefined>) {
  return createHash('sha256')
    .update(parts.map((part) => part || '').join('|'))
    .digest('hex')
}

function normalizeArticleUrl(href: string): string | null {
  if (!href) return null
  try {
    const url = new URL(href, INCITI_ORIGIN)
    if (url.origin !== INCITI_ORIGIN) return null
    if (!url.pathname.startsWith('/cl/prensa/') && !url.pathname.startsWith('/servicios/prensa/')) return null
    if (url.pathname.endsWith('/prensa/') || url.pathname.endsWith('/prensa')) return null
    url.hash = ''
    url.search = ''
    return url.toString()
  } catch {
    return null
  }
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SurRealistaMarketResearch/1.0 (+https://sur-realista.vercel.app)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
  return response.text()
}

export async function discoverIncitiPressArticles(limit = 10): Promise<string[]> {
  const html = await fetchHtml(INCITI_PRESS_URL)
  const $ = cheerio.load(html)
  const urls = new Set<string>()

  $('a[href]').each((_, element) => {
    const normalized = normalizeArticleUrl($(element).attr('href') || '')
    if (normalized) urls.add(normalized)
  })

  return Array.from(urls).slice(0, Math.max(1, Math.min(limit, 30)))
}

function getDatasetName($: cheerio.CheerioAPI, table: any, index: number) {
  const heading = $(table).prevAll('h2, h3').first().text()
  return slugify(cleanText(heading)) || `table_${index + 1}`
}

function extractTableMetrics(
  $: cheerio.CheerioAPI,
  url: string,
  title: string | null,
  publishedAt: string | null,
  pageText: string,
  scrapedAt: string,
) {
  const metrics: PublicMetric[] = []
  const errors: string[] = []
  const fallbackRegion = inferRegion(`${title || ''} ${pageText}`)
  const articleOperation = inferOperation(`${title || ''} ${pageText}`)
  const articlePropertyType = inferPropertyType(`${title || ''} ${pageText}`)

  $('table').each((tableIndex, table) => {
    try {
      const headers = $(table).find('thead th').map((_, cell) => cleanText($(cell).text())).get()
      if (headers.length === 0) {
        $(table).find('tr').first().find('th, td').each((_, cell) => { headers.push(cleanText($(cell).text())) })
      }

      const dataset = getDatasetName($, table, tableIndex)
      const tableText = cleanText($(table).text())
      const tableOperation = inferOperation(`${dataset} ${tableText}`) || articleOperation
      const tablePropertyType = inferPropertyType(`${dataset} ${tableText}`) || articlePropertyType
      const rows = $(table).find('tbody tr').length > 0 ? $(table).find('tbody tr') : $(table).find('tr').slice(1)

      rows.each((rowIndex, row) => {
        const cells = $(row).find('th, td').map((_, cell) => cleanText($(cell).text())).get()
        if (cells.length < 2) return

        const rowLabel = cells[0] || `row_${rowIndex + 1}`
        const firstHeader = headers[0] || ''
        const territory = inferTerritory(rowLabel, firstHeader, fallbackRegion)
        const rowOperation = inferOperation(rowLabel) || tableOperation
        const rowPropertyType = inferPropertyType(rowLabel) || tablePropertyType

        for (let columnIndex = 1; columnIndex < cells.length; columnIndex++) {
          const rawValue = cells[columnIndex]
          const header = headers[columnIndex] || `column_${columnIndex + 1}`
          const value = parseNumber(rawValue)
          if (value === null) continue

          const period = parsePeriod(header)
          const metric = semanticMetric(dataset, header, period)
          const fingerprint = stableFingerprint([
            SOURCE,
            url,
            dataset,
            territory.region,
            territory.commune,
            rowPropertyType,
            rowOperation,
            metric,
            period,
          ])

          metrics.push({
            source: SOURCE,
            article_url: url,
            article_title: title,
            published_at: publishedAt,
            region: territory.region,
            commune: territory.commune,
            dataset,
            metric,
            period,
            value,
            unit: inferUnit(header, rawValue, metric) || (period ? 'count' : null),
            raw_label: rowLabel,
            metadata: {
              extractor: 'table',
              territoryLevel: territory.territoryLevel,
              operation: rowOperation,
              propertyType: rowPropertyType,
              tableIndex,
              rowIndex,
              columnIndex,
              header,
              rawValue,
              headers,
            },
            fingerprint,
            scraped_at: scrapedAt,
          })
        }
      })
    } catch (error) {
      errors.push(`table ${tableIndex + 1}: ${(error as Error).message}`)
    }
  })

  return { metrics, errors }
}

function extractNarrativeMetrics(
  url: string,
  title: string | null,
  publishedAt: string | null,
  pageText: string,
  scrapedAt: string,
) {
  const metrics: PublicMetric[] = []
  const normalized = cleanText(pageText)
  const region = inferRegion(`${title || ''} ${pageText}`)
  const operation = inferOperation(`${title || ''} ${pageText}`)
  const propertyType = inferPropertyType(`${title || ''} ${pageText}`)

  const pairPatterns: Array<{
    regex: RegExp
    metric: string
    unit: string
  }> = [
    { regex: /stock[^.]{0,80}?(?:de|desde)\s+([\d.]+)\s+(?:a|hasta)\s+([\d.]+)/gi, metric: 'stock_units', unit: 'count' },
    { regex: /vacancia[^.]{0,80}?(?:de|desde)\s+([\d.,]+)%?\s+(?:a|hasta)\s+([\d.,]+)%/gi, metric: 'vacancy_rate_pct', unit: 'percent' },
    { regex: /edificios?[^.]{0,80}?(?:de|desde)\s+([\d.]+)\s+(?:a|hasta)\s+([\d.]+)/gi, metric: 'building_count', unit: 'count' },
    { regex: /disponibilidad[^.]{0,80}?(?:de|desde)\s+([\d.]+)\s+(?:a|hasta)\s+([\d.]+)/gi, metric: 'available_units', unit: 'count' },
  ]

  for (const pattern of pairPatterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.regex.exec(normalized)) !== null) {
      const before = parseNumber(match[1])
      const after = parseNumber(match[2])
      if (before === null || after === null) continue

      for (const [position, value] of [['before', before], ['after', after]] as const) {
        const fingerprint = stableFingerprint([SOURCE, url, 'narrative', region, propertyType, operation, pattern.metric, position])
        metrics.push({
          source: SOURCE,
          article_url: url,
          article_title: title,
          published_at: publishedAt,
          region,
          commune: null,
          dataset: 'narrative_market_summary',
          metric: pattern.metric,
          period: null,
          value,
          unit: pattern.unit,
          raw_label: cleanText(match[0]),
          metadata: {
            extractor: 'narrative',
            position,
            operation,
            propertyType,
            territoryLevel: 'market',
            evidence: cleanText(match[0]),
          },
          fingerprint,
          scraped_at: scrapedAt,
        })
      }
    }
  }

  const communePattern = /(?:en|liderad[oa] por)\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ ]{2,30})\s+(?:con|alcanza(?:ndo)?)\s+([\d.]+)\s+unidades/gi
  let communeMatch: RegExpExecArray | null
  while ((communeMatch = communePattern.exec(pageText)) !== null) {
    const commune = cleanText(communeMatch[1])
    const value = parseNumber(communeMatch[2])
    if (value === null) continue
    const metric = 'stock_units'
    metrics.push({
      source: SOURCE,
      article_url: url,
      article_title: title,
      published_at: publishedAt,
      region,
      commune,
      dataset: 'narrative_commune_stock',
      metric,
      period: null,
      value,
      unit: 'count',
      raw_label: cleanText(communeMatch[0]),
      metadata: {
        extractor: 'narrative',
        operation,
        propertyType,
        territoryLevel: 'commune',
        evidence: cleanText(communeMatch[0]),
      },
      fingerprint: stableFingerprint([SOURCE, url, 'narrative_commune_stock', region, commune, propertyType, operation, metric]),
      scraped_at: scrapedAt,
    })
  }

  return metrics
}

function extractMetricsFromArticle(url: string, html: string): ScrapeArticleResult {
  const $ = cheerio.load(html)
  const title = cleanText($('h1').first().text()) || null
  const pageText = cleanText($('body').text())
  const publishedAt = parseSpanishDate(pageText)
  const scrapedAt = new Date().toISOString()

  const tableResult = extractTableMetrics($, url, title, publishedAt, pageText, scrapedAt)
  const narrativeMetrics = extractNarrativeMetrics(url, title, publishedAt, pageText, scrapedAt)
  const byFingerprint = new Map<string, PublicMetric>()

  for (const metric of [...tableResult.metrics, ...narrativeMetrics]) {
    byFingerprint.set(metric.fingerprint, metric)
  }

  return {
    url,
    title,
    publishedAt,
    metrics: Array.from(byFingerprint.values()),
    errors: tableResult.errors,
  }
}

async function persistMetrics(metrics: PublicMetric[]) {
  if (metrics.length === 0) return { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] }

  const supabase = getAdminClient()
  const errors: string[] = []
  let inserted = 0
  let updated = 0
  let skipped = 0
  const CHUNK = 100

  for (let i = 0; i < metrics.length; i += CHUNK) {
    const chunk = metrics.slice(i, i + CHUNK)
    const fingerprints = chunk.map((metric) => metric.fingerprint)
    const { data: existing, error: lookupError } = await supabase
      .from('market_public_metrics')
      .select('fingerprint')
      .in('fingerprint', fingerprints)

    if (lookupError) {
      errors.push(`lookup ${i}-${i + CHUNK}: ${lookupError.message}`)
      skipped += chunk.length
      continue
    }

    const existingSet = new Set((existing || []).map((row) => row.fingerprint))
    const { data, error } = await supabase
      .from('market_public_metrics')
      .upsert(chunk, { onConflict: 'fingerprint', ignoreDuplicates: false })
      .select('fingerprint')

    if (error) {
      errors.push(`upsert ${i}-${i + CHUNK}: ${error.message}`)
      skipped += chunk.length
      continue
    }

    const saved = new Set((data || []).map((row) => row.fingerprint))
    for (const metric of chunk) {
      if (!saved.has(metric.fingerprint)) skipped++
      else if (existingSet.has(metric.fingerprint)) updated++
      else inserted++
    }
  }

  return { inserted, updated, skipped, errors }
}

export async function scrapeIncitiPublic(options: {
  articleUrl?: string
  limit?: number
  persist?: boolean
} = {}): Promise<IncitiPublicScrapeResult> {
  const startedAt = Date.now()
  const errors: string[] = []
  const persist = options.persist === true

  let urls: string[] = []
  if (options.articleUrl) {
    const normalized = normalizeArticleUrl(options.articleUrl)
    if (!normalized) throw new Error('articleUrl must be a public Inciti press URL')
    urls = [normalized]
  } else {
    urls = await discoverIncitiPressArticles(options.limit ?? 8)
  }

  const articles: ScrapeArticleResult[] = []
  for (const url of urls) {
    try {
      const html = await fetchHtml(url)
      articles.push(extractMetricsFromArticle(url, html))
    } catch (error) {
      const message = `${url}: ${(error as Error).message}`
      errors.push(message)
      articles.push({ url, title: null, publishedAt: null, metrics: [], errors: [message] })
    }
  }

  const allMetrics = articles.flatMap((article) => article.metrics)
  let inserted = 0
  let updated = 0
  let skipped = 0

  if (persist) {
    const saved = await persistMetrics(allMetrics)
    inserted = saved.inserted
    updated = saved.updated
    skipped = saved.skipped
    errors.push(...saved.errors)
  }

  return {
    source: SOURCE,
    articlesFound: urls.length,
    articlesProcessed: articles.filter((article) => article.title).length,
    metricsFound: allMetrics.length,
    inserted,
    updated,
    skipped,
    persisted: persist,
    articles,
    errors,
    durationMs: Date.now() - startedAt,
  }
}
