import { createClient } from "@/lib/supabase/server"
import { KmzLocationIndexer } from "@/lib/kmz/kmz-location-indexer"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] KMZ location indexing API called")

    const { kmzUrl, kmzFileName, collectionId } = await request.json()

    if (!kmzUrl || !kmzFileName) {
      console.error(requestId, "[v0] Missing required parameters")
      return NextResponse.json(
        { error: "Missing KMZ URL or file name" },
        { status: 400 }
      )
    }

    console.log(requestId, "[v0] Indexing KMZ file:", {
      fileName: kmzFileName,
      url: kmzUrl,
      collectionId,
    })

    // Fetch KMZ file from URL
    let kmzBuffer: Buffer
    try {
      console.log(requestId, "[v0] Downloading KMZ file from:", kmzUrl)
      const response = await fetch(kmzUrl)
      if (!response.ok) {
        throw new Error(`Failed to download KMZ: ${response.statusText}`)
      }
      kmzBuffer = Buffer.from(await response.arrayBuffer())
      console.log(requestId, "[v0] KMZ file downloaded, size:", kmzBuffer.length, "bytes")
    } catch (downloadError: any) {
      console.error(requestId, "[v0] Error downloading KMZ:", downloadError?.message)
      return NextResponse.json(
        { error: `Error downloading KMZ file: ${downloadError?.message}` },
        { status: 500 }
      )
    }

    // Initialize indexer
    const supabase = await createClient()
    const indexer = new KmzLocationIndexer(supabase)

    // Index locations from KMZ
    let indexedCount = 0
    try {
      console.log(requestId, "[v0] Starting location indexing...")
      indexedCount = await indexer.indexKmzLocations(
        kmzBuffer,
        kmzFileName,
        collectionId
      )
      console.log(requestId, "[v0] Indexing complete, indexed locations:", indexedCount)
    } catch (indexError: any) {
      console.error(requestId, "[v0] Error indexing locations:", indexError?.message)
      return NextResponse.json(
        { error: `Error indexing KMZ locations: ${indexError?.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        indexedLocations: indexedCount,
        fileName: kmzFileName,
        message: `Successfully indexed ${indexedCount} locations from KMZ file`,
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
        error: "Unexpected error while indexing KMZ locations",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    )
  }
}
