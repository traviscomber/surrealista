import { NextRequest, NextResponse } from 'next/server'
import { scrapeIChiloe } from '@/lib/scrapers/ichiloe-scraper'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const access = await validateScraperAccess(req)
    if (!access.authorized) return access.response

    const body = await req.json().catch(() => ({}))
    const result = await scrapeIChiloe({ pages: body.pages ?? 3, types: body.types })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
