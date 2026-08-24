import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy hybrid ROL resolution is retired. Use source-backed CIREN context and verified documentary/cadastral evidence instead.",
      replacement: "/api/kmz/ciren-context",
    },
    { status: 410 },
  )
}
