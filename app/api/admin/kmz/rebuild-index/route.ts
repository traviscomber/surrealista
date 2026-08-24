import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated",
      message:
        "La reconstrucción legacy del índice KMZ fue deshabilitada porque vaciaba kmz_location_index sin reconstruirlo de forma verificable. Use el pipeline KMZ auditado.",
    },
    { status: 410 },
  )
}
