import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const access = await validateScraperAccess(req)
  if (!access.authorized) return access.response

  try {
    const commune = req.nextUrl.searchParams.get('commune')?.trim()
    const requestedLimit = Number(req.nextUrl.searchParams.get('limit') || '50')
    const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 50, 200))
    if (!commune) return NextResponse.json({ success: false, error: 'commune is required' }, { status: 400 })

    const supabase = getAdminClient()
    const { data, error } = await supabase.rpc('get_internal_kmz_by_commune', {
      p_commune: commune,
      p_limit: limit,
    })
    if (error) throw error

    return NextResponse.json({
      success: true,
      internalOnly: true,
      commune,
      count: data?.length || 0,
      rows: data || [],
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
