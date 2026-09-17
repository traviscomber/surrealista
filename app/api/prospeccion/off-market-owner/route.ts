import { NextResponse } from "next/server"
import { researchOwnerByRol } from "@/lib/prospeccion/owner-intelligence"
import { classifyOwnerResearch, leadDecisionLabel } from "@/lib/prospeccion/lead-state"
import { readOwnerResearchCache, writeOwnerResearchCache } from "@/lib/prospeccion/owner-research-cache"
import { lookupVerifiedOwnerContact, scoreOwnerOpportunity } from "@/lib/prospeccion/owner-opportunity"

export const runtime = "nodejs"
export const maxDuration = 30

async function shapeOwnerResearch(result: Awaited<ReturnType<typeof researchOwnerByRol>>) {
  const ownerName = result.owner?.ownerName ?? null
  const contact = ownerName
    ? await lookupVerifiedOwnerContact({ rol: result.rol, ownerName })
    : null
  const decision = classifyOwnerResearch(result)
  const opportunityScore = scoreOwnerOpportunity({
    decision,
    ownerConfidence: result.owner?.confidence ?? null,
    contact,
  })

  const nextAction = contact
    ? `Contacto interno verificable asociado al mismo ROL y propietario. Preparar acercamiento humano y registrar resultado.`
    : result.owner
      ? result.nextAction
      : result.producer
        ? `Productor/operador asociado: ${result.producer.name} (${Math.round(result.producer.confidence * 100)}% de confianza). No equivale a propietario legal; continuar a CIREN/CBR antes de tratarlo como dueño.`
        : result.historicalOwner
          ? `Propietario histórico identificado: ${result.historicalOwner.name} (${Math.round(result.historicalOwner.confidence * 100)}% de confianza). No asumir vigencia actual; verificar dominio en CBR.`
          : result.nextAction

  return {
    ...result,
    owner: result.owner ? {
      name: result.owner.ownerName,
      confidence: result.owner.confidence,
      source: result.owner.source,
      evidenceUrl: result.owner.url,
      documentType: result.owner.documentType,
      relation: result.owner.relation,
    } : null,
    contact,
    opportunityScore,
    nextAction,
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const rol = String(body.rol || "").trim()
  const commune = String(body.commune || "").trim()
  const force = body.force === true

  if (!rol) {
    return NextResponse.json({ error: "ROL obligatorio." }, { status: 400 })
  }

  try {
    if (!force) {
      const cached = await readOwnerResearchCache({ rol, commune })
      if (cached) {
        return NextResponse.json({
          ...cached.result,
          decision: cached.decision,
          decisionLabel: leadDecisionLabel(cached.decision),
          cache: {
            hit: true,
            researchedAt: cached.researchedAt,
            nextRefreshAt: cached.nextRefreshAt,
          },
        })
      }
    }

    const result = await researchOwnerByRol({ rol, commune })
    const response = await shapeOwnerResearch(result)
    const decision = classifyOwnerResearch(result)
    const persisted = await writeOwnerResearchCache({
      rol,
      commune,
      result: response as Record<string, unknown>,
      decision,
    })

    return NextResponse.json({
      ...response,
      decision,
      decisionLabel: leadDecisionLabel(decision),
      cache: {
        hit: false,
        researchedAt: persisted?.researchedAt ?? new Date().toISOString(),
        nextRefreshAt: persisted?.nextRefreshAt ?? null,
      },
    })
  } catch (error) {
    console.error("[Owner Intelligence] research failed", error)
    return NextResponse.json({ error: "No fue posible completar la investigación de propietario con evidencia suficiente." }, { status: 500 })
  }
}
