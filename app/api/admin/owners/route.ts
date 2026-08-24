import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Web-inferred owner records are retired. Owner data must come from verified documentary or cadastral evidence.",
    },
    { status: 410 },
  )
}
