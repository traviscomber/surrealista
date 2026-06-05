import { indexAllKMZLocations } from "@/lib/kmz/kmz-mass-indexer"
import { type NextRequest, NextResponse } from "next/server"

let indexingState: any = {
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

    console.log(requestId, "[v0] KMZ mass indexing API called with action:", action)

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
      startTime: new Date().toISOString(),
    }

    // Run indexing in background
    runMassIndexing(requestId)

    // Return initial state
    return NextResponse.json(indexingState, { status: 200 })
  } catch (error: any) {
    console.error(requestId, "[v0] Mass indexing error:", error?.message)
    indexingState.status = "error"
    indexingState.errorMessage = error?.message || "Error desconocido"
    return NextResponse.json(indexingState, { status: 500 })
  }
}

async function runMassIndexing(requestId: string) {
  try {
    console.log(requestId, "[v0] Starting background mass KMZ indexing...")

    const result = await indexAllKMZLocations()

    console.log(requestId, "[v0] Mass indexing completed:", result)

    indexingState = {
      status: "completed",
      totalKmzFiles: result.total || 0,
      processedFiles: result.success || 0,
      indexedLocations: result.totalLocations || 0,
      failedFiles: result.failed || 0,
      lastIndexed: new Date().toISOString(),
      results: result.results || [],
    }
  } catch (error: any) {
    console.error(requestId, "[v0] Background mass indexing error:", error?.message)
    indexingState.status = "error"
    indexingState.errorMessage = error?.message || "Error en indexación en background"
  }
}
