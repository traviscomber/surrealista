import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase at runtime
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()

    const { data, error } = await supabase
      .from('quick_opportunities')
      .insert([
        {
          contact_name: body.contact_name,
          phone_number: body.phone_number,
          location: body.location,
          hectares: parseFloat(body.hectares),
          property_type: body.property_type,
          asking_price: body.asking_price ? parseFloat(body.asking_price) : null,
          notes: body.notes,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating opportunity:', error)
    return NextResponse.json(
      { error: 'Error al crear la oportunidad' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('quick_opportunities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error fetching opportunities:', error)
    return NextResponse.json(
      { error: 'Error al obtener oportunidades' },
      { status: 500 }
    )
  }
}
