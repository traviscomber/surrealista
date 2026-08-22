import { NextRequest, NextResponse } from 'next/server'
import { scrapeIncitiDataHub } from '@/lib/scrapers/inciti-data-hub-scraper'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const persist = req.nextUrl.searchParams.get('persist') === '1'
  const result = await scrapeIncitiDataHub({ persist })
  return NextResponse.json({ success: result.errors.length === 0, ...result }, { status: result.errors.length ? 207 : 200 })
}
