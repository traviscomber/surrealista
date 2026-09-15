import { NextResponse } from "next/server"
import { researchOffMarketOwner } from "@/lib/prospeccion/owner-intelligence"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const rol = String(body.rol || "").trim()
  const commune = String(body.commune || "").trim()

  if (!rol) {
    return NextResponse.json({ error: "ROL obligatorio." }, { status: 400 })
  }

  try {
    const result = await researchOffMarketOwner(rol, commune)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[Owner Intelligence] research failed", error)
    return NextResponse.json({
      error: "No fue posible completar la investigación de propietario con evidencia suficiente.",
    }, { status: 500 })
  }
}
