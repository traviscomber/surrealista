import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Filename-based KMZ region reassignment is retired. Regions must be derived from canonical geometry or verified source data.",
    },
    { status: 410 },
  )
}
