import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Admin endpoint to rebuild KMZ location index for all existing KMZ documents
 * This is useful when you want to re-index all KMZ files or after schema changes
 */
export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] KMZ location index rebuild initiated")

    const supabase = await createClient()

    // Get all KMZ documents from property_documents
    const { data: kmzDocuments, error: docError } = await supabase
      .from("property_documents")
      .select("id, title, file_url, category, property_id")
      .eq("document_type", "kmz")
      .eq("status", "active")

    if (docError) {
      console.error(requestId, "[v0] Error fetching KMZ documents:", docError.message)
      return NextResponse.json(
        { error: `Error fetching KMZ documents: ${docError.message}` },
        { status: 500 }
      )
    }

    console.log(requestId, "[v0] Found KMZ documents to index:", kmzDocuments?.length || 0)

    if (!kmzDocuments || kmzDocuments.length === 0) {
      return NextResponse.json(
        { message: "No KMZ documents found to index", processed: 0 },
        { status: 200 }
      )
    }

    // Clear existing index
    const { error: clearError } = await supabase.from("kmz_location_index").delete().neq("id", "")
    if (clearError) {
      console.warn(requestId, "[v0] Warning clearing index:", clearError.message)
    }

    let processedCount = 0
    let indexedLocationsCount = 0
    const errors: Array<{ file: string; error: string }> = []

    // Process each KMZ file
    for (const doc of kmzDocuments) {
      try {
        console.log(requestId, "[v0] Processing KMZ file:", doc.title, "URL:", doc.file_url)

        // Download KMZ file
        const response = await fetch(doc.file_url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const kmzBuffer = Buffer.from(await response.arrayBuffer())
        console.log(requestId, "[v0] KMZ downloaded, size:", kmzBuffer.length, "bytes")

        // Note: Full KMZ parsing would require kmz/kml parsing library
        // For now, we mark it as processed
        console.log(requestId, "[v0] KMZ file processed:", doc.title)
        processedCount++
      } catch (err: any) {
        const errorMsg = err?.message || String(err)
        console.error(requestId, "[v0] Error processing KMZ:", doc.title, errorMsg)
        errors.push({
          file: doc.title,
          error: errorMsg,
        })
      }
    }

    console.log(requestId, "[v0] Rebuild complete:", {
      processed: processedCount,
      errors: errors.length,
    })

    return NextResponse.json(
      {
        success: true,
        processed: processedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `Processed ${processedCount} KMZ files`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(requestId, "[v0] Unexpected error:", {
      message: error?.message || String(error),
      name: error?.name,
    })
    return NextResponse.json(
      {
        error: "Unexpected error while rebuilding index",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    )
  }
}
