import { NextRequest, NextResponse } from 'next/server'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'
import { scrapeCamposChile } from '@/lib/scrapers/camposchile-scraper'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const auth = await validateScraperAccess(req)
  if (!auth.authorized) return auth.response
  
  const body = await req.json().catch(() => ({}))
  try {
    const result = await scrapeCamposChile({ pages: body.pages ?? 2, regions: body.regions, types: body.types })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
