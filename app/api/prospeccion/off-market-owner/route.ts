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
    const nextAction = !result.owner && result.producer
      ? `Productor/operador asociado al ROL: ${result.producer.name}. No equivale a propietario legal; validar dominio vigente antes de tratarlo como dueño.`
      : !result.owner && !result.producer && result.historicalOwner
        ? `Existe evidencia histórica para ${result.historicalOwner.name}. No prueba dominio vigente; validar en Conservador antes de contacto como propietario.`
        : result.nextAction

    return NextResponse.json({ ...result, nextAction })
  } catch (error) {
    console.error("[Owner Intelligence] research failed", error)
    return NextResponse.json({
      error: "No fue posible completar la investigación de propietario con evidencia suficiente.",
    }, { status: 500 })
  }
}
