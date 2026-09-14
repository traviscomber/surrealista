import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { findProspectingCandidatesBatch } from "@/lib/prospeccion/matching"

export const runtime = "nodejs"
export const maxDuration = 30

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
    .from("competitor_demand_signals")
    .select("id,source,min_ha,max_ha,crop,region,commune,transaction_type,production_status,raw_requirement,raw_detail,source_url,first_seen_at,last_seen_at")
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const signals = data ?? []
  const batches = await findProspectingCandidatesBatch(
    signals.map((signal) => ({
      id: signal.id,
      criteria: {
        region: signal.region,
        commune: signal.commune,
        species: signal.crop,
        minHa: signal.min_ha == null ? null : Number(signal.min_ha),
        maxHa: signal.max_ha == null ? null : Number(signal.max_ha),
      },
    })),
    100,
  )
  const matchesBySignal = new Map(batches.map((entry) => [entry.id, entry.candidates]))

  return NextResponse.json({
    signals: signals.map((signal) => {
      const candidates = matchesBySignal.get(signal.id) ?? []
      return {
        ...signal,
        min_ha: signal.min_ha == null ? null : Number(signal.min_ha),
        max_ha: signal.max_ha == null ? null : Number(signal.max_ha),
        candidate_count: candidates.length,
        top_candidate_score: candidates.length ? Number(candidates[0]?.prospecting_fit_score || 0) : null,
        top_candidate_ids: candidates.slice(0, 5).map((candidate) => candidate?.id).filter(Boolean),
      }
    }),
    methodology: "public-competitor-demand-crossed-with-sur-realista-opportunities",
    note: "Las señales son requerimientos publicados por terceros. Los candidatos se calculan con ubicación, superficie y señal de mercado; la especie aún no se valida por satélite.",
  })
}
