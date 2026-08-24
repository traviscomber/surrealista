import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint",
      message: "Synthetic owner lead discovery is disabled. Use verified documentary evidence and approved public sources only.",
    },
    { status: 410 },
  )
}
