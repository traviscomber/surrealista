import { NextResponse } from 'next/server'
import { scrapeIncitiDataHubSouth } from '@/lib/scrapers/inciti-data-hub-south-scraper'

export const maxDuration = 300

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const result = await scrapeIncitiDataHubSouth({ persist: true })
    const success = result.errors.length === 0
    return NextResponse.json({ success, ...result }, { status: success ? 200 : 207 })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
