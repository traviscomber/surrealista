import { createServerClient } from '@/lib/supabase/server'
import { validateAdminAccess } from '@/lib/scrapers/route-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const authOk = await validateAdminAccess(req)
  if (!authOk) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { property_id, action } = await req.json() // action: 'add' | 'remove' | 'toggle'
  if (!property_id) return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })

  const supabase = await createServerClient()

  if (action === 'toggle') {
    // Check if exists
    const { data: existing } = await supabase.from('property_favorites').select('id').eq('property_id', property_id).single()
    if (existing) {
      // Remove
      const { error } = await supabase.from('property_favorites').delete().eq('property_id', property_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ action: 'removed', is_favorite: false })
    } else {
      // Add
      const { error } = await supabase.from('property_favorites').insert({ property_id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ action: 'added', is_favorite: true })
    }
  } else if (action === 'add') {
    const { error } = await supabase.from('property_favorites').insert({ property_id }).select().single()
    if (error && !error.message.includes('duplicate')) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'added', is_favorite: true })
  } else if (action === 'remove') {
    const { error } = await supabase.from('property_favorites').delete().eq('property_id', property_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'removed', is_favorite: false })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
