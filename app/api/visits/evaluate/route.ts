import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const {
      visitId,
      satisfaction,
      aspectsLiked,
      aspectsDisliked,
      offerProbability,
      followUpNotes,
    } = body

    if (!visitId || satisfaction === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Create post-visit evaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('visit_evaluations')
      .insert([
        {
          visit_id: visitId,
          satisfaction_rating: satisfaction,
          aspects_liked: aspectsLiked,
          aspects_disliked: aspectsDisliked,
          offer_probability: offerProbability || 'medium',
          follow_up_notes: followUpNotes,
          evaluation_date: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (evalError) throw evalError

    // Update visit status to completed
    await supabase
      .from('scheduled_visits')
      .update({ status: 'completed' })
      .eq('id', visitId)

    return NextResponse.json(
      {
        success: true,
        evaluation,
        message: 'Evaluación registrada exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating evaluation:', error)
    return NextResponse.json(
      { error: 'Error al registrar evaluación' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const visitId = request.nextUrl.searchParams.get('visitId')

    if (!visitId) {
      return NextResponse.json(
        { error: 'visitId requerido' },
        { status: 400 }
      )
    }

    const { data: evaluation, error } = await supabase
      .from('visit_evaluations')
      .select('*')
      .eq('visit_id', visitId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({ evaluation: evaluation || null }, { status: 200 })
  } catch (error) {
    console.error('Error fetching evaluation:', error)
    return NextResponse.json(
      { error: 'Error al obtener evaluación' },
      { status: 500 }
    )
  }
}
