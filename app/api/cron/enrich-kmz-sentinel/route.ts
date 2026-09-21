import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { mapWithConcurrency, resolveSentinelCentroidTarget } from "@/lib/prospeccion/sentinel-backfill"
import { syncSentinelMemory } from "@/lib/prospeccion/sentinel-memory"
import { getSentinelParcelEvidence } from "@/lib/prospeccion/sentinel-parcel-analysis"

export const runtime = "nodejs"
export const maxDuration = 300

type QueueRow = {
  id: string
  file_name: string
  region: string | null
  rol_numbers: string[] | null
  metadata: Record<string, unknown> | null
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase admin client is not configured")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function fingerprint(kmzId: string, rol: string, observedAt: string) {
  const day = observedAt.slice(0, 10)
  return createHash("sha256")
    .update(JSON.stringify({ pipeline: "kmz-sentinel-centroid-v1", kmzId, rol, day }))
    .digest("hex")
}

async function processRow(row: QueueRow) {
  const target = resolveSentinelCentroidTarget(row.metadata)
  if (!target) throw new Error("SII point target is incomplete")

  const sentinel = await getSentinelParcelEvidence({ centroid: target.centroid, polygon: null })
  const memory = sentinel.status === "available"
    ? await syncSentinelMemory({
        rol: target.rol,
        commune: target.commune,
        geometryMode: "centroid_fallback",
        centroid: target.centroid,
        polygon: null,
        observations: sentinel.observations,
      })
    : null

  const observedAt = new Date().toISOString()
  return {
    kmz_id: row.id,
    source: "Copernicus Data Space / Sentinel-2 L2A",
    source_kind: "external_official",
    field_name: "sentinel_centroid_fallback",
    value_json: {
      rol: target.rol,
      commune: target.commune,
      centroid: target.centroid,
      geometryMode: sentinel.geometryMode,
      summary: sentinel.summary,
      temporal: sentinel.temporal,
      baseline: sentinel.baseline,
      classification: sentinel.classification,
      memory: memory ? {
        available: memory.available,
        persisted: memory.persisted,
        rowCount: memory.rowCount,
        historyFrom: memory.historyFrom,
        historyTo: memory.historyTo,
        geometryFingerprint: memory.geometryFingerprint,
      } : null,
      note: sentinel.note,
    },
    confidence: sentinel.status === "available" ? 0.85 : null,
    status: sentinel.status,
    source_ref: sentinel.sourceUrl,
    dataset_date: null,
    observed_at: observedAt,
    metadata: {
      pipeline: "kmz-sentinel-centroid-v1",
      geometryMode: sentinel.geometryMode,
      targetSource: target.source,
      observationCount: sentinel.summary.observationCount,
      satelliteVerified: sentinel.satelliteVerified,
    },
    fingerprint: fingerprint(row.id, target.rol, observedAt),
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const db = admin()
  const requested = Number(req.nextUrl.searchParams.get("limit") ?? "12")
  const limit = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 12, 12))

  const { data, error } = await db
    .from("kmz_sentinel_centroid_queue")
    .select("id,file_name,region,rol_numbers,metadata")
    .limit(limit)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const rows = (data ?? []) as QueueRow[]
  const evidence = []
  const failures: Array<{ id: string; fileName: string; error: string }> = []

  const settled = await mapWithConcurrency(rows, 3, (row) => processRow(row))
  settled.forEach((result, index) => {
    const row = rows[index]
    if (result.status === "fulfilled") {
      evidence.push(result.value)
      return
    }
    failures.push({
      id: row.id,
      fileName: row.file_name,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    })
  })

  if (evidence.length) {
    const { error: insertError } = await db
      .from("kmz_enrichment_evidence")
      .upsert(evidence, { onConflict: "fingerprint", ignoreDuplicates: true })

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: insertError.message,
        selected: rows.length,
        processed: evidence.length,
      }, { status: 500 })
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
