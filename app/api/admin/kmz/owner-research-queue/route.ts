import { NextResponse } from "next/server"

const RETIRED_MESSAGE =
  "Owner research queue is retired. Do not infer or prioritize owners from filenames, confidence scores, or web-search heuristics; use verified documentary evidence only."

export async function GET() {
  return NextResponse.json({ error: RETIRED_MESSAGE }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: RETIRED_MESSAGE }, { status: 410 })
}
