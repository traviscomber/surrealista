import { NextRequest, NextResponse } from 'next/server'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'
import { scrapeTocToc } from '@/lib/scrapers/toctoc-scraper'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const auth = await validateScraperAccess(req)
  if (!auth.authorized) return auth.response

  try {
    const body = await req.json().catch(() => ({}))
    const result = await scrapeTocToc({
      regions: body.regions,
      operation: body.operation ?? 'venta',
      pages: body.pages ?? 2,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { source: 'toctoc', error: (err as Error).message, found: 0, inserted: 0 },
      { status: 500 }
    )
  }
}
