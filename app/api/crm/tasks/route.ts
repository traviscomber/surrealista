import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const status = searchParams.get('status')

  let query = supabase.from('client_tasks').select('*')

  if (clientId) query = query.eq('client_id', clientId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query.order('due_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('client_tasks')
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
    .from('client_tasks')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data?.[0] })
}
