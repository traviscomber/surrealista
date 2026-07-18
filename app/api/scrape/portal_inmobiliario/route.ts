import { NextRequest, NextResponse } from 'next/server'
import { scrapePortalInmobiliario } from '@/lib/scrapers/portal-inmobiliario-scraper'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const internalKey = req.headers.get('x-internal-key')
  if (internalKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const result = await scrapePortalInmobiliario({
      regions: body.regions,
      operation: body.operation ?? 'venta',
      maxPerQuery: body.maxPerQuery ?? 48,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { source: 'portal_inmobiliario', error: (err as Error).message, found: 0, inserted: 0 },
      { status: 500 }
    )
  }
}
