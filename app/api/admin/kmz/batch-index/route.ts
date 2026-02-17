import { createClient } from "@/lib/supabase/server"
import { KMZLocationIndexer } from "@/lib/kmz/kmz-location-indexer"
import { type NextRequest, NextResponse } from "next/server"

// Store indexing status in memory (in production, use a database or Redis)
let indexingState: {
  status: "idle" | "indexing" | "completed" | "error"
  totalKmzFiles: number
  processedFiles: number
  indexedLocations: number
  errorMessage?: string
  lastIndexed?: string
} = {
  status: "idle",
  totalKmzFiles: 0,
  processedFiles: 0,
  indexedLocations: 0,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "status") {
    return NextResponse.json(indexingState)
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    const body = await request.json()
    const action = body.action || "start"

    console.log(requestId, "[v0] KMZ batch indexing API called with action:", action)

    if (action === "status") {
      return NextResponse.json(indexingState)
    }

    if (action !== "start") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Check if already indexing
    if (indexingState.status === "indexing") {
      return NextResponse.json(
        { error: "La indexación ya está en progreso", ...indexingState },
        { status: 409 }
      )
    }

    // Reset state
    indexingState = {
      status: "indexing",
      totalKmzFiles: 0,
      processedFiles: 0,
      indexedLocations: 0,
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
      indexingState.status = "error"
      indexingState.errorMessage = "Error al obtener documentos KMZ"
      return NextResponse.json(indexingState, { status: 500 })
    }

    console.log(requestId, "[v0] Found", kmzDocs?.length || 0, "KMZ documents")

    indexingState.totalKmzFiles = kmzDocs?.length || 0

    if (!kmzDocs || kmzDocs.length === 0) {
      indexingState.status = "completed"
      indexingState.lastIndexed = new Date().toISOString()
      return NextResponse.json(indexingState, { status: 200 })
    }

    // Run indexing in background
    runBackgroundIndexing(kmzDocs, supabase, requestId)

    // Return initial state
    return NextResponse.json(indexingState, { status: 200 })
  } catch (error: any) {
    console.error(requestId, "[v0] Batch indexing error:", error?.message)
    indexingState.status = "error"
    indexingState.errorMessage = error?.message || "Error desconocido"
    return NextResponse.json(indexingState, { status: 500 })
  }
}

// Background indexing function
async function runBackgroundIndexing(kmzDocs: any[], supabase: any, requestId: string) {
  try {
    const indexer = new KMZLocationIndexer()
    let totalIndexed = 0

    // Check existing indexed locations
    const { data: existingLocations } = await supabase
      .from("kmz_location_index")
      .select("kmz_file_url")
    const indexedUrls = new Set(existingLocations?.map((l: any) => l.kmz_file_url) || [])

    // Process each KMZ file
    for (const doc of kmzDocs) {
      try {
        // Skip if already indexed
        if (indexedUrls.has(doc.file_url)) {
          console.log(requestId, "[v0] Skipping already indexed:", doc.title)
          indexingState.processedFiles++
          continue
        }

        console.log(requestId, "[v0] Indexing KMZ:", doc.title)
        const indexedCount = await indexer.indexKMZFile(doc.file_url, doc.id, doc.title)

        console.log(requestId, "[v0] Indexed", indexedCount, "locations from", doc.title)

        totalIndexed += indexedCount
        indexingState.processedFiles++
        indexingState.indexedLocations = totalIndexed
      } catch (fileError: any) {
        console.error(requestId, "[v0] Error processing:", doc.title, fileError?.message)
        indexingState.processedFiles++
      }
    }

    console.log(requestId, "[v0] Batch complete. Indexed:", totalIndexed)

    indexingState.status = "completed"
    indexingState.lastIndexed = new Date().toISOString()
  } catch (error: any) {
    console.error(requestId, "[v0] Background indexing error:", error?.message)
    indexingState.status = "error"
    indexingState.errorMessage = error?.message
  }
}

