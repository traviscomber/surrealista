import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Automated owner-discovery status is retired because heuristic confidence is not canonical evidence.",
    },
    { status: 410 },
  )
}
