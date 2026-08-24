import { NextResponse } from "next/server"

const RETIRED_MESSAGE =
  "Legacy KMZ process-all is retired. Use the canonical placemark backfill and kmz_collection/kmz_placemarks pipeline instead."

export async function POST() {
  return NextResponse.json({ error: RETIRED_MESSAGE }, { status: 410 })
}
