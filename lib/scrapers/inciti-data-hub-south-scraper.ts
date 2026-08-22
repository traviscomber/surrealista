import { createHash } from 'node:crypto'
import { getAdminClient } from '@/lib/scrapers/base-scraper'

const SOURCE = 'inciti_data_hub_public'
const BASE_URL = 'https://api.inciti.com/api/lab'
const PARSER_VERSION = 2

export const SOUTHERN_COMMUNES = [
  // Región de Los Ríos
  { code: '10101', expectedName: 'Valdivia' },
  { code: '10105', expectedName: 'Futrono' },
  { code: '10108', expectedName: 'Panguipulli' },
  { code: '10109', expectedName: 'La Unión' },
  { code: '10111', expectedName: 'Río Bueno' },

  // Región de Los Lagos · Osorno / Llanquihue
  { code: '10201', expectedName: 'Osorno' },
  { code: '10301', expectedName: 'Puerto Montt' },
  { code: '10302', expectedName: 'Cochamó' },
  { code: '10303', expectedName: 'Puerto Varas' },
  { code: '10305', expectedName: 'Frutillar' },
  { code: '10306', expectedName: 'Llanquihue' },
  { code: '10309', expectedName: 'Calbuco' },

  // Región de Los Lagos · Chiloé / Palena
  { code: '10401', expectedName: 'Castro' },
  { code: '10404', expectedName: 'Quellón' },
  { code: '10406', expectedName: 'Ancud' },
  { code: '10408', expectedName: 'Dalcahue' },
  { code: '10501', expectedName: 'Chaitén' },
  { code: '10502', expectedName: 'Hualaihué' },

  // Región de Aysén
  { code: '11101', expectedName: 'Aysén' },
  { code: '11201', expectedName: 'Chile Chico' },
  { code: '11203', expectedName: 'Río Ibáñez' },
  { code: '11401', expectedName: 'Coyhaique' },
] as const

type JsonRecord = Record<string, any>

type Metric = {
  source: string
  article_url: string
  article_title: string
  published_at: string | null
  region: string | null
  commune: string | null
  dataset: string
  metric: string
  period: string | null
  value: number
  unit: string | null
  raw_label: string | null
  metadata: Record<string, unknown>
  fingerprint: string
  scraped_at: string
}

