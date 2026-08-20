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
    .replace(/uf|clp|unidades?|viviendas?|hogares?|m²|m2|%/gi, '')
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

function inferUnit(header: string, rawValue: string): string | null {
  const text = `${header} ${rawValue}`.toLowerCase()
  if (text.includes('%') || text.includes('variación') || text.includes('variacion')) return 'percent'
  if (/\buf\b/i.test(text)) return 'UF'
  if (/\bclp\b|\$/i.test(text)) return 'CLP'
  if (/m²|m2/i.test(text)) return 'm2'
  if (/stock|unidades?|viviendas?|hogares?/i.test(text)) return 'count'
  return null
}

function inferRegion(text: string): string | null {
  const normalized = text.toLowerCase()
  if (normalized.includes('región metropolitana') || normalized.includes('region metropolitana') || /\brm\b/i.test(text)) {
    return 'Región Metropolitana'
  }
  if (normalized.includes('valparaíso') || normalized.includes('valparaiso')) return 'Región de Valparaíso'
  if (normalized.includes('los lagos')) return 'Región de Los Lagos'
  if (normalized.includes('los ríos') || normalized.includes('los rios')) return 'Región de Los Ríos'
  return null
}

function normalizeArticleUrl(href: string): string | null {
  if (!href) return null
  try {
    const url = new URL(href, INCITI_ORIGIN)
    if (url.origin !== INCITI_ORIGIN) return null
    if (!url.pathname.startsWith('/cl/prensa/')) return null
    if (url.pathname === '/cl/prensa/' || url.pathname === '/cl/prensa') return null
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

function getDatasetName($: cheerio.CheerioAPI, table: cheerio.Element, index: number) {
  const heading = $(table)
    .prevAll('h2, h3')
    .first()
    .text()
  return slugify(cleanText(heading)) || `table_${index + 1}`
}

function extractMetricsFromArticle(url: string, html: string): ScrapeArticleResult {
  const $ = cheerio.load(html)
  const title = cleanText($('h1').first().text()) || null
  const pageText = cleanText($('body').text())
  const publishedAt = parseSpanishDate(pageText)
  const region = inferRegion(`${title || ''} ${pageText}`)
  const metrics: PublicMetric[] = []
  const errors: string[] = []
  const scrapedAt = new Date().toISOString()

  $('table').each((tableIndex, table) => {
    try {
      const headers = $(table)
        .find('thead th')
        .map((_, cell) => cleanText($(cell).text()))
        .get()

      if (headers.length === 0) {
        $(table)
          .find('tr')
          .first()
          .find('th, td')
          .each((_, cell) => headers.push(cleanText($(cell).text())))
      }

      const dataset = getDatasetName($, table, tableIndex)
      const rows = $(table).find('tbody tr').length > 0 ? $(table).find('tbody tr') : $(table).find('tr').slice(1)

      rows.each((rowIndex, row) => {
        const cells = $(row)
          .find('th, td')
          .map((_, cell) => cleanText($(cell).text()))
          .get()

        if (cells.length < 2) return
        const rowLabel = cells[0] || `row_${rowIndex + 1}`
        const commune = /total|otras? comunas?/i.test(rowLabel) ? null : rowLabel

        for (let columnIndex = 1; columnIndex < cells.length; columnIndex++) {
          const rawValue = cells[columnIndex]
          const header = headers[columnIndex] || `column_${columnIndex + 1}`
          const value = parseNumber(rawValue)
          if (value === null) continue

          const period = parsePeriod(header)
          const metricBase = slugify(header) || `column_${columnIndex + 1}`
          const metric = period ? slugify(headers[0] ? `${headers[0]}_${metricBase}` : metricBase) : metricBase
          const fingerprint = createHash('sha256')
            .update([SOURCE, url, dataset, rowLabel, metric, period || '', String(value)].join('|'))
            .digest('hex')

          metrics.push({
            source: SOURCE,
            article_url: url,
            article_title: title,
            published_at: publishedAt,
            region,
            commune,
            dataset,
            metric,
            period,
            value,
            unit: inferUnit(header, rawValue),
            raw_label: rowLabel,
            metadata: {
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

  return { url, title, publishedAt, metrics, errors }
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
    if (!normalized) throw new Error('articleUrl must be a public Inciti /cl/prensa/* URL')
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
