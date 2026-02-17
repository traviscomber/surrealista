import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { KMZLocationIndexer } from "@/lib/kmz/kmz-location-indexer"

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] KMZ auto-indexing cron job started")

    // Verify it's called from Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.includes("Bearer")) {
      console.log(requestId, "[v0] Unauthorized cron call")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all active KMZ documents that haven't been indexed recently
    console.log(requestId, "[v0] Fetching unindexed KMZ from kmz_collection...")
    const { data: kmzDocs, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, name, url, created_at, updated_at")
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
    const results = []

    // Check which files are already indexed
    const { data: existingLocations } = await supabase
      .from("kmz_location_index")
      .select("kmz_file_url")

    const indexedUrls = new Set(existingLocations?.map((l: any) => l.kmz_file_url) || [])

    // Index each KMZ file
    for (const doc of kmzDocs) {
      try {
        if (indexedUrls.has(doc.url)) {
          console.log(requestId, "[v0] Already indexed:", doc.name)
          skipped++
          results.push({
            name: doc.name,
            status: "skipped",
            reason: "Already indexed",
          })
          continue
        }

        console.log(requestId, "[v0] Indexing KMZ file:", doc.name)
        const indexedCount = await indexer.indexKMZFile(doc.url, doc.id, doc.name)

        console.log(requestId, "[v0] Indexed", indexedCount, "locations from", doc.name)
        totalIndexed += indexedCount

        results.push({
          name: doc.name,
          status: "success",
          indexedLocations: indexedCount,
        })
      } catch (fileError: any) {
        console.error(requestId, "[v0] Error indexing", doc.name, ":", fileError?.message)
        results.push({
          name: doc.name,
          status: "error",
          error: fileError?.message,
        })
      }
    }

    console.log(requestId, "[v0] Cron job complete. Indexed:", totalIndexed, "Skipped:", skipped)

    return NextResponse.json(
      {
        success: true,
        message: "Auto-indexing completed",
        totalProcessed: kmzDocs.length,
        totalIndexed,
        skipped,
        results,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(requestId, "[v0] Cron job error:", error?.message)
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
