import { NextRequest, NextResponse } from 'next/server'
import { scrapeIncitiDataHub } from '@/lib/scrapers/inciti-data-hub-scraper'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const access = await validateScraperAccess(req)
  if (!access.authorized) return access.response

  try {
    const body = await req.json().catch(() => ({}))
    const communeCodes = Array.isArray(body.communeCodes)
      ? body.communeCodes.filter((value: unknown): value is string => typeof value === 'string')
      : undefined
    const result = await scrapeIncitiDataHub({
      persist: body.persist === true,
      communeCodes,
    })
    const success = result.errors.length === 0
    return NextResponse.json({ success, coverage: 'verified', ...result }, { status: success ? 200 : 207 })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
