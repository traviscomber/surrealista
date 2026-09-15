import { NextResponse } from "next/server"
import { researchOwnerByRol } from "@/lib/prospeccion/owner-intelligence"
import { researchOwnerOnPublicWeb } from "@/lib/prospeccion/owner-web-intelligence"

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
    if (result.owner) {
      return NextResponse.json({
        ...result,
        owner: {
          name: result.owner.ownerName,
          confidence: result.owner.confidence,
          source: result.owner.source,
          evidenceUrl: result.owner.url,
          documentType: result.owner.documentType,
        },
        webEvidence: null,
      })
    }

    const web = await researchOwnerOnPublicWeb({ rol, commune })
    const webEvidence = web.evidence
    const producer = webEvidence?.relation === "producer_operator" ? webEvidence : null
    const historicalOwner = webEvidence?.relation === "historical_owner" ? webEvidence : null
    const ownerCandidate = webEvidence?.relation === "legal_owner" ? webEvidence : null

    return NextResponse.json({
      ...result,
      owner: ownerCandidate ? {
        name: ownerCandidate.name,
        confidence: ownerCandidate.confidence,
        source: ownerCandidate.source,
        evidenceUrl: ownerCandidate.url,
        documentType: "public-web-owner-candidate",
      } : null,
      status: ownerCandidate ? "owner_candidate_found" : producer ? "producer_candidate_found" : "owner_pending",
      webEvidence,
      webSearch: {
        available: web.available,
        attemptedQueries: web.attemptedQueries,
      },
      nextAction: ownerCandidate
        ? "Existe un candidato de propietario respaldado por evidencia pública para este ROL y comuna. Validar dominio vigente en el Conservador antes de tratarlo como dueño actual."
        : producer
          ? `Productor/operador asociado al ROL: ${producer.name}. No equivale a propietario legal; validar dominio vigente antes de tratarlo como dueño.`
          : historicalOwner
            ? `Existe evidencia histórica para ${historicalOwner.name}. No prueba dominio vigente; validar en el Conservador.`
            : result.nextAction,
    })
  } catch (error) {
    console.error("[Owner Intelligence] research failed", error)
    return NextResponse.json({ error: "No fue posible completar la investigación de propietario con evidencia suficiente." }, { status: 500 })
  }
}
