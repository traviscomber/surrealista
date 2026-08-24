import { NextResponse } from "next/server"

function retiredResponse() {
  return NextResponse.json(
    { error: "Legacy access endpoint retired" },
    {
      status: 410,
      headers: { "Cache-Control": "private, no-store" },
    },
  )
}

export async function POST() {
  return retiredResponse()
}

export async function DELETE() {
  return retiredResponse()
}
