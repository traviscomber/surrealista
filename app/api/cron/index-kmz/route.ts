import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { KMZLocationIndexer } from "@/lib/kmz/kmz-location-indexer"
import type { KMZPlacemark } from "@/lib/kmz/kmz-reader"

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

    const supabase = await createClient()

    console.log(requestId, "[v0] Fetching active KMZ records...")
    const { data: kmzDocs, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(20)

    if (fetchError) {
      console.error(requestId, "[v0] Error fetching KMZ:", fetchError)
      return NextResponse.json({ error: "Failed to fetch KMZ documents" }, { status: 500 })
    }

    console.log(requestId, "[v0] Found", kmzDocs?.length || 0, "active KMZ files")

    if (!kmzDocs || kmzDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No KMZ files to index",
        indexed: 0,
      })
    }

    const indexer = new KMZLocationIndexer()
    let totalIndexed = 0
    let skipped = 0
    const results: Array<Record<string, unknown>> = []

    const kmzIds = kmzDocs.map((doc) => doc.id)
    const { data: existingLocations, error: existingError } = await supabase
      .from("kmz_location_index")
      .select("kmz_id")
      .in("kmz_id", kmzIds)

    if (existingError) {
      console.error(requestId, "[v0] Error checking existing KMZ indexes:", existingError)
      return NextResponse.json({ error: "Failed to inspect existing KMZ indexes" }, { status: 500 })
    }

    const indexedKmzIds = new Set(existingLocations?.map((location: { kmz_id: string }) => location.kmz_id) || [])

    for (const doc of kmzDocs) {
      try {
        if (indexedKmzIds.has(doc.id)) {
          console.log(requestId, "[v0] Already indexed:", doc.file_name)
          skipped++
          results.push({
            id: doc.id,
            name: doc.file_name,
            status: "skipped",
            reason: "Already indexed",
          })
          continue
        }

        const { data: placemarkRows, error: placemarkError } = await supabase
          .from("kmz_placemarks")
          .select("name, description, coordinates, type, style_url, properties")
          .eq("kmz_id", doc.id)
          .limit(5000)

        if (placemarkError) throw placemarkError

        const placemarks = (placemarkRows || []).map((placemark) => ({
          name: placemark.name,
          description: placemark.description || "",
          coordinates: placemark.coordinates || [],
          type: placemark.type,
          styleUrl: placemark.style_url || undefined,
          properties: placemark.properties || {},
        })) as KMZPlacemark[]

        if (placemarks.length === 0) {
          skipped++
          results.push({
            id: doc.id,
            name: doc.file_name,
            status: "skipped",
            reason: "No stored placemarks",
          })
          continue
        }

        console.log(requestId, "[v0] Indexing KMZ file:", doc.file_name)
        const result = await indexer.indexKMZLocations(doc.id, doc.file_name, placemarks, doc.region || undefined)

        if (!result.success) {
          throw result.error || new Error("KMZ location indexing failed")
        }

        totalIndexed += result.indexCount
        results.push({
          id: doc.id,
          name: doc.file_name,
          status: "success",
          indexedLocations: result.indexCount,
        })
      } catch (fileError) {
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

    console.log(requestId, "[v0] Cron job complete. Indexed:", totalIndexed, "Skipped:", skipped)

    return NextResponse.json({
      success: true,
      message: "Auto-indexing completed",
      totalProcessed: kmzDocs.length,
      totalIndexed,
      skipped,
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
