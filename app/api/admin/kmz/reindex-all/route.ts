import { NextRequest, NextResponse } from "next/server"
import { indexAllKMZLocations } from "@/lib/kmz/kmz-mass-indexer"

export async function POST(request: NextRequest) {
  const requestId = `[${Date.now()}]`
  console.log(requestId, "[v0] Starting mass KMZ re-indexing")
  
  try {
    console.log(requestId, "[v0] Calling indexAllKMZLocations()")
    const result = await indexAllKMZLocations()
    console.log(requestId, "[v0] Mass indexing result:", result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error(requestId, "[v0] Mass indexing error:", error)
    return NextResponse.json(
      { error: error?.message || "Indexing failed", details: error?.toString() },
      { status: 500 }
    )
  }
}
