import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const access = await validateScraperAccess(req)
  if (!access.authorized) return access.response

  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase.rpc('get_internal_kmz_market_coverage')
    if (error) throw error

    const rows = (data || []).map((row: any) => ({
      commune: String(row.commune || ''),
      kmzCount: Number(row.kmz_count) || 0,
      incitiMetricCount: Number(row.inciti_metric_count) || 0,
      hasIncitiData: row.has_inciti_data === true,
      lastIncitiScrape: row.last_inciti_scrape || null,
    }))

    const classifiedKmz = rows.reduce((sum: number, row: any) => sum + row.kmzCount, 0)
    const kmzWithInciti = rows.reduce((sum: number, row: any) => sum + (row.hasIncitiData ? row.kmzCount : 0), 0)

    return NextResponse.json({
      success: true,
      internalOnly: true,
      summary: {
        communes: rows.length,
        communesWithInciti: rows.filter((row: any) => row.hasIncitiData).length,
        classifiedKmz,
        kmzWithInciti,
        kmzWithoutInciti: classifiedKmz - kmzWithInciti,
        coveragePct: classifiedKmz ? Math.round((kmzWithInciti / classifiedKmz) * 1000) / 10 : 0,
      },
      rows,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
