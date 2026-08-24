import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Heuristic owner extraction is retired. Owner fields must come from verified documentary evidence and must not be inferred from KMZ names or descriptions.",
    },
    { status: 410 },
  )
}
