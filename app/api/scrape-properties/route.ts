import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint",
      message: "Synthetic property generation is disabled. Use verified property sources and production scrapers only.",
    },
    { status: 410 },
  )
}
