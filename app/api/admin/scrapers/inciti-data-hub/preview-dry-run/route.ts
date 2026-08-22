import { NextResponse } from 'next/server'
import { scrapeIncitiDataHubSouth } from '@/lib/scrapers/inciti-data-hub-south-scraper'

export const maxDuration = 300

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ success: false, error: 'Preview only' }, { status: 404 })
  }

  const result = await scrapeIncitiDataHubSouth({ persist: false })
  return NextResponse.json({ success: result.errors.length === 0, result })
}
