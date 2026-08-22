import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const access = await validateScraperAccess(req)
  if (!access.authorized) return access.response

  try {
    const supabase = getAdminClient()
    const [coverageResult, totalResult] = await Promise.all([
      supabase.rpc('get_internal_kmz_market_coverage'),
      supabase.from('kmz_collection').select('id', { count: 'exact', head: true }),
    ])

    if (coverageResult.error) throw coverageResult.error
    if (totalResult.error) throw totalResult.error

    const rows = (coverageResult.data || []).map((row: any) => ({
      commune: String(row.commune || ''),
      kmzCount: Number(row.kmz_count) || 0,
      incitiMetricCount: Number(row.inciti_metric_count) || 0,
      hasIncitiData: row.has_inciti_data === true,
      lastIncitiScrape: row.last_inciti_scrape || null,
    }))

    const totalKmz = totalResult.count || 0
    const classifiedKmz = rows.reduce((sum: number, row: any) => sum + row.kmzCount, 0)
    const kmzWithInciti = rows.reduce((sum: number, row: any) => sum + (row.hasIncitiData ? row.kmzCount : 0), 0)
    const unresolvedKmz = Math.max(totalKmz - classifiedKmz, 0)

    return NextResponse.json({
      success: true,
      internalOnly: true,
      summary: {
        totalKmz,
        classifiedKmz,
        unresolvedKmz,
        classificationPct: totalKmz ? Math.round((classifiedKmz / totalKmz) * 1000) / 10 : 0,
        communes: rows.length,
        communesWithInciti: rows.filter((row: any) => row.hasIncitiData).length,
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
