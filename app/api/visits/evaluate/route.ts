import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase server environment variables")
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { visitId, satisfaction, aspectsLiked, aspectsDisliked, offerProbability, followUpNotes } = body

    if (!visitId || satisfaction === undefined) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const numericSatisfaction = Number(satisfaction)
    if (!Number.isFinite(numericSatisfaction) || numericSatisfaction < 1 || numericSatisfaction > 5) {
      return NextResponse.json({ error: "Satisfacción inválida" }, { status: 400 })
    }

    const { data: evaluation, error: evalError } = await supabase
      .from("visit_evaluations")
      .insert([
        {
          visit_id: visitId,
          satisfaction_rating: numericSatisfaction,
          aspects_liked: aspectsLiked || null,
          aspects_disliked: aspectsDisliked || null,
          offer_probability: offerProbability || "medium",
          follow_up_notes: followUpNotes || null,
          evaluation_date: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (evalError) throw evalError

    const { error: visitUpdateError } = await supabase
      .from("scheduled_visits")
      .update({ status: "completed" })
      .eq("id", visitId)

    if (visitUpdateError) throw visitUpdateError

    return NextResponse.json({ success: true, evaluation, message: "Evaluación registrada exitosamente" }, { status: 201 })
  } catch (error) {
    console.error("Error creating evaluation:", error)
    return NextResponse.json({ error: "Error al registrar evaluación" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const visitId = request.nextUrl.searchParams.get("visitId")

    if (!visitId) return NextResponse.json({ error: "visitId requerido" }, { status: 400 })

    const { data: evaluation, error } = await supabase
      .from("visit_evaluations")
      .select("*")
      .eq("visit_id", visitId)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ evaluation: evaluation || null }, { status: 200 })
  } catch (error) {
    console.error("Error fetching evaluation:", error)
    return NextResponse.json({ error: "Error al obtener evaluación" }, { status: 500 })
  }
}
