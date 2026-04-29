import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      propertyId,
      visitDate,
      visitTime,
      duration,
      meetingPoint,
      notes,
      brokerEmail,
    } = body

    if (!clientId || !visitDate || !visitTime) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Create scheduled visit
    const { data: visit, error: visitError } = await supabase
      .from('scheduled_visits')
      .insert([
        {
          client_id: clientId,
          property_id: propertyId,
          visit_date: visitDate,
          visit_time: visitTime,
          duration_minutes: duration || 60,
          meeting_point: meetingPoint,
          notes,
          status: 'scheduled',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (visitError) throw visitError

    // Create pre-visit checklist items
    const checklistItems = [
      { title: 'Revisar documentación de la propiedad', completed: false },
      { title: 'Confirmar acceso a la propiedad', completed: false },
      { title: 'Preparar cámara/fotos', completed: false },
      { title: 'Llevar formulario de evaluación', completed: false },
      { title: 'Notificar al cliente 24h antes', completed: false },
    ]

    const checklistPromises = checklistItems.map((item) =>
      supabase.from('visit_checklists').insert([
        {
          visit_id: visit.id,
          title: item.title,
          completed: false,
        },
      ])
    )

    await Promise.all(checklistPromises)

    return NextResponse.json(
      {
        success: true,
        visit,
        message: 'Visita agendada exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error scheduling visit:', error)
    return NextResponse.json(
      { error: 'Error al agendar la visita' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId')

    let query = supabase
      .from('scheduled_visits')
      .select('*')
      .order('visit_date', { ascending: true })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: visits, error } = await query

    if (error) throw error

    return NextResponse.json({ visits }, { status: 200 })
  } catch (error) {
    console.error('Error fetching visits:', error)
    return NextResponse.json(
      { error: 'Error al obtener visitas' },
      { status: 500 }
    )
  }
}
