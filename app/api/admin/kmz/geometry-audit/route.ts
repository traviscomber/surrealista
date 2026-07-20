import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { normalizeKmzRecord, type KmzCollectionRecord, type StoredPlacemark as NormalizerPlacemark } from "@/lib/kmz/kmz-database-normalizer"

type AuditRow = {
  id: string
  file_name: string
  region: string | null
  file_path: string | null
  drive_file_id: string | null
  placemarks_count: number | null
  coordinates: unknown
  bounds: unknown
  description: string | null
  category: string | null
  rol_numbers: string[] | null
  metadata: Record<string, unknown> | null
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase configuration")
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

function hasCollectionCoordinates(row: AuditRow) {
  return Array.isArray(row.coordinates) && row.coordinates.length > 0
}

function hasPotentialSourceFile(row: AuditRow) {
  return Boolean(row.drive_file_id || row.file_path)
}

function classifyRecoverability(row: AuditRow, storedCount: number) {
  if (storedCount > 0) return "stored_placemarks"
  if (hasCollectionCoordinates(row)) return "collection_coordinates"
  if (hasPotentialSourceFile(row)) return "needs_source_reingest"
  return "no_source"
}

export async function GET() {
  const supabase = getSupabaseAdmin()

  const { data: rows, error } = await supabase
    .from("kmz_collection")
    .select("id,file_name,region,file_path,drive_file_id,placemarks_count,coordinates,bounds,description,category,rol_numbers,metadata")
    .eq("is_active", true)
    .order("region", { ascending: true })
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const kmzRows = (rows || []) as AuditRow[]
  const ids = kmzRows.map((row) => row.id)

  const placemarkCountByKmz = new Map<string, number>()
  if (ids.length > 0) {
    const { data: placemarkRows } = await supabase
      .from("kmz_placemarks")
      .select("kmz_id")
      .in("kmz_id", ids)
      .limit(200000)

    for (const item of placemarkRows || []) {
      const key = `${item.kmz_id}`
      placemarkCountByKmz.set(key, (placemarkCountByKmz.get(key) || 0) + 1)
    }
  }

  const enriched = kmzRows.map((row) => {
    const storedPlacemarks = placemarkCountByKmz.get(row.id) || 0
    const recoverability = classifyRecoverability(row, storedPlacemarks)
    const geometryPresent = (row.placemarks_count || 0) > 0 || storedPlacemarks > 0 || hasCollectionCoordinates(row)

    return {
      id: row.id,
      file_name: row.file_name,
      region: row.region || "Sin región",
      file_path: row.file_path,
      placemarks_count: row.placemarks_count || 0,
      stored_placemarks_count: storedPlacemarks,
      has_collection_coordinates: hasCollectionCoordinates(row),
      geometry_present: geometryPresent,
      recoverability,
      drive_file_id: row.drive_file_id,
    }
  })

  const missing = enriched.filter((row) => !row.geometry_present)
  const recoverableNow = missing.filter((row) => row.recoverability === "stored_placemarks" || row.recoverability === "collection_coordinates")

  const byRegionMap = new Map<
    string,
    {
      region: string
      total: number
      withGeometry: number
      missingGeometry: number
      recoverableNow: number
      sourceReingestNeeded: number
    }
  >()

  for (const row of enriched) {
    const bucket = byRegionMap.get(row.region) || {
      region: row.region,
      total: 0,
      withGeometry: 0,
      missingGeometry: 0,
      recoverableNow: 0,
      sourceReingestNeeded: 0,
    }
    bucket.total += 1
    if (row.geometry_present) bucket.withGeometry += 1
    else {
      bucket.missingGeometry += 1
      if (row.recoverability === "stored_placemarks" || row.recoverability === "collection_coordinates") {
        bucket.recoverableNow += 1
      } else if (row.recoverability === "needs_source_reingest") {
        bucket.sourceReingestNeeded += 1
      }
    }
    byRegionMap.set(row.region, bucket)
  }

  const byRegion = Array.from(byRegionMap.values()).sort((a, b) => b.missingGeometry - a.missingGeometry)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      totalActive: enriched.length,
      withGeometry: enriched.length - missing.length,
      missingGeometry: missing.length,
      recoverableNow: recoverableNow.length,
      sourceReingestNeeded: missing.filter((row) => row.recoverability === "needs_source_reingest").length,
    },
    byRegion,
    samples: {
      missing: missing.slice(0, 50),
      recoverableNow: recoverableNow.slice(0, 50),
    },
  })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json().catch(() => ({}))
  const limit = Math.min(Math.max(Number(body?.limit) || 25, 1), 200)

  const { data: rows, error } = await supabase
    .from("kmz_collection")
    .select("id,file_name,region,file_path,drive_file_id,placemarks_count,coordinates,bounds,description,category,rol_numbers,metadata")
    .eq("is_active", true)
    .eq("placemarks_count", 0)
    .limit(limit * 4)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const candidates = (rows || []) as AuditRow[]
  const results: Array<Record<string, unknown>> = []
  let repaired = 0

  for (const row of candidates) {
    if (repaired >= limit) break

    const { data: storedPlacemarks } = await supabase
      .from("kmz_placemarks")
      .select("name,description,coordinates,type,style_url,properties,region")
      .eq("kmz_id", row.id)
      .limit(5000)

    const proposal = normalizeKmzRecord(row as KmzCollectionRecord, (storedPlacemarks || []) as NormalizerPlacemark[])
    if (proposal.placemarks.length === 0) {
      results.push({
        id: row.id,
        file_name: row.file_name,
        status: "skipped",
        reason: storedPlacemarks && storedPlacemarks.length > 0 ? "invalid_geometry" : "no_geometry_source",
      })
      continue
    }

    const updatePayload = {
      coordinates: proposal.coordinates,
      bounds: proposal.bounds,
      placemarks_count: proposal.counts.total,
      metadata: {
        ...(row.metadata || {}),
        normalized_geometry_count: proposal.counts.total,
        geometry_recovered_at: new Date().toISOString(),
        geometry_recovered_from: proposal.source,
        geometry_recovery_hash: proposal.hash,
        geometry_validation_errors: proposal.validationErrors,
      },
    }

    const { error: updateError } = await supabase.from("kmz_collection").update(updatePayload).eq("id", row.id)

    if (updateError) {
      results.push({
        id: row.id,
        file_name: row.file_name,
        status: "error",
        reason: updateError.message,
      })
      continue
    }

    repaired += 1
    results.push({
      id: row.id,
      file_name: row.file_name,
      status: "repaired",
      recoveredFrom: proposal.source,
      geometryCount: proposal.counts.total,
    })
  }

  return NextResponse.json({
    success: true,
    repaired,
    attempted: results.length,
    results,
  })
}
