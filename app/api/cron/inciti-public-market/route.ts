import { NextRequest, NextResponse } from 'next/server'
import { scrapeIncitiPublic } from '@/lib/scrapers/inciti-public-scraper'

export const maxDuration = 300

const CURATED_ARTICLES = [
  'https://www.inciti.com/servicios/prensa/2026-04-03-elmercurio-multifamily-50mil-unidades',
  'https://www.inciti.com/cl/prensa/2026-04-29-df-contribuciones-adultos-mayores',
  'https://www.inciti.com/cl/prensa/2026-03-30-elmercurio-iva-vivienda-entrega-inmediata',
  'https://www.inciti.com/cl/prensa/2025-12-06-emol-acceso-vivienda-uf',
  'https://www.inciti.com/cl/prensa/2026-07-10-emol-arrendatarios-rm-subsidio',
] as const

function isAuthorizedCronCall(request: NextRequest) {
  const authHeader = request.headers.get('authorization')?.trim()
  const expectedSecret = process.env.CRON_SECRET?.trim()

  if (!expectedSecret) {
    console.error('[inciti-cron] CRON_SECRET is not configured')
    return false
  }

  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  const requestId = `[inciti-public ${new Date().toISOString()}]`

  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const runs = [
      await scrapeIncitiPublic({
        limit: 20,
        persist: true,
      }),
    ]

    for (const articleUrl of CURATED_ARTICLES) {
      runs.push(
        await scrapeIncitiPublic({
          articleUrl,
          persist: true,
        }),
      )
    }

    const summary = runs.reduce(
      (acc, result) => {
        acc.articlesFound += result.articlesFound
        acc.articlesProcessed += result.articlesProcessed
        acc.metricsFound += result.metricsFound
        acc.inserted += result.inserted
        acc.updated += result.updated
        acc.skipped += result.skipped
        acc.errors.push(...result.errors)
        return acc
      },
      {
        articlesFound: 0,
        articlesProcessed: 0,
        metricsFound: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
      },
    )

    const success = summary.errors.length === 0
    const responseSummary = {
      articlesFound: summary.articlesFound,
      articlesProcessed: summary.articlesProcessed,
      metricsFound: summary.metricsFound,
      inserted: summary.inserted,
      updated: summary.updated,
      skipped: summary.skipped,
      curatedArticles: CURATED_ARTICLES.length,
      errors: summary.errors.length,
      durationMs: Date.now() - startedAt,
    }

    if (success) {
      console.log(requestId, 'Inciti public market scrape completed', responseSummary)
    } else {
      console.error(requestId, 'Inciti public market scrape completed with errors', {
        ...responseSummary,
        errors: summary.errors,
      })
    }

    return NextResponse.json(
      {
        success,
        timestamp: new Date().toISOString(),
        ...responseSummary,
        errors: summary.errors,
      },
      { status: success ? 200 : 503 },
    )
  } catch (error) {
    console.error(requestId, 'Inciti public market cron failed', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    )
  }
}
