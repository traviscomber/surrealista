import { NextRequest, NextResponse } from 'next/server'
import { scrapeIncitiDataHubSouth } from '@/lib/scrapers/inciti-data-hub-south-scraper'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET?.trim()
  const auth = req.headers.get('authorization')?.trim()
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await scrapeIncitiDataHubSouth({ persist: true })
    const success = result.errors.length === 0
    if (!success) console.error('[inciti-data-hub] completed with errors', result)
    else console.log('[inciti-data-hub] completed', result)
    return NextResponse.json({ success, ...result }, { status: success ? 200 : 503 })
  } catch (error) {
    console.error('[inciti-data-hub] failed', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
