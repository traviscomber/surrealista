import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { lookupCirenByBounds, lookupExactCirenRol } from "@/lib/prospeccion/public-agri-intelligence"

export const runtime = "nodejs"
export const maxDuration = 300

type QueueRow = {
  id: string
  file_name: string
  region: string | null
  rol_numbers: string[] | null
  bounds: { west?: number; south?: number; east?: number; north?: number } | null
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase configuration")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function regionKey(value: unknown) {
  const normalized = normalizeText(value)
  if (!normalized) return ""
  if (normalized.includes("metropolitana")) return "metropolitana"
  if (normalized.includes("higgins")) return "ohiggins"
  if (normalized.includes("maule")) return "maule"
  if (normalized.includes("nuble")) return "nuble"
  if (normalized.includes("biobio") || normalized.includes("bio bio")) return "biobio"
  if (normalized.includes("araucania")) return "araucania"
  if (normalized.includes("los rios")) return "los-rios"
  if (normalized.includes("los lagos")) return "los-lagos"
  if (normalized.includes("aysen")) return "aysen"
  if (normalized.includes("valparaiso")) return "valparaiso"
  if (normalized.includes("coquimbo")) return "coquimbo"
  if (normalized.includes("atacama")) return "atacama"
  if (normalized.includes("tarapaca")) return "tarapaca"
  if (normalized.includes("arica")) return "arica-parinacota"
  return normalized
}

function normalizeCirenRol(raw: unknown) {
  const value = String(raw ?? "").trim()
  const parts = value.split("-").map((part) => part.trim()).filter(Boolean)
  if (parts.length < 2) return null
  const normalized = parts.slice(-2).join("-")
  return /^\d+-\d+$/.test(normalized) ? normalized : null
}

function fingerprint(kmzId: string, value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify({ kmzId, source: "CIREN IDE MINAGRI", field: "ciren_parcel_match", value }))
    .digest("hex")
}

