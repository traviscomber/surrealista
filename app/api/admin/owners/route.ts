import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Fetch all KMZ with web_owner
    const { data, error } = await supabase
      .from('kmz_collection')
      .select('id, file_name, metadata')
      .not('metadata->web_owner', 'is', null)
      .eq("metadata->>'web_owner'", 'null', { negate: true })
      .order('metadata->>web_owner_scraped_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch owners' }, { status: 500 })
    }

    // Transform data
    const owners = data?.map((item: any) => ({
      id: item.id,
      file_name: item.file_name || 'Unknown',
      owner: item.metadata?.web_owner || 'Unknown',
      confidence: parseFloat(item.metadata?.web_owner_confidence || 0),
      source: item.metadata?.web_owner ? 'web_search' : 'research',
      evidence_url: item.metadata?.web_owner_evidence_url,
      scraped_at: item.metadata?.web_owner_scraped_at || new Date().toISOString(),
    })) || []

    return NextResponse.json(owners)
  } catch (error) {
    console.error('Error in owners API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
