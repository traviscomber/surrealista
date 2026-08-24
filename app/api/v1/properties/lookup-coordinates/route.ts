import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Deprecated endpoint",
      message: "Mock coordinate lookup is disabled. Use verified SII/CIREN/KMZ geometry sources only.",
    },
    { status: 410 },
  )
}
