import { NextRequest, NextResponse } from 'next/server'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'
import { scrapeICasas } from '@/lib/scrapers/icasas-scraper'
import { scrapeCamposChile } from '@/lib/scrapers/camposchile-scraper'
import { scrapeIChiloe } from '@/lib/scrapers/ichiloe-scraper'
import { scrapeTerraChiloe, scrapePortalTerreno } from '@/lib/scrapers/terrachiloe-portalterreno-scraper'
import { scrapeRura } from '@/lib/scrapers/rura-scraper'
import { scrapeGoPlaceIt } from '@/lib/scrapers/goplaceit-scraper'

export const maxDuration = 300

const SOUTH_REGIONS = [
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Lagos',
  'Región de Los Ríos',
  'Región de Aysén',
  'Región de Magallanes',
]

interface SouthExecutorResult {
  timestamp: string
  total_found: number
  total_inserted: number
  total_errors: number
  sources: Array<{
    source: string
    found: number
    inserted: number
    updated: number
    skipped: number
    errors: string[]
    durationMs: number
  }>
}

export async function POST(req: NextRequest) {
  const auth = await validateScraperAccess(req)
  if (!auth.authorized) return auth.response

  const start = Date.now()
  const results: SouthExecutorResult = {
    timestamp: new Date().toISOString(),
    total_found: 0,
    total_inserted: 0,
    total_errors: 0,
    sources: [],
  }

  try {
    const body = await req.json().catch(() => ({}))
    const pages = body.pages ?? 2

    // Execute all 7 south scrapers in parallel
    const scraperPromises = [
      scrapeICasas({ regions: SOUTH_REGIONS, pages, operation: 'venta' }),
      scrapeCamposChile({ pages }),
      scrapeIChiloe({ pages }),
      scrapeTerraChiloe({ pages }),
      scrapePortalTerreno({ pages }),
      scrapeRura({}),
      scrapeGoPlaceIt({ regions: SOUTH_REGIONS, pages, perPage: 25 }),
    ]

    const scraperResults = await Promise.all(scraperPromises)

    for (const res of scraperResults) {
      results.sources.push({
        source: res.source,
        found: res.found,
        inserted: res.inserted,
        updated: res.updated ?? 0,
        skipped: res.skipped ?? 0,
        errors: res.errors ?? [],
        durationMs: res.durationMs ?? 0,
      })
      results.total_found += res.found
      results.total_inserted += res.inserted
      results.total_errors += (res.errors?.length ?? 0)
    }

    results.sources.sort((a, b) => b.inserted - a.inserted)
    return NextResponse.json({
      ...results,
      durationMs: Date.now() - start,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
        total_found: 0,
        total_inserted: 0,
        total_errors: 1,
        sources: [],
      },
      { status: 500 }
    )
  }
}
