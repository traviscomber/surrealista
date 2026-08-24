import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated",
      message: "Legacy synthetic document analysis has been disabled. Use a verified document-analysis pipeline instead.",
    },
    { status: 410 },
  )
}
