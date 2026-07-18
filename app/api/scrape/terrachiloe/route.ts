import { NextRequest, NextResponse } from 'next/server'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'
import { scrapeTerraChiloe } from '@/lib/scrapers/terrachiloe-portalterreno-scraper'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const auth = await validateScraperAccess(req)
  if (!auth.authorized) return auth.response
  
  const body = await req.json().catch(() => ({}))
  try {
    const result = await scrapeTerraChiloe({ pages: body.pages ?? 5 })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
