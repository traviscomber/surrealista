import { createSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createSupabaseClient()

    // Get summary stats
    const { data: summary, error: summaryError } = await supabase
      .from('kmz_collection')
      .select('region', { count: 'exact' })
      .eq('is_active', true)

    if (summaryError) throw summaryError

    const totalKMZ = summary?.length || 0
    const kmzWithoutRegion = summary?.filter(k => !k.region).length || 0
    const kmzWithRegion = totalKMZ - kmzWithoutRegion

    // Get list of KMZ without region (first 100)
    const { data: unassigned, error: unassignedError } = await supabase
      .from('kmz_collection')
      .select('id, file_name, created_at, placemarks_count, region')
      .eq('is_active', true)
      .is('region', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (unassignedError) throw unassignedError

    // Get summary by region
    const { data: byRegion, error: byRegionError } = await supabase
      .from('kmz_collection')
      .select('region, placemarks_count')
      .eq('is_active', true)
      .not('region', 'is', null)

    if (byRegionError) throw byRegionError

    // Group by region
    const regionSummary: Record<string, { fileCount: number; totalPlacemarks: number }> = {}
    byRegion?.forEach(kmz => {
      if (kmz.region) {
        if (!regionSummary[kmz.region]) {
          regionSummary[kmz.region] = { fileCount: 0, totalPlacemarks: 0 }
        }
        regionSummary[kmz.region].fileCount++
        regionSummary[kmz.region].totalPlacemarks += kmz.placemarks_count || 0
      }
    })

    return NextResponse.json({
      summary: {
        totalKMZ,
        kmzWithRegion,
        kmzWithoutRegion,
        percentageWithoutRegion: totalKMZ > 0 ? ((kmzWithoutRegion / totalKMZ) * 100).toFixed(2) + '%' : '0%',
      },
      unassignedKMZ: unassigned || [],
      byRegion: regionSummary,
    })
  } catch (error) {
    console.error('[v0] Error checking KMZ regions:', error)
    return NextResponse.json(
      { error: 'Failed to check KMZ region assignment' },
      { status: 500 }
    )
  }
}
