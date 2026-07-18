import { NextRequest, NextResponse } from 'next/server'
import { scrapeCamposChile } from '@/lib/scrapers/camposchile-scraper'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-internal-key')
  if (key !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  try {
    const result = await scrapeCamposChile({ pages: body.pages ?? 2, regions: body.regions, types: body.types })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
