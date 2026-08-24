import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint",
      message: "Synthetic neighbor discovery is disabled. Use the verified CIREN context integration instead.",
      replacement: "/api/kmz/ciren-context",
    },
    { status: 410 },
  )
}
