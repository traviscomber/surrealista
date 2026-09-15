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

  try {
    const result = await researchOwnerByRol({ rol, commune })
    const nextAction = result.owner
      ? result.nextAction
      : result.producer
        ? `Productor/operador asociado: ${result.producer.name} (${Math.round(result.producer.confidence * 100)}% de confianza). No equivale a propietario legal; continuar a CIREN/CBR antes de tratarlo como dueño.`
        : result.historicalOwner
          ? `Propietario histórico identificado: ${result.historicalOwner.name} (${Math.round(result.historicalOwner.confidence * 100)}% de confianza). No asumir vigencia actual; verificar dominio en CBR.`
          : result.nextAction

    return NextResponse.json({
      ...result,
      owner: result.owner ? {
        name: result.owner.ownerName,
        confidence: result.owner.confidence,
        source: result.owner.source,
        evidenceUrl: result.owner.url,
        documentType: result.owner.documentType,
        relation: result.owner.relation,
      } : null,
      nextAction,
    })
  } catch (error) {
    console.error("[Owner Intelligence] research failed", error)
    return NextResponse.json({ error: "No fue posible completar la investigación de propietario con evidencia suficiente." }, { status: 500 })
  }
}
