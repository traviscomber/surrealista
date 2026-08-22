import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'

export const maxDuration = 60

const SOURCE = 'inciti_data_hub_public'
const METRICS = [
  'population_total',
  'property_count_total',
  'sales_count_total',
  'housing_total',
  'housing_occupation_rate_pct',
  'housing_apartments',
  'residential_projects_total',
  'avg_persons_per_unit',
] as const

type MetricName = (typeof METRICS)[number]
type MetricRow = {
  commune: string | null
  region: string | null
  metric: string
  value: number | string | null
  unit: string | null
  scraped_at: string
  metadata: Record<string, unknown> | null
}

type CommuneProfile = {
  commune: string
  region: string | null
  population: number | null
  properties: number | null
  sales: number | null
  housing: number | null
  occupancyRatePct: number | null
  apartments: number | null
  residentialProjects: number | null
  avgPersonsPerUnit: number | null
  salesPer100Properties: number | null
  apartmentsSharePct: number | null
  marketDepthScore: number | null
  coveragePct: number
  scrapedAt: string | null
}

function numeric(value: number | string | null | undefined) {
  if (value == null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalize(value: number | null, min: number, max: number) {
  if (value == null) return null
  if (max <= min) return 1
  return (value - min) / (max - min)
}

export async function GET(req: NextRequest) {
  const access = await validateScraperAccess(req)
  if (!access.authorized) return access.response

  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('market_public_metrics')
      .select('commune, region, metric, value, unit, scraped_at, metadata')
      .eq('source', SOURCE)
      .in('metric', [...METRICS])
      .not('commune', 'is', null)

    if (error) throw error

    const byCommune = new Map<string, { region: string | null; metrics: Partial<Record<MetricName, MetricRow>>; scrapedAt: string | null }>()

    for (const row of (data || []) as MetricRow[]) {
      if (!row.commune || !METRICS.includes(row.metric as MetricName)) continue
      const current = byCommune.get(row.commune) || { region: row.region, metrics: {}, scrapedAt: null }
      const metric = row.metric as MetricName
      const existing = current.metrics[metric]
      if (!existing || new Date(row.scraped_at).getTime() > new Date(existing.scraped_at).getTime()) {
        current.metrics[metric] = row
      }
      if (!current.scrapedAt || new Date(row.scraped_at).getTime() > new Date(current.scrapedAt).getTime()) {
        current.scrapedAt = row.scraped_at
      }
      if (!current.region && row.region) current.region = row.region
      byCommune.set(row.commune, current)
    }

    const profiles: CommuneProfile[] = Array.from(byCommune.entries()).map(([commune, item]) => {
      const m = item.metrics
      const population = numeric(m.population_total?.value)
      const properties = numeric(m.property_count_total?.value)
      const sales = numeric(m.sales_count_total?.value)
      const housing = numeric(m.housing_total?.value)
      const occupancyRatePct = numeric(m.housing_occupation_rate_pct?.value)
      const apartments = numeric(m.housing_apartments?.value)
      const residentialProjects = numeric(m.residential_projects_total?.value)
      const avgPersonsPerUnit = numeric(m.avg_persons_per_unit?.value)
      const present = METRICS.filter((metric) => numeric(m[metric]?.value) != null).length

      return {
        commune,
        region: item.region,
        population,
        properties,
        sales,
        housing,
        occupancyRatePct,
        apartments,
        residentialProjects,
        avgPersonsPerUnit,
        salesPer100Properties: properties && sales != null ? (sales / properties) * 100 : null,
        apartmentsSharePct: housing && apartments != null ? (apartments / housing) * 100 : null,
        marketDepthScore: null,
        coveragePct: Math.round((present / METRICS.length) * 100),
        scrapedAt: item.scrapedAt,
      }
    })

    const scoringFields = ['population', 'properties', 'sales', 'residentialProjects'] as const
    const ranges = Object.fromEntries(scoringFields.map((field) => {
      const values = profiles.map((profile) => profile[field]).filter((value): value is number => value != null)
      return [field, { min: Math.min(...values), max: Math.max(...values) }]
    })) as Record<(typeof scoringFields)[number], { min: number; max: number }>

    const weights = { population: 0.25, properties: 0.25, sales: 0.30, residentialProjects: 0.20 }

    for (const profile of profiles) {
      const components = scoringFields.map((field) => {
        const range = ranges[field]
        const normalized = normalize(profile[field], range.min, range.max)
        return normalized == null ? null : normalized * weights[field]
      }).filter((value): value is number => value != null)
      const availableWeight = scoringFields.reduce((sum, field) => sum + (profile[field] == null ? 0 : weights[field]), 0)
      profile.marketDepthScore = availableWeight > 0 ? Math.round((components.reduce((a, b) => a + b, 0) / availableWeight) * 100) : null
    }

    profiles.sort((a, b) => (b.marketDepthScore ?? -1) - (a.marketDepthScore ?? -1))

    return NextResponse.json({
      success: true,
      internalOnly: true,
      source: SOURCE,
      generatedAt: new Date().toISOString(),
      formula: {
        label: 'Market Depth Score',
        note: 'Índice interno de profundidad de mercado; no es una tasación ni recomendación de inversión.',
        weights,
      },
      coverage: {
        communes: profiles.length,
        metrics: METRICS,
      },
      profiles,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
