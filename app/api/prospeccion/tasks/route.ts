import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(request: Request) {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const clientId = String(body.clientId || "").trim()
  const mandateId = String(body.mandateId || "").trim()
  const candidateId = String(body.candidateId || "").trim()

  if (!clientId || !mandateId || !candidateId) {
    return NextResponse.json({ error: "clientId, mandateId y candidateId son obligatorios." }, { status: 400 })
  }

  const [{ data: client, error: clientError }, { data: mandate, error: mandateError }, { data: candidate, error: candidateError }] = await Promise.all([
    supabase.from("clients").select("id,first_name,last_name,company_name").eq("id", clientId).single(),
    supabase.from("prospecting_mandates").select("id,name,client_id").eq("id", mandateId).single(),
    supabase.from("properties_external").select("id,title,region,commune,area_m2,source,source_url").eq("id", candidateId).single(),
  ])

  if (clientError || !client) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 })
  if (mandateError || !mandate) return NextResponse.json({ error: "Mandato no encontrado." }, { status: 404 })
  if (candidateError || !candidate) return NextResponse.json({ error: "Candidato no encontrado." }, { status: 404 })
  if (mandate.client_id && mandate.client_id !== clientId) {
    return NextResponse.json({ error: "El mandato está vinculado a otro cliente." }, { status: 409 })
  }

  const clientName = [client.first_name, client.last_name].filter(Boolean).join(" ") || client.company_name || "cliente"
  const areaHa = candidate.area_m2 ? Number(candidate.area_m2) / 10_000 : null
  const location = [candidate.commune, candidate.region].filter(Boolean).join(", ") || null
  const detail = [
    `Mandato: ${mandate.name}.`,
    `Cliente: ${clientName}.`,
    `Candidato: ${candidate.title || "Predio sin título"}.`,
    areaHa ? `Superficie: ${areaHa.toLocaleString("es-CL", { maximumFractionDigits: 2 })} ha.` : null,
    candidate.source ? `Fuente: ${candidate.source}.` : null,
    candidate.source_url ? `Evidencia: ${candidate.source_url}` : null,
  ].filter(Boolean).join(" ")

  const { data: existing } = await supabase
    .from("tasks")
    .select("id,title,status")
    .eq("related_to", "cliente")
    .eq("related_id", clientId)
    .contains("tags", ["prospeccion", `candidate:${candidateId}`])
    .in("status", ["pending", "in_progress"])
    .limit(1)

  if (existing?.length) {
    return NextResponse.json({ task: existing[0], created: false, duplicate: true })
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: `Revisar match · ${candidate.title || mandate.name}`,
      description: detail,
      status: "pending",
      priority: "high",
      created_by: "prospeccion",
      location,
      related_to: "cliente",
      related_id: clientId,
      tags: ["prospeccion", "nuevo-match", `mandate:${mandateId}`, `candidate:${candidateId}`],
    })
    .select("id,title,status,priority,created_at")
    .single()

  if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 })
  return NextResponse.json({ task, created: true, duplicate: false }, { status: 201 })
}
