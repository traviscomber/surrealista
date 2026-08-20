import { NextRequest, NextResponse } from 'next/server'
import { scrapeIncitiPublic } from '@/lib/scrapers/inciti-public-scraper'

export const maxDuration = 300

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
    const result = await scrapeIncitiPublic({
      limit: 8,
      persist: true,
    })

    const success = result.errors.length === 0
    const summary = {
      articlesFound: result.articlesFound,
      articlesProcessed: result.articlesProcessed,
      metricsFound: result.metricsFound,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.length,
      durationMs: Date.now() - startedAt,
    }

    if (success) {
      console.log(requestId, 'Inciti public market scrape completed', summary)
    } else {
      console.error(requestId, 'Inciti public market scrape completed with errors', {
        ...summary,
        errors: result.errors,
      })
    }

    return NextResponse.json(
      {
        success,
        timestamp: new Date().toISOString(),
        ...summary,
        errors: result.errors,
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