async function processRow(row: QueueRow) {
  const targetRegion = regionKey(row.region)
  const rawRoles = row.rol_numbers ?? []
  const normalizedRoles = [...new Set(rawRoles.map(normalizeCirenRol).filter((value): value is string => Boolean(value)))]
  const roleResults = []

  for (const rol of normalizedRoles) {
    const lookup = await lookupExactCirenRol(rol)
    const territorial = lookup.candidates
      .filter((candidate) => regionKey(candidate.region) === targetRegion)
      .sort((a, b) => `${a.region}|${a.commune}|${a.id}`.localeCompare(`${b.region}|${b.commune}|${b.id}`))

    roleResults.push({
      rol,
      lookupStatus: lookup.status,
      searchedLayers: lookup.searchedLayers,
      failedLayers: lookup.failedLayers,
      allCandidateCount: lookup.candidates.length,
      territorialCandidateCount: territorial.length,
      candidates: territorial.map((candidate) => ({
        id: candidate.id,
        region: candidate.region,
        commune: candidate.commune,
        areaHa: candidate.areaHa,
        declaredSpecies: candidate.declaredSpecies,
        surveyYear: candidate.surveyYear,
        sourceUrl: candidate.sourceUrl,
        centroid: candidate.centroid,
      })),
    })
  }

  const exactPartial = roleResults.some((item) => item.lookupStatus === "partial")
  const exactAmbiguous = roleResults.some((item) => item.territorialCandidateCount > 1)
  const exactMatched = roleResults.some((item) => item.territorialCandidateCount === 1)

  const bounds = row.bounds && [row.bounds.west, row.bounds.south, row.bounds.east, row.bounds.north].every(Number.isFinite)
    ? {
        west: Number(row.bounds.west),
        south: Number(row.bounds.south),
        east: Number(row.bounds.east),
        north: Number(row.bounds.north),
      }
    : null

  const spatial = !exactMatched && !exactAmbiguous && bounds
    ? await lookupCirenByBounds(row.region, bounds)
    : null

  const spatialMatched = spatial?.status === "found" && spatial.candidates.length === 1
  const spatialAmbiguous = spatial?.status === "ambiguous" && spatial.candidates.length > 1
  const spatialPartial = spatial?.status === "partial"

  const status = exactPartial || spatialPartial
    ? "partial"
    : exactAmbiguous || spatialAmbiguous
      ? "ambiguous"
      : exactMatched || spatialMatched
        ? "matched"
        : "not_found"

  const matchMethod = exactMatched
    ? "exact_rol_region"
    : spatialMatched
      ? (spatial?.candidates[0]?.centerInsideBounds ? "spatial_centroid_inside" : "spatial_single_intersection")
      : exactAmbiguous
        ? "exact_rol_ambiguous"
        : spatialAmbiguous
          ? "spatial_ambiguous"
          : "none"

  const confidence = exactMatched
    ? 0.98
    : spatialMatched
      ? (spatial?.candidates[0]?.centerInsideBounds ? 0.9 : 0.82)
      : status === "ambiguous"
        ? 0.55
        : null

  const value = {
    kmzFileName: row.file_name,
    kmzRegion: row.region,
    rawRoles,
    normalizedRoles,
    roleResults,
    spatialResult: spatial ? {
      status: spatial.status,
      layerId: spatial.layerId,
      surveyYear: spatial.surveyYear,
      candidateCount: spatial.candidates.length,
      candidates: spatial.candidates.map((candidate) => ({
        id: candidate.id,
        rol: candidate.rol,
        region: candidate.region,
        commune: candidate.commune,
        areaHa: candidate.areaHa,
        declaredSpecies: candidate.declaredSpecies,
        surveyYear: candidate.surveyYear,
        sourceUrl: candidate.sourceUrl,
        centroid: candidate.centroid,
        centerInsideBounds: candidate.centerInsideBounds,
      })),
    } : null,
    matchMethod,
  }

  return {
    kmz_id: row.id,
    source: "CIREN IDE MINAGRI",
    source_kind: "external_official",
    field_name: "ciren_parcel_match",
    value_json: value,
    confidence,
    status,
    source_ref: "https://esri.ciren.cl/server/rest/services/IDEMINAGRI/CATASTRO_FRUTICOLA/MapServer",
    dataset_date: null,
    observed_at: new Date().toISOString(),
    metadata: {
      pipeline: "kmz-ciren-backfill-v2",
      matchMethod,
      targetRegion,
      normalizedRoleCount: normalizedRoles.length,
    },
    fingerprint: fingerprint(row.id, value),
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const db = admin()
  const requested = Number(req.nextUrl.searchParams.get("limit") ?? "20")
  const limit = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 20, 40))

  const { data, error } = await db
    .from("kmz_ciren_enrichment_queue")
    .select("id,file_name,region,rol_numbers,bounds")
    .limit(limit)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const rows = (data ?? []) as QueueRow[]
  const evidence = []
  const failures: Array<{ id: string; fileName: string; error: string }> = []

  for (let index = 0; index < rows.length; index += 4) {
    const chunk = rows.slice(index, index + 4)
    const settled = await Promise.all(chunk.map(async (row) => {
      try {
        return { row, evidence: await processRow(row), error: null as string | null }
      } catch (cause) {
        return {
          row,
          evidence: null,
          error: cause instanceof Error ? cause.message : String(cause),
        }
      }
    }))

    for (const item of settled) {
      if (item.evidence) evidence.push(item.evidence)
      else failures.push({ id: item.row.id, fileName: item.row.file_name, error: item.error ?? "Unknown error" })
    }
  }

  if (evidence.length) {
    const { error: insertError } = await db
      .from("kmz_enrichment_evidence")
      .upsert(evidence, { onConflict: "fingerprint", ignoreDuplicates: true })
    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message, processed: evidence.length }, { status: 500 })
    }
  }

  const counts = evidence.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    success: true,
    requested: limit,
    selected: rows.length,
    persisted: evidence.length,
    failures: failures.length,
    counts,
    failureSamples: failures.slice(0, 5),
  })
}
