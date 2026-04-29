import { createClient } from '@/lib/supabase/server'
import { ClientInteraction } from '@/lib/types/crm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')

  if (!clientId) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('client_interactions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('client_interactions')
    .insert([body])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data?.[0] }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  const { id, ...updates } = body

  const { data, error } = await supabase
    .from('client_interactions')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data?.[0] })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase.from('client_interactions').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
