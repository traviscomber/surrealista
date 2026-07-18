import { createClient } from '@/lib/supabase/server'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = await validateScraperAccess(req)
  if (!auth.authorized) return auth.response

  const { property_id, action } = await req.json() // action: 'add' | 'remove' | 'toggle'
  if (!property_id) return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })

  const supabase = await createClient()
  // Fixed UUID for admin-cli (generated from consistent string)
  const ADMIN_USER_ID = '00000000-0000-4000-8000-000000000000'

  if (action === 'toggle') {
    // Check if exists
    const { data: existing } = await supabase
      .from('property_favorites')
      .select('id')
      .eq('property_id', property_id)
      .eq('user_id', ADMIN_USER_ID)
      .single()

    if (existing) {
      // Remove
      const { error } = await supabase
        .from('property_favorites')
        .delete()
        .eq('property_id', property_id)
        .eq('user_id', ADMIN_USER_ID)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ action: 'removed', is_favorite: false })
    } else {
      // Add
      const { error } = await supabase.from('property_favorites').insert({ property_id, user_id: ADMIN_USER_ID })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ action: 'added', is_favorite: true })
    }
  } else if (action === 'add') {
    const { error } = await supabase.from('property_favorites').insert({ property_id, user_id: ADMIN_USER_ID })
    if (error && !error.message.includes('duplicate')) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'added', is_favorite: true })
  } else if (action === 'remove') {
    const { error } = await supabase
      .from('property_favorites')
      .delete()
      .eq('property_id', property_id)
      .eq('user_id', ADMIN_USER_ID)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'removed', is_favorite: false })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  try {
    const auth = await validateScraperAccess(req)
    console.log('[v0] GET favorites - auth:', auth)
    if (!auth.authorized) return auth.response

    const supabase = await createClient()
    const ADMIN_USER_ID = '00000000-0000-4000-8000-000000000000'

    const { data, error } = await supabase
      .from('property_favorites')
      .select('property_id')
      .eq('user_id', ADMIN_USER_ID)

    console.log('[v0] GET favorites - data:', data, 'error:', error?.message)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ favorites: data.map((f) => f.property_id) })
  } catch (err) {
    console.error('[v0] GET favorites error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
