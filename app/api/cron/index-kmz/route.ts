import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { KMZLocationIndexer } from "@/lib/kmz/kmz-location-indexer"
import type { KMZPlacemark } from "@/lib/kmz/kmz-reader"

const CANDIDATE_LIMIT = 200
const PROCESS_LIMIT = 20
const PLACEMARK_LIMIT = 5000

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service-role configuration")
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] KMZ auto-indexing cron job started")

    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log(requestId, "[v0] Unauthorized cron call")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    console.log(requestId, "[v0] Fetching active KMZ candidates...")
    const { data: candidateDocs, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: true })
      .limit(CANDIDATE_LIMIT)

    if (fetchError) {
      console.error(requestId, "[v0] Error fetching KMZ:", fetchError)
      return NextResponse.json({ error: "Failed to fetch KMZ documents" }, { status: 500 })
    }

    if (!candidateDocs || candidateDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No KMZ files to index",
        totalCandidates: 0,
        totalProcessed: 0,
        totalIndexed: 0,
        skipped: 0,
        failed: 0,
        results: [],
      })
    }

    const candidateIds = candidateDocs.map((doc) => doc.id)
    const { data: existingLocations, error: existingError } = await supabase
      .from("kmz_location_index")
      .select("kmz_id")
      .in("kmz_id", candidateIds)

    if (existingError) {
      console.error(requestId, "[v0] Error checking existing KMZ indexes:", existingError)
      return NextResponse.json({ error: "Failed to inspect existing KMZ indexes" }, { status: 500 })
    }

    const indexedKmzIds = new Set(existingLocations?.map((location) => location.kmz_id) || [])
    const unindexedDocs = candidateDocs.filter((doc) => !indexedKmzIds.has(doc.id))
    const unindexedIds = unindexedDocs.map((doc) => doc.id)

    if (unindexedIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All KMZ candidates are already indexed",
        totalCandidates: candidateDocs.length,
        totalProcessed: 0,
        totalIndexed: 0,
        skipped: candidateDocs.length,
        failed: 0,
        results: [],
      })
    }

    const { data: placemarkRows, error: placemarkError } = await supabase
      .from("kmz_placemarks")
      .select("kmz_id, name, description, coordinates, type, style_url, properties")
      .in("kmz_id", unindexedIds)
      .limit(PLACEMARK_LIMIT)

    if (placemarkError) {
      console.error(requestId, "[v0] Error fetching stored placemarks:", placemarkError)
      return NextResponse.json({ error: "Failed to fetch stored KMZ placemarks" }, { status: 500 })
    }

    const placemarksByKmz = new Map<string, KMZPlacemark[]>()
    for (const row of placemarkRows || []) {
      if (!Array.isArray(row.coordinates) || row.coordinates.length === 0) continue

      const placemark = {
        name: row.name,
        description: row.description || "",
        coordinates: row.coordinates,
        type: row.type,
        styleUrl: row.style_url || undefined,
        properties: row.properties || {},
      } as KMZPlacemark

      const current = placemarksByKmz.get(row.kmz_id) || []
      current.push(placemark)
      placemarksByKmz.set(row.kmz_id, current)
    }

    const docsToProcess = unindexedDocs
      .filter((doc) => (placemarksByKmz.get(doc.id)?.length || 0) > 0)
      .slice(0, PROCESS_LIMIT)

    const missingPlacemarkDocs = unindexedDocs.filter((doc) => !placemarksByKmz.has(doc.id))
    const results: Array<Record<string, unknown>> = missingPlacemarkDocs.slice(0, PROCESS_LIMIT).map((doc) => ({
      id: doc.id,
      name: doc.file_name,
      status: "skipped",
      reason: "No stored placemarks",
    }))

    if (docsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No indexable KMZ candidates have stored placemarks",
        totalCandidates: candidateDocs.length,
        totalProcessed: 0,
        totalIndexed: 0,
        skipped: missingPlacemarkDocs.length,
        failed: 0,
        results,
      })
    }

    const indexer = new KMZLocationIndexer()
    ;(indexer as unknown as { supabase: typeof supabase }).supabase = supabase

    let totalIndexed = 0
    let failed = 0

    for (const doc of docsToProcess) {
      try {
        const placemarks = placemarksByKmz.get(doc.id) || []
        console.log(requestId, "[v0] Indexing KMZ file:", doc.file_name)

        const result = await indexer.indexKMZLocations(doc.id, doc.file_name, placemarks, doc.region || undefined)
        if (!result.success || result.indexCount === 0) {
          throw result.error || new Error("KMZ location indexing produced no records")
        }

        const { count, error: verificationError } = await supabase
          .from("kmz_location_index")
          .select("id", { count: "exact", head: true })
          .eq("kmz_id", doc.id)

        if (verificationError || !count) {
          throw verificationError || new Error("KMZ indexes were not persisted")
        }

        totalIndexed += count
        results.push({
          id: doc.id,
          name: doc.file_name,
          status: "success",
          indexedLocations: count,
        })
      } catch (fileError) {
        failed++
        const message = fileError instanceof Error ? fileError.message : "Unknown indexing error"
        console.error(requestId, "[v0] Error indexing", doc.file_name, ":", message)
        results.push({
          id: doc.id,
          name: doc.file_name,
          status: "error",
          error: message,
        })
      }
    }

    console.log(requestId, "[v0] Cron job complete. Indexed:", totalIndexed, "Failed:", failed)

    return NextResponse.json({
      success: failed === 0,
      message: failed === 0 ? "Auto-indexing completed" : "Auto-indexing completed with errors",
      totalCandidates: candidateDocs.length,
      totalProcessed: docsToProcess.length,
      totalIndexed,
      skipped: missingPlacemarkDocs.length,
      failed,
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cron error"
    console.error(requestId, "[v0] Cron job error:", message)
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: message,
      },
      { status: 500 },
    )
  }
}
