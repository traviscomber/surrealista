import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Synthetic owner-discovery queue is retired. Background status must correspond to a real worker and verified evidence pipeline.",
    },
    { status: 410 },
  )
}
