import { NextResponse } from "next/server"
import { researchOwnerByRol } from "@/lib/prospeccion/owner-intelligence"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const rol = String(body.rol || "").trim()
  const commune = String(body.commune || "").trim()

  if (!rol) {
    return NextResponse.json({ error: "ROL obligatorio." }, { status: 400 })
  }

  const result = await researchOwnerByRol({ rol, commune })

  return NextResponse.json({
    ...result,
    owner: result.owner ? {
      name: result.owner.ownerName,
      confidence: result.owner.confidence,
      source: result.owner.source,
      evidenceUrl: result.owner.url,
      documentType: result.owner.documentType,
    } : null,
  })
}
