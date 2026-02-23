import { NextRequest, NextResponse } from "next/server"
import { indexAllKMZLocations } from "@/lib/kmz/kmz-mass-indexer"

export async function POST(request: NextRequest) {
  try {
    const result = await indexAllKMZLocations()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Mass indexing error:", error)
    return NextResponse.json(
      { error: error?.message || "Indexing failed" },
      { status: 500 }
    )
  }
}
