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

type KmzEvidenceRow = {
  id: string
  owner?: string | null
  pic?: string | null
  pic_phone?: string | null
  pic_email?: string | null
  metadata?: Record<string, unknown> | null
  rol_numbers?: string[] | null
}

type TerritorialCoverage = {
  scope: "commune" | "region" | "unresolved"
  label: string | null
  kmz_count: number | null
  owner_identified_count: number | null
  owner_evidence_count: number | null
  contact_ready_count: number | null
  sampled: boolean
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value || 0)
}

function ownerEvidence(row: KmzEvidenceRow) {
  const metadata = (row.metadata || {}) as Record<string, any>
  const confirmedOwner = text(metadata.confirmed_owner)
  const candidateName = text(metadata.public_owner_candidate?.name)
  const confidence = Math.max(
    number(metadata.owner_confidence),
    number(metadata.public_owner_candidate?.confidence),
  )
  const manualOwner = text(row.owner)

  return {
    identified: Boolean(manualOwner || confirmedOwner || candidateName),
    evidenced: Boolean(manualOwner || confirmedOwner || (candidateName && confidence >= 0.75)),
  }
}

function summarizeCoverage(rows: KmzEvidenceRow[], scope: TerritorialCoverage["scope"], label: string | null, sampled: boolean): TerritorialCoverage {
  let ownerIdentified = 0
  let ownerEvidenceCount = 0
  let contactReady = 0

  for (const row of rows) {
    const evidence = ownerEvidence(row)
    if (evidence.identified) ownerIdentified += 1
    if (evidence.evidenced) ownerEvidenceCount += 1
    if (evidence.evidenced && (text(row.pic_phone) || text(row.pic_email))) contactReady += 1
  }

  return {
    scope,
    label,
    kmz_count: rows.length,
    owner_identified_count: ownerIdentified,
    owner_evidence_count: ownerEvidenceCount,
    contact_ready_count: contactReady,
    sampled,
  }
}

async function loadTerritorialCoverage(
  supabase: ReturnType<typeof createClient>,
  region: string | null,
  commune: string | null,
): Promise<TerritorialCoverage> {
  try {
    if (commune) {
      const { data: baseRows, error: rpcError } = await supabase.rpc("get_internal_kmz_by_commune", {
        p_commune: commune,
        p_limit: 200,
      })
      if (rpcError) throw rpcError

      const ids = (baseRows || []).map((row: { id?: string }) => row.id).filter(Boolean) as string[]
      if (!ids.length) return summarizeCoverage([], "commune", commune, false)

      const { data: detailedRows, error: detailError } = await supabase
        .from("kmz_collection")
        .select("id,owner,pic,pic_phone,pic_email,metadata,rol_numbers")
        .in("id", ids)
      if (detailError) throw detailError

      return summarizeCoverage((detailedRows || []) as KmzEvidenceRow[], "commune", commune, ids.length >= 200)
    }

    if (region) {
      const { data: regionRows, error: regionError } = await supabase
        .from("kmz_collection")
        .select("id,owner,pic,pic_phone,pic_email,metadata,rol_numbers")
        .eq("is_active", true)
        .ilike("region", region)
        .limit(500)
      if (regionError) throw regionError

      return summarizeCoverage((regionRows || []) as KmzEvidenceRow[], "region", region, (regionRows || []).length >= 500)
    }
  } catch (error) {
    console.error("[market-demand] territorial coverage unavailable", error)
  }

  return {
    scope: "unresolved",
    label: commune || region || null,
    kmz_count: null,
    owner_identified_count: null,
    owner_evidence_count: null,
    contact_ready_count: null,
    sampled: false,
  }
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

  const coverageCache = new Map<string, Promise<TerritorialCoverage>>()
  const coverageFor = (region: string | null, commune: string | null) => {
    const key = `${commune || ""}|${region || ""}`
    if (!coverageCache.has(key)) coverageCache.set(key, loadTerritorialCoverage(supabase, region, commune))
    return coverageCache.get(key)!
  }

  const enrichedSignals = await Promise.all(signals.map(async (signal) => {
    const candidates = matchesBySignal.get(signal.id) ?? []
    const territorialCoverage = await coverageFor(signal.region, signal.commune)
    return {
      ...signal,
      min_ha: signal.min_ha == null ? null : Number(signal.min_ha),
      max_ha: signal.max_ha == null ? null : Number(signal.max_ha),
      candidate_count: candidates.length,
      top_candidate_score: candidates.length ? Number(candidates[0]?.prospecting_fit_score || 0) : null,
      top_candidate_ids: candidates.slice(0, 5).map((candidate) => candidate?.id).filter(Boolean),
      territorial_coverage: territorialCoverage,
    }
  }))

  return NextResponse.json({
    signals: enrichedSignals,
    methodology: "public-competitor-demand-crossed-with-sur-realista-opportunities-and-territorial-owner-evidence",
    note: "Las señales son requerimientos publicados por terceros. Los candidatos se calculan con ubicación, superficie y señal de mercado. La cobertura KMZ corresponde al territorio de la comuna o región y no implica una vinculación 1:1 entre cada listing y cada KMZ. La especie aún no se valida por satélite.",
  })
}
