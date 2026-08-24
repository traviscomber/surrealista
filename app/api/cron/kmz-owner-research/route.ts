import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      retired: true,
      message:
        "Automated KMZ owner research is retired. Owner data must come from verified documentary or cadastral evidence.",
    },
    { status: 200 },
  )
}
