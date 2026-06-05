import { createClient } from "@/lib/supabase/server"
import { KMZLocationIndexer } from "@/lib/kmz/kmz-location-indexer"

/**
 * Script to index all existing KMZ files and extract their locations
 * Run this once to populate the kmz_location_index table with all existing KMZ files
 */
async function indexAllKMZFiles() {
  const requestId = `[${new Date().toISOString()}]`
  console.log(requestId, "[v0] Starting batch KMZ location indexing...")

  try {
    const supabase = await createClient()

    // Get all KMZ documents from property_documents
    console.log(requestId, "[v0] Fetching all KMZ documents from database...")
    const { data: kmzDocs, error: fetchError } = await supabase
      .from("property_documents")
      .select("id, title, file_url, category, created_at")
      .eq("category", "KMZ")
      .or(`file_type.eq.kmz,file_type.eq.kml`)

    if (fetchError) {
      throw new Error(`Failed to fetch KMZ documents: ${fetchError.message}`)
    }

    console.log(requestId, "[v0] Found", kmzDocs?.length || 0, "KMZ documents to index")

    if (!kmzDocs || kmzDocs.length === 0) {
      console.log(requestId, "[v0] No KMZ documents found to index")
      return {
        success: true,
        message: "No KMZ documents found",
        totalProcessed: 0,
        totalIndexed: 0,
      }
    }

    const indexer = new KMZLocationIndexer()
    let totalIndexed = 0
    let totalFailed = 0
    const results: any[] = []

    // Check if locations already indexed to avoid duplicates
    const { data: existingLocations } = await supabase
      .from("kmz_location_index")
      .select("kmz_file_url")

    const indexedUrls = new Set(existingLocations?.map((l) => l.kmz_file_url) || [])

    // Process each KMZ file
    for (const doc of kmzDocs) {
      try {
        // Skip if already indexed
        if (indexedUrls.has(doc.file_url)) {
          console.log(requestId, "[v0] Skipping already indexed KMZ:", doc.title)
          results.push({
            fileName: doc.title,
            fileUrl: doc.file_url,
            status: "skipped",
            reason: "Already indexed",
          })
          continue
        }

        console.log(requestId, "[v0] Processing KMZ file:", doc.title)

        // Download and index locations
        const indexedCount = await indexer.indexKMZFile(doc.file_url, doc.id, doc.title)

        console.log(requestId, "[v0] Indexed", indexedCount, "locations from", doc.title)

        results.push({
          fileName: doc.title,
          fileUrl: doc.file_url,
          status: "success",
          indexedLocations: indexedCount,
        })

        totalIndexed += indexedCount
      } catch (fileError: any) {
        console.error(requestId, "[v0] Error processing KMZ file:", doc.title, fileError?.message)
        results.push({
          fileName: doc.title,
          fileUrl: doc.file_url,
          status: "error",
          error: fileError?.message || "Unknown error",
        })
        totalFailed++
      }
    }

    console.log(requestId, "[v0] Batch indexing complete. Indexed:", totalIndexed, "Errors:", totalFailed)

    return {
      success: true,
      message: "Batch KMZ indexing completed",
      totalProcessed: kmzDocs.length,
      totalIndexed,
      totalFailed,
      results,
    }
  } catch (error: any) {
    console.error(requestId, "[v0] Batch indexing failed:", error?.message)
    return {
      success: false,
      error: error?.message || "Unknown error",
    }
  }
}

// Run if this file is executed directly
if (require.main === module) {
  indexAllKMZFiles()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Fatal error:", error)
      process.exit(1)
    })
}

export { indexAllKMZFiles }
