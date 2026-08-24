import { NextResponse } from "next/server"

const RETIRED_MESSAGE =
  "Automated owner discovery is retired. Do not persist AI/web owner candidates or confidence scores; use verified documentary evidence only."

export async function GET() {
  return NextResponse.json({ error: RETIRED_MESSAGE }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: RETIRED_MESSAGE }, { status: 410 })
}
