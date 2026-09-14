import { NextRequest, NextResponse } from 'next/server'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'
import { scrapeEvilasAgro } from '@/lib/scrapers/evilas-agro-scraper'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const auth = await validateScraperAccess(req)
  if (!auth.authorized) return auth.response

  const body = await req.json().catch(() => ({})) as { dryRun?: boolean }

  try {
    const result = await scrapeEvilasAgro({ dryRun: body.dryRun === true })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[evilas-agro] scrape failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'EVilas Agro scrape failed' }, { status: 500 })
  }
}
