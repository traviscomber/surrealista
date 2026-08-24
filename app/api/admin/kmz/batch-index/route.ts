import { NextResponse } from "next/server"

const RETIRED_MESSAGE =
  "Legacy KMZ batch indexing is retired. Use the canonical kmz_collection/kmz_placemarks processing pipeline instead."

export async function GET() {
  return NextResponse.json({ error: RETIRED_MESSAGE }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: RETIRED_MESSAGE }, { status: 410 })
}
