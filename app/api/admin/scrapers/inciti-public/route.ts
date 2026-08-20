import { NextRequest, NextResponse } from 'next/server'
import { scrapeIncitiPublic } from '@/lib/scrapers/inciti-public-scraper'
import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  try {
    const access = await validateScraperAccess(req)
    if (!access.authorized) return access.response

    const limitParam = Number(req.nextUrl.searchParams.get('limit') || '100')
    const limit = Math.max(1, Math.min(Number.isFinite(limitParam) ? limitParam : 100, 500))
    const supabase = getAdminClient()

    const [{ data, error }, { count, error: countError }] = await Promise.all([
      supabase
        .from('market_public_metrics')
        .select('id, source, article_url, article_title, published_at, region, commune, dataset, metric, period, value, unit, raw_label, scraped_at')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('market_public_metrics')
        .select('*', { count: 'exact', head: true }),
    ])

    if (error) throw error
    if (countError) throw countError

    return NextResponse.json({
      success: true,
      total: count ?? 0,
      rows: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await validateScraperAccess(req)
    if (!access.authorized) return access.response

    const body = await req.json().catch(() => ({}))
    const result = await scrapeIncitiPublic({
      articleUrl: typeof body.articleUrl === 'string' ? body.articleUrl : undefined,
      limit: typeof body.limit === 'number' ? body.limit : undefined,
      persist: body.persist === true,
    })

    const success = result.errors.length === 0
    return NextResponse.json(
      {
        success,
        ...result,
      },
      { status: success ? 200 : 207 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
