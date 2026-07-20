import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { parseKMZFile, type KMZPlacemark } from "@/lib/kmz/kmz-reader"
import { detectRegionFromCoordinateArray } from "@/lib/utils/region-detector"

export const maxDuration = 300

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 20
const INSERT_BATCH_SIZE = 250

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get("authorization")?.trim()
  return Boolean(secret && authorization === `Bearer ${secret}`)
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service-role configuration")
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getDriveApiKey() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY?.trim()
  if (!apiKey) throw new Error("GOOGLE_DRIVE_API_KEY is not configured")
  return apiKey
}

function parseLimit(request: NextRequest) {
  const requested = Number(request.nextUrl.searchParams.get("limit") || DEFAULT_LIMIT)
  if (!Number.isFinite(requested)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(requested), 1), MAX_LIMIT)
}

function calculateBounds(coordinates: KMZPlacemark["coordinates"]) {
  let north = -90
  let south = 90
  let east = -180
  let west = 180

  for (const [lng, lat] of coordinates) {
    north = Math.max(north, lat)
    south = Math.min(south, lat)
    east = Math.max(east, lng)
    west = Math.min(west, lng)
  }

  return { north, south, east, west }
}

function toPlacemarkRow(kmzId: string, placemark: KMZPlacemark) {
  const [centerLng = 0, centerLat = 0] = placemark.coordinates[0] || []

  return {
    kmz_id: kmzId,
    name: placemark.name,
    description: placemark.description || null,
    coordinates: placemark.coordinates,
    type: placemark.type,
    style_url: placemark.styleUrl || null,
    properties: placemark.properties || {},
    center_point: `SRID=4326;POINT(${centerLng} ${centerLat})`,
    region: detectRegionFromCoordinateArray(placemark.coordinates),
    bounds: calculateBounds(placemark.coordinates),
  }
}

async function downloadKmz(driveFileId: string, fileName: string) {
  const apiKey = getDriveApiKey()
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?alt=media&key=${encodeURIComponent(apiKey)}`
  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) })

  if (!response.ok) {
    throw new Error(`Google Drive download failed (${response.status} ${response.statusText})`)
  }

  const bytes = await response.arrayBuffer()
  return new File([bytes], fileName, { type: "application/vnd.google-earth.kmz" })
}

export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getAdminClient()
    const limit = parseLimit(request)

    const { data: candidates, error: candidateError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, drive_file_id, placemarks_count, updated_at")
      .eq("is_active", true)
      .not("drive_file_id", "is", null)
      .order("updated_at", { ascending: true })
      .limit(200)

    if (candidateError) throw candidateError
    if (!candidates?.length) {
      return NextResponse.json({ success: true, processed: 0, savedPlacemarks: 0, results: [] })
    }

    const candidateIds = candidates.map((candidate) => candidate.id)
    const { data: existingRows, error: existingError } = await supabase
      .from("kmz_placemarks")
      .select("kmz_id")
      .in("kmz_id", candidateIds)

    if (existingError) throw existingError

    const existingIds = new Set((existingRows || []).map((row) => row.kmz_id))
    const pending = candidates.filter((candidate) => !existingIds.has(candidate.id)).slice(0, limit)
    const results: Array<Record<string, unknown>> = []
    let savedPlacemarks = 0
    let failed = 0

    for (const candidate of pending) {
      try {
        console.log(requestId, "[v0] Backfilling placemarks for", candidate.file_name)
        const file = await downloadKmz(candidate.drive_file_id, candidate.file_name)
        const parsed = await parseKMZFile(file)

        if (parsed.skipped || parsed.placemarks.length === 0) {
          results.push({
            id: candidate.id,
            name: candidate.file_name,
            status: "skipped",
            reason: parsed.skipReason || "KMZ contains no placemarks",
          })
          continue
        }

        const rows = parsed.placemarks.map((placemark) => toPlacemarkRow(candidate.id, placemark))

        for (let offset = 0; offset < rows.length; offset += INSERT_BATCH_SIZE) {
          const { error: insertError } = await supabase
            .from("kmz_placemarks")
            .insert(rows.slice(offset, offset + INSERT_BATCH_SIZE))

          if (insertError) throw insertError
        }

        const region = parsed.bounds
          ? detectRegionFromCoordinateArray(parsed.placemarks.flatMap((placemark) => placemark.coordinates))
          : null

        const { error: updateError } = await supabase
          .from("kmz_collection")
          .update({
            placemarks_count: parsed.placemarks.length,
            bounds: parsed.bounds || null,
            region,
            updated_at: new Date().toISOString(),
          })
          .eq("id", candidate.id)

        if (updateError) throw updateError

        savedPlacemarks += rows.length
        results.push({
          id: candidate.id,
          name: candidate.file_name,
          status: "success",
          placemarks: rows.length,
        })
      } catch (error) {
        failed++
        const message = error instanceof Error ? error.message : "Unknown backfill error"
        console.error(requestId, "[v0] KMZ placemark backfill failed", candidate.file_name, message)
        results.push({
          id: candidate.id,
          name: candidate.file_name,
          status: "error",
          error: message,
        })
      }
    }

    return NextResponse.json({
      success: failed === 0,
      pendingCandidates: pending.length,
      processed: pending.length,
      savedPlacemarks,
      failed,
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backfill error"
    console.error(requestId, "[v0] KMZ placemark backfill aborted", message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
