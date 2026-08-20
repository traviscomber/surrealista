import { NextRequest, NextResponse } from 'next/server'
import { scrapeIncitiPublic } from '@/lib/scrapers/inciti-public-scraper'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'

export const maxDuration = 300

const PREVIEW_TEST_ARTICLE =
  'https://www.inciti.com/cl/prensa/2026-03-30-elmercurio-iva-vivienda-entrega-inmediata'

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const result = await scrapeIncitiPublic({
      articleUrl: PREVIEW_TEST_ARTICLE,
      persist: false,
    })

    const success = result.errors.length === 0
    return NextResponse.json(
      {
        success,
        testMode: true,
        ...result,
      },
      { status: success ? 200 : 207 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        testMode: true,
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
