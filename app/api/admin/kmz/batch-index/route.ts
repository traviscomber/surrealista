import { createClient } from "@/lib/supabase/server"
import { KMZLocationIndexer } from "@/lib/kmz/kmz-location-indexer"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] KMZ batch indexing API called")

    // Verify this is an admin request
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all KMZ documents from property_documents
    console.log(requestId, "[v0] Fetching all KMZ documents...")
    const { data: kmzDocs, error: fetchError } = await supabase
      .from("property_documents")
      .select("id, title, file_url, category, created_at")
      .or(`category.eq.KMZ,category.eq.kmz,file_type.eq.kmz,file_type.eq.kml`)

    if (fetchError) {
      console.error(requestId, "[v0] Error fetching KMZ documents:", fetchError)
      return NextResponse.json({ error: "Failed to fetch KMZ documents" }, { status: 500 })
    }

    console.log(requestId, "[v0] Found", kmzDocs?.length || 0, "KMZ documents")

    if (!kmzDocs || kmzDocs.length === 0) {
      return NextResponse.json(
        {
          message: "No KMZ documents found",
          totalProcessed: 0,
          totalIndexed: 0,
        },
        { status: 200 }
      )
    }

    const indexer = new KMZLocationIndexer()
    let totalIndexed = 0
    let totalFailed = 0
    const results: any[] = []

    // Check existing indexed locations
    const { data: existingLocations } = await supabase.from("kmz_location_index").select("kmz_file_url")
    const indexedUrls = new Set(existingLocations?.map((l) => l.kmz_file_url) || [])

    // Process each KMZ file
    for (const doc of kmzDocs) {
      try {
        // Skip if already indexed
        if (indexedUrls.has(doc.file_url)) {
          console.log(requestId, "[v0] Skipping already indexed:", doc.title)
          results.push({
            fileName: doc.title,
            status: "skipped",
            reason: "Already indexed",
          })
          continue
        }

        console.log(requestId, "[v0] Indexing KMZ:", doc.title)
        const indexedCount = await indexer.indexKMZFile(doc.file_url, doc.id, doc.title)

        console.log(requestId, "[v0] Indexed", indexedCount, "locations from", doc.title)

        results.push({
          fileName: doc.title,
          status: "success",
          indexedLocations: indexedCount,
        })

        totalIndexed += indexedCount
      } catch (fileError: any) {
        console.error(requestId, "[v0] Error processing:", doc.title, fileError?.message)
        results.push({
          fileName: doc.title,
          status: "error",
          error: fileError?.message,
        })
        totalFailed++
      }
    }

    console.log(requestId, "[v0] Batch complete. Indexed:", totalIndexed, "Failed:", totalFailed)

    return NextResponse.json(
      {
        success: true,
        message: "Batch KMZ indexing completed",
        totalProcessed: kmzDocs.length,
        totalIndexed,
        totalFailed,
        results,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(requestId, "[v0] Batch indexing error:", error?.message)
    return NextResponse.json(
      {
        error: "Batch indexing failed",
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
