import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  normalizeKmzRecord,
  type KmzCollectionRecord,
  type StoredPlacemark as NormalizerPlacemark,
} from "@/lib/kmz/kmz-database-normalizer"

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

type Recoverability =
  | "geometry_persisted"
  | "stored_placemarks"
  | "collection_coordinates"
  | "normalized_metadata"
  | "reference_only"
  | "needs_source_reingest"
  | "needs_external_reupload"
  | "no_source"

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

function getNormalizedGeometryCount(row: AuditRow) {
  const metadata = row.metadata || {}
  const normalized = Number(metadata.normalized_geometry_count || 0)
  const total = Number(metadata.total_geometry_count || 0)
  return Math.max(normalized, total)
}

function hasSiiReference(row: AuditRow) {
  const resolution = row.metadata?.sii_point_resolution
  if (!resolution || typeof resolution !== "object") return false

  const center = (resolution as Record<string, unknown>).center
  if (!center || typeof center !== "object") return false

  const lat = Number((center as Record<string, unknown>).lat)
  const lng = Number((center as Record<string, unknown>).lng)
  return Number.isFinite(lat) && Number.isFinite(lng)
}

function hasPotentialSourceFile(row: AuditRow) {
  return Boolean(row.drive_file_id || (row.file_path && !row.file_path.startsWith("offline/")))
}

function hasOfflinePlaceholder(row: AuditRow) {
  return Boolean(row.file_path && row.file_path.startsWith("offline/"))
}

function classifyRecoverability(row: AuditRow, storedCount: number): Recoverability {
  if ((row.placemarks_count || 0) > 0 || storedCount > 0 || hasCollectionCoordinates(row) || getNormalizedGeometryCount(row) > 0) {
    return "geometry_persisted"
  }
  if (hasSiiReference(row)) return "reference_only"
  if (storedCount > 0) return "stored_placemarks"
  if (hasCollectionCoordinates(row)) return "collection_coordinates"
  if (getNormalizedGeometryCount(row) > 0) return "normalized_metadata"
  if (hasPotentialSourceFile(row)) return "needs_source_reingest"
  if (hasOfflinePlaceholder(row)) return "needs_external_reupload"
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
    const { data: placemarkRows } = await supabase.from("kmz_placemarks").select("kmz_id").in("kmz_id", ids).limit(200000)

    for (const item of placemarkRows || []) {
      const key = `${item.kmz_id}`
      placemarkCountByKmz.set(key, (placemarkCountByKmz.get(key) || 0) + 1)
    }
  }

  const enriched = kmzRows.map((row) => {
    const storedPlacemarks = placemarkCountByKmz.get(row.id) || 0
    const normalizedGeometryCount = getNormalizedGeometryCount(row)
    const hasCoordinates = hasCollectionCoordinates(row)
    const hasReference = hasSiiReference(row)
    const geometryPresent = (row.placemarks_count || 0) > 0 || storedPlacemarks > 0 || hasCoordinates || normalizedGeometryCount > 0
    const recoverability = classifyRecoverability(row, storedPlacemarks)

    return {
      id: row.id,
      file_name: row.file_name,
      region: row.region || "Sin region",
      file_path: row.file_path,
      drive_file_id: row.drive_file_id,
      placemarks_count: row.placemarks_count || 0,
      stored_placemarks_count: storedPlacemarks,
      has_collection_coordinates: hasCoordinates,
      normalized_geometry_count: normalizedGeometryCount,
      has_sii_reference: hasReference,
      geometry_present: geometryPresent,
      recoverability,
    }
  })

  const persisted = enriched.filter((row) => row.geometry_present)
  const referenceOnly = enriched.filter((row) => !row.geometry_present && row.recoverability === "reference_only")
  const recoverableNow = enriched.filter((row) =>
    row.recoverability === "stored_placemarks" ||
    row.recoverability === "collection_coordinates" ||
    row.recoverability === "normalized_metadata",
  )
  const sourceReingestNeeded = enriched.filter((row) => row.recoverability === "needs_source_reingest")
  const noSource = enriched.filter((row) => row.recoverability === "no_source")

  const byRegionMap = new Map<
    string,
    {
      region: string
      total: number
      geometryPersisted: number
      referenceOnly: number
      recoverableNow: number
      sourceReingestNeeded: number
      externalReupload: number
      noSource: number
    }
  >()

  for (const row of enriched) {
    const bucket = byRegionMap.get(row.region) || {
      region: row.region,
      total: 0,
      geometryPersisted: 0,
      referenceOnly: 0,
      recoverableNow: 0,
      sourceReingestNeeded: 0,
      externalReupload: 0,
      noSource: 0,
    }

    bucket.total += 1
    if (row.geometry_present) bucket.geometryPersisted += 1
    else if (row.recoverability === "reference_only") bucket.referenceOnly += 1
    else if (
      row.recoverability === "stored_placemarks" ||
      row.recoverability === "collection_coordinates" ||
      row.recoverability === "normalized_metadata"
    ) {
      bucket.recoverableNow += 1
    } else if (row.recoverability === "needs_source_reingest") {
      bucket.sourceReingestNeeded += 1
    } else if (row.recoverability === "needs_external_reupload") {
      bucket.externalReupload += 1
    } else {
      bucket.noSource += 1
    }

    byRegionMap.set(row.region, bucket)
  }

  const byRegion = Array.from(byRegionMap.values()).sort((a, b) => {
    if (b.externalReupload !== a.externalReupload) return b.externalReupload - a.externalReupload
    if (b.sourceReingestNeeded !== a.sourceReingestNeeded) return b.sourceReingestNeeded - a.sourceReingestNeeded
    if (b.referenceOnly !== a.referenceOnly) return b.referenceOnly - a.referenceOnly
    return b.total - a.total
  })

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      totalActive: enriched.length,
      geometryPersisted: persisted.length,
      referenceOnly: referenceOnly.length,
      recoverableNow: recoverableNow.length,
      sourceReingestNeeded: sourceReingestNeeded.length,
      externalReupload: enriched.filter((row) => row.recoverability === "needs_external_reupload").length,
      noSource: noSource.length,
    },
    byRegion,
    samples: {
      referenceOnly: referenceOnly.slice(0, 50),
      sourceReingestNeeded: sourceReingestNeeded.slice(0, 50),
      externalReupload: enriched.filter((row) => row.recoverability === "needs_external_reupload").slice(0, 50),
      recoverableNow: recoverableNow.slice(0, 50),
      noSource: noSource.slice(0, 50),
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
