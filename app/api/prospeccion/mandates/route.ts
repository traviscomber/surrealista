import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET() {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 })

  const { data, error } = await supabase
    .from("prospecting_mandates")
    .select("id,name,region,commune,species,min_ha,max_ha,status,last_candidate_count,last_run_at,created_at")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mandates: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const name = String(body.name || "").trim()
  const region = String(body.region || "").trim() || null
  const commune = String(body.commune || "").trim() || null
  const species = String(body.species || "").trim() || null
  const minHa = body.minHa == null || body.minHa === "" ? null : Number(body.minHa)
  const maxHa = body.maxHa == null || body.maxHa === "" ? null : Number(body.maxHa)

  if (!name) return NextResponse.json({ error: "El mandato necesita un nombre." }, { status: 400 })
  if (minHa != null && (!Number.isFinite(minHa) || minHa <= 0)) return NextResponse.json({ error: "Superficie mínima inválida." }, { status: 400 })
  if (maxHa != null && (!Number.isFinite(maxHa) || maxHa <= 0)) return NextResponse.json({ error: "Superficie máxima inválida." }, { status: 400 })
  if (minHa != null && maxHa != null && minHa > maxHa) return NextResponse.json({ error: "La superficie mínima no puede superar la máxima." }, { status: 400 })

  const { data, error } = await supabase
    .from("prospecting_mandates")
    .insert({ name, region, commune, species, min_ha: minHa, max_ha: maxHa, created_by: "internal-operator" })
    .select("id,name,region,commune,species,min_ha,max_ha,status,created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mandate: data }, { status: 201 })
}
