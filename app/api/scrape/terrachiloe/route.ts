import { NextRequest, NextResponse } from 'next/server'
import { scrapeTerraChiloe } from '@/lib/scrapers/terrachiloe-portalterreno-scraper'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-internal-key')
  if (key !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  try {
    const result = await scrapeTerraChiloe({ pages: body.pages ?? 5 })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
