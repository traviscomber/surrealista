import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { runProspectingIntelligenceCore } from "@/lib/prospeccion/intelligence-core"
import { persistProspectingDecisionCases } from "@/lib/prospeccion/case-persistence"
import { normalizeProspectingCriteria } from "@/lib/prospeccion/normalization"

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
    .select("id,name,client_id,region,commune,species,min_ha,max_ha,status,last_candidate_ids,last_candidate_count,last_run_at")
    .eq("id", id)
    .single()

  if (mandateError || !mandate) return NextResponse.json({ error: "Mandato no encontrado." }, { status: 404 })
  if (mandate.status !== "active") return NextResponse.json({ error: "El mandato no está activo." }, { status: 409 })

  const criteria = normalizeProspectingCriteria({
    region: mandate.region,
    commune: mandate.commune,
    species: mandate.species,
    minHa: mandate.min_ha == null ? null : Number(mandate.min_ha),
    maxHa: mandate.max_ha == null ? null : Number(mandate.max_ha),
  })
  const core = await runProspectingIntelligenceCore(criteria, 100)

  const previousIds = new Set<string>((mandate.last_candidate_ids || []).map(String))
  const currentMarketIds = core.marketCandidates.map((candidate) => String(candidate?.id || "")).filter(Boolean)
  const currentCaseIds = core.cases.map((item) => item.id)
  const newCaseIds = currentCaseIds.filter((caseId) => !previousIds.has(caseId))
  const firstRun = !mandate.last_run_at
  const newCount = firstRun ? 0 : newCaseIds.length
  const now = new Date().toISOString()

  let persistence: Awaited<ReturnType<typeof persistProspectingDecisionCases>> | null = null
  try {
    persistence = await persistProspectingDecisionCases({
      supabase,
      mandateId: id,
      cases: core.cases,
      sourceRefs: core.sourceRefs,
    })
  } catch (error) {
    console.error("[Prospeccion] decision case persistence failed", error)
    return NextResponse.json({ error: "El Core obtuvo resultados, pero no pudo persistir/revalidar los Decision Cases." }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from("prospecting_mandates")
    .update({
      last_candidate_ids: currentCaseIds,
      last_candidate_count: currentCaseIds.length,
      last_new_candidate_count: newCount,
      last_run_at: now,
      updated_at: now,
    })
    .eq("id", id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    mandate: {
      ...mandate,
      last_candidate_count: currentCaseIds.length,
      last_new_candidate_count: newCount,
      last_run_at: now,
    },
    criteria,
    candidates: core.marketCandidates,
    count: core.marketCount,
    cases: core.cases,
    priorityCases: core.priorityCases,
    offMarketProspects: core.offMarketProspects,
    offMarketCount: core.offMarketCount,
    newCandidateIds: firstRun ? [] : newCaseIds,
    newCount,
    firstRun,
    persistence,
    groundedEvaluation: core.groundedEvaluation,
    sourceRefs: core.sourceRefs,
    specialistTrace: core.observedSpecialists,
    scopeFallback: core.scopeFallback,
    marketCandidateIds: currentMarketIds,
  })
}