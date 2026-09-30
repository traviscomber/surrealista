import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const VISIT_COLUMNS = "id,client_id,property_id,visit_date,visit_time,duration_minutes,meeting_point,notes,status,created_at"

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const {
      clientId,
      propertyId,
      visitDate,
      visitTime,
      duration,
      meetingPoint,
      notes,
    } = body

    if (!clientId || !visitDate || !visitTime) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const { data: visit, error: visitError } = await supabase
      .from("scheduled_visits")
      .insert({
        client_id: clientId,
        property_id: propertyId,
        visit_date: visitDate,
        visit_time: visitTime,
        duration_minutes: duration || 60,
        meeting_point: meetingPoint,
        notes,
        status: "scheduled",
        created_at: new Date().toISOString(),
      })
      .select(VISIT_COLUMNS)
      .single()

    if (visitError) throw visitError

    const checklistRows = [
      "Revisar documentación de la propiedad",
      "Confirmar acceso a la propiedad",
      "Preparar cámara/fotos",
      "Llevar formulario de evaluación",
      "Notificar al cliente 24h antes",
    ].map((title) => ({
      visit_id: visit.id,
      title,
      completed: false,
    }))

    const { error: checklistError } = await supabase
      .from("visit_checklists")
      .insert(checklistRows)

    if (checklistError) {
      console.error("[visits] visit created but checklist insert failed", checklistError)
    }

    return NextResponse.json(
      {
        success: true,
        visit,
        checklistCreated: !checklistError,
        message: "Visita agendada exitosamente",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error scheduling visit:", error)
    return NextResponse.json({ error: "Error al agendar la visita" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const clientId = request.nextUrl.searchParams.get("clientId")
    const status = request.nextUrl.searchParams.get("status")
    const fromDate = request.nextUrl.searchParams.get("from")
    const toDate = request.nextUrl.searchParams.get("to")
    const rawLimit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "100", 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 100

    let query = supabase
      .from("scheduled_visits")
      .select(VISIT_COLUMNS)
      .order("visit_date", { ascending: true })
      .order("visit_time", { ascending: true })
      .limit(limit)

    if (clientId) query = query.eq("client_id", clientId)
    if (status) query = query.eq("status", status)
    if (fromDate) query = query.gte("visit_date", fromDate)
    if (toDate) query = query.lte("visit_date", toDate)

    const { data: visits, error } = await query
    if (error) throw error

    return NextResponse.json({ visits, limit }, { status: 200 })
  } catch (error) {
    console.error("Error fetching visits:", error)
    return NextResponse.json({ error: "Error al obtener visitas" }, { status: 500 })
  }
}
