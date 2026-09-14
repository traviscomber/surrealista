import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { findProspectingCandidates } from "@/lib/prospeccion/matching"

export const runtime = "nodejs"
export const maxDuration = 30

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 })

  const { id } = await params
  const { data: mandate, error: mandateError } = await supabase
    .from("prospecting_mandates")
    .select("id,name,region,commune,species,min_ha,max_ha,status,last_candidate_ids,last_candidate_count,last_run_at")
    .eq("id", id)
    .single()

  if (mandateError || !mandate) return NextResponse.json({ error: "Mandato no encontrado." }, { status: 404 })
  if (mandate.status !== "active") return NextResponse.json({ error: "El mandato no está activo." }, { status: 409 })

  const candidates = await findProspectingCandidates({
    region: mandate.region,
    commune: mandate.commune,
    species: mandate.species,
    minHa: mandate.min_ha == null ? null : Number(mandate.min_ha),
    maxHa: mandate.max_ha == null ? null : Number(mandate.max_ha),
  }, 100)

  const previousIds = new Set<string>((mandate.last_candidate_ids || []).map(String))
  const currentIds = candidates.map((candidate) => String(candidate?.id || "")).filter(Boolean)
  const newCandidateIds = currentIds.filter((candidateId) => !previousIds.has(candidateId))
  const firstRun = !mandate.last_run_at
  const newCount = firstRun ? 0 : newCandidateIds.length
  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("prospecting_mandates")
    .update({
      last_candidate_ids: currentIds,
      last_candidate_count: currentIds.length,
      last_new_candidate_count: newCount,
      last_run_at: now,
      updated_at: now,
    })
    .eq("id", id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    mandate: {
      ...mandate,
      last_candidate_count: currentIds.length,
      last_new_candidate_count: newCount,
      last_run_at: now,
    },
    candidates,
    count: candidates.length,
    newCandidateIds: firstRun ? [] : newCandidateIds,
    newCount,
    firstRun,
  })
}