export type IncitiDataHubResult = {
  source: typeof SOURCE
  communesRequested: number
  communesProcessed: number
  metricsFound: number
  inserted: number
  updated: number
  skipped: number
  errors: string[]
  durationMs: number
  persisted: boolean
  byCommune: Array<{ commune: string; code: string; metrics: number; error?: string }>
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function fingerprint(parts: Array<string | number | null | undefined>) {
  return createHash('sha256').update(parts.map((part) => part ?? '').join('|')).digest('hex')
}

function periodFromYear(year: string | number | null | undefined) {
  if (year == null) return null
  const value = String(year)
  return /^\d{4}$/.test(value) ? `${value}-01-01` : null
}

async function fetchJson(url: string): Promise<JsonRecord> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SurRealistaMarketResearch/1.0 (+https://sur-realista.vercel.app)',
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function normalizeRegion(region: unknown) {
  const value = typeof region === 'string' ? region.trim() : ''
  if (/los lagos/i.test(value)) return 'Región de Los Lagos'
  if (/los r[ií]os/i.test(value)) return 'Región de Los Ríos'
  if (/ays[eé]n/i.test(value)) return 'Región de Aysén'
  return value || null
}

function metricFactory(payload: JsonRecord, endpoint: string, scrapedAt: string) {
  const commune = String(payload.name || '').trim()
  const region = normalizeRegion(payload.region)
  const incitiCode = String(payload.codcomuna || '')
  const siiCode = String(payload.codcomunaSII || '')
  const updatedAt = typeof payload.updatedAt === 'string' ? payload.updatedAt : null
  const common = {
    source: SOURCE,
    article_url: endpoint,
    article_title: `Inciti Data Hub · ${commune}`,
    published_at: updatedAt?.slice(0, 10) || null,
    region,
    commune,
    scraped_at: scrapedAt,
  }

  return (
    dataset: string,
    metric: string,
    value: unknown,
    unit: string | null,
    period: string | null = null,
    dimensions: Record<string, unknown> = {},
  ): Metric | null => {
    const numeric = asNumber(value)
    if (numeric === null) return null
    const dimensionKey = Object.entries(dimensions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}:${String(val)}`)
      .join('|')

    return {
      ...common,
      dataset,
      metric,
      period,
      value: numeric,
      unit,
      raw_label: null,
      metadata: {
        parserVersion: PARSER_VERSION,
        canonicalMetric: metric,
        sourceKind: 'public_data_hub',
        incitiDataHubCode: incitiCode,
        codcomunaSII: siiCode,
        codregion: payload.codregion ?? null,
        provincia: payload.provincia ?? null,
        sourceUpdatedAt: updatedAt,
        ...dimensions,
      },
      fingerprint: fingerprint([SOURCE, incitiCode, dataset, metric, period, dimensionKey]),
    }
  }
}

function extractMetrics(payload: JsonRecord, endpoint: string): Metric[] {
  const scrapedAt = new Date().toISOString()
  const make = metricFactory(payload, endpoint, scrapedAt)
  const metrics: Array<Metric | null> = []

  const demographics = payload.demographics || {}
  const population = demographics.population || {}
  const housing = demographics.housing || {}

  metrics.push(
    make('demographics_population', 'population_total', population.total, 'count'),
    make('demographics_population', 'population_men', population.men, 'count'),
    make('demographics_population', 'population_women', population.women, 'count'),
    make('demographics_housing', 'housing_total', housing.total, 'count'),
    make('demographics_housing', 'housing_occupied', housing.occupied, 'count'),
    make('demographics_housing', 'housing_houses', housing.houses, 'count'),
    make('demographics_housing', 'housing_apartments', housing.apartments, 'count'),
    make(
      'demographics_housing',
      'housing_occupation_rate_pct',
      asNumber(housing.occupationRate) == null ? null : Number(housing.occupationRate) * 100,
      'percent',
    ),
    make('demographics_housing', 'avg_persons_per_unit', housing.avgPersonsPerUnit, 'count'),
  )

  for (const [ageBand, value] of Object.entries(population)) {
    if (ageBand.startsWith('age')) {
      metrics.push(make('demographics_population_age', 'population_age_group', value, 'count', null, { ageBand }))
    }
  }

  for (const [gse, share] of Object.entries(demographics.gse || {})) {
    const number = asNumber(share)
    metrics.push(make('demographics_gse', 'gse_share_pct', number == null ? null : number * 100, 'percent', null, { gse }))
  }

  const properties = payload.properties || {}
  metrics.push(make('properties', 'property_count_total', properties.total, 'count'))
  for (const [propertyTypeCode, value] of Object.entries(properties.byType || {})) {
    metrics.push(make('properties_by_type', 'property_count', value, 'count', null, { propertyTypeCode }))
  }

  const sales = payload.sales || {}
  metrics.push(make('sales', 'sales_count_total', sales.total, 'count'))
  for (const [propertyTypeCode, value] of Object.entries(sales.byType || {})) {
    metrics.push(make('sales_by_type', 'sales_count', value, 'count', null, { propertyTypeCode }))
  }
  for (const [year, yearData] of Object.entries<JsonRecord>(sales.byYear || {})) {
    const period = periodFromYear(year)
    metrics.push(make('sales_by_year', 'sales_count', yearData?.total, 'count', period))
    for (const [propertyTypeCode, value] of Object.entries(yearData?.byType || {})) {
      metrics.push(make('sales_by_year_type', 'sales_count', value, 'count', period, { propertyTypeCode }))
    }
  }

  const markets = payload.markets || {}
  const residential = markets.residencial || {}
  metrics.push(make('market_residential', 'residential_projects_total', residential.totalProyectos, 'count'))
  for (const [propertyType, value] of Object.entries(residential.byTipo || {})) {
    metrics.push(make('market_residential_by_type', 'residential_projects', value, 'count', null, { propertyType }))
  }
  for (const [status, value] of Object.entries(residential.byEstado || {})) {
    metrics.push(make('market_residential_by_status', 'residential_projects', value, 'count', null, { status }))
  }

  return metrics.filter((metric): metric is Metric => metric !== null)
}

async function persistMetrics(metrics: Metric[]) {
  if (!metrics.length) return { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] }
  const supabase = getAdminClient()
  let inserted = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (let index = 0; index < metrics.length; index += 100) {
    const chunk = metrics.slice(index, index + 100)
    const keys = chunk.map((metric) => metric.fingerprint)
    const { data: existing, error: lookupError } = await supabase
      .from('market_public_metrics')
      .select('fingerprint')
      .in('fingerprint', keys)

    if (lookupError) {
      errors.push(lookupError.message)
      skipped += chunk.length
      continue
    }

    const existingSet = new Set((existing || []).map((row) => row.fingerprint))
    const { data, error } = await supabase
      .from('market_public_metrics')
      .upsert(chunk, { onConflict: 'fingerprint', ignoreDuplicates: false })
      .select('fingerprint')

    if (error) {
      errors.push(error.message)
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

export async function scrapeIncitiDataHubSouth(
  options: { persist?: boolean; communeCodes?: string[] } = {},
): Promise<IncitiDataHubResult> {
  const startedAt = Date.now()
  const persist = options.persist === true
  const requested = options.communeCodes?.length
    ? SOUTHERN_COMMUNES.filter((item) => options.communeCodes!.includes(item.code))
    : SOUTHERN_COMMUNES

  const allMetrics: Metric[] = []
  const errors: string[] = []
  const byCommune: IncitiDataHubResult['byCommune'] = []

  for (const target of requested) {
    const endpoint = `${BASE_URL}/get_comuna_data?codcomuna=${encodeURIComponent(target.code)}`
    try {
      const payload = await fetchJson(endpoint)
      const actualName = String(payload.name || '').trim()
      const actualCode = String(payload.codcomuna || '')
      if (actualName.toLocaleLowerCase('es-CL') !== target.expectedName.toLocaleLowerCase('es-CL') || actualCode !== target.code) {
        throw new Error(`catalog mismatch: expected ${target.expectedName}/${target.code}, got ${actualName}/${actualCode}`)
      }
      const metrics = extractMetrics(payload, endpoint)
      allMetrics.push(...metrics)
      byCommune.push({ commune: actualName, code: actualCode, metrics: metrics.length })
    } catch (error) {
      const message = `${target.expectedName}: ${(error as Error).message}`
      errors.push(message)
      byCommune.push({ commune: target.expectedName, code: target.code, metrics: 0, error: message })
    }
  }

  const saved = persist
    ? await persistMetrics(allMetrics)
    : { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] }
  errors.push(...saved.errors)

  return {
    source: SOURCE,
    communesRequested: requested.length,
    communesProcessed: byCommune.filter((item) => !item.error).length,
    metricsFound: allMetrics.length,
    inserted: saved.inserted,
    updated: saved.updated,
    skipped: saved.skipped,
    errors,
    durationMs: Date.now() - startedAt,
    persisted: persist,
    byCommune,
  }
}
