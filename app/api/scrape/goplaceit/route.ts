import { NextRequest, NextResponse } from 'next/server'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'
import { scrapeGoPlaceIt } from '@/lib/scrapers/goplaceit-scraper'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const auth = await validateScraperAccess(req)
  if (!auth.authorized) return auth.response

  const body = await req.json().catch(() => ({}))
  try {
    const result = await scrapeGoPlaceIt({
      pages: body.pages,
      perPage: body.perPage,
      regions: body.regions,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
