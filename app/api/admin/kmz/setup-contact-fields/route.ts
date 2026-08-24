import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This legacy schema-mutation endpoint is retired. Database schema changes must be applied through reviewed migrations.",
    },
    { status: 410 },
  )
}
