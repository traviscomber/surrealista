import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get basic stats
    const { data, error } = await supabase
      .from('kmz_collection')
      .select('metadata')
      .not('metadata->web_owner', 'is', null)
      .eq("metadata->>'web_owner'", 'null', { negate: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const owners = data || []

    const stats = {
      total: owners.length,
      high_confidence: owners.filter(
        (item: any) => parseFloat(item.metadata?.web_owner_confidence || 0) >= 0.85
      ).length,
      medium_confidence: owners.filter(
        (item: any) =>
          parseFloat(item.metadata?.web_owner_confidence || 0) >= 0.7 &&
          parseFloat(item.metadata?.web_owner_confidence || 0) < 0.85
      ).length,
      low_confidence: owners.filter(
        (item: any) => parseFloat(item.metadata?.web_owner_confidence || 0) < 0.7
      ).length,
      companies: owners.filter((item: any) => {
        const owner = item.metadata?.web_owner || ''
        return (
          owner.includes('SpA') ||
          owner.includes('Ltda') ||
          owner.includes('S.A') ||
          owner.includes('Ltd') ||
          owner.includes('Agrícola') ||
          owner.includes('Sociedad') ||
          owner.includes('AGRICOLA')
        )
      }).length,
      individuals: owners.filter((item: any) => {
        const owner = item.metadata?.web_owner || ''
        return !(
          owner.includes('SpA') ||
          owner.includes('Ltda') ||
          owner.includes('S.A') ||
          owner.includes('Ltd') ||
          owner.includes('Agrícola') ||
          owner.includes('Sociedad') ||
          owner.includes('AGRICOLA')
        )
      }).length,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
