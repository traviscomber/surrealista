import { NextResponse } from "next/server"
import { createOpenAIChatCompletion } from "@/lib/ai/openai-chat"
import { runProspectingIntelligenceCore, type ProspectingCase } from "@/lib/prospeccion/intelligence-core"

export const runtime = "nodejs"
export const maxDuration = 30

type Outcome = {
  status: "actionable_cases" | "qualified_candidates" | "regional_expansion" | "official_off_market_signal" | "no_match"
  summary: string
  recommendation: string
  generatedBy: "evidence" | "ai"
  speciesVerified: false
}

function deterministicOutcome(core: Awaited<ReturnType<typeof runProspectingIntelligenceCore>>): Outcome {
  const total = core.cases.length
  const ready = core.cases.filter((item) => item.status === "ready_to_contact").length
  const ownerKnown = core.cases.filter((item) => item.status === "owner_identified").length
  const target = [core.criteria.commune || core.criteria.region, core.criteria.minHa != null ? `${core.criteria.minHa}+ ha` : null, core.criteria.maxHa != null ? `hasta ${core.criteria.maxHa} ha` : null, core.criteria.species || null].filter(Boolean).join(" · ")

  if (!total) {
    return {
      status: "no_match",
      summary: `No encontramos opciones verificables para ${target || "los criterios definidos"} en esta ejecución.`,
      recommendation: "Mantener el mandato activo o ampliar ubicación/superficie. No se generó un candidato artificial.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  const top = core.priorityCases[0]
  const topDetail = top
    ? `${top.title} · ${top.location}${top.areaHa != null ? ` · ${top.areaHa.toLocaleString("es-CL")} ha` : ""} · score ${top.score}/100`
    : ""

  if (ready > 0) {
    return {
      status: "actionable_cases",
      summary: `La búsqueda produjo ${total} opciones: ${core.marketCount} publicadas y ${core.offMarketCount} fuera de portal. ${ready} ya tienen contacto verificable y ${ownerKnown} adicional${ownerKnown === 1 ? "" : "es"} tienen propietario identificado. Prioridad: ${topDetail}.`,
      recommendation: top?.nextAction || "Revalidar evidencia y preparar contacto humano.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  if (core.offMarketCount > 0) {
    return {
      status: "official_off_market_signal",
      summary: `La búsqueda produjo ${total} opciones: ${core.marketCount} publicadas y ${core.offMarketCount} ROL fuera de portal filtrados por los criterios disponibles. ${ownerKnown ? `${ownerKnown} ya tienen propietario identificado. ` : ""}Prioridad: ${topDetail}.`,
      recommendation: top?.nextAction || "Investigar propietario por ROL y descartar si la evidencia no alcanza.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  return {
    status: core.scopeFallback === "region" ? "regional_expansion" : "qualified_candidates",
    summary: `Encontramos ${core.marketCount} candidato${core.marketCount === 1 ? "" : "s"} publicado${core.marketCount === 1 ? "" : "s"}. Prioridad: ${topDetail}.`,
    recommendation: top?.nextAction || "Revisar evidencia del mejor candidato antes de contacto.",
    generatedBy: "evidence",
    speciesVerified: false,
  }
}

async function synthesizeOutcomeWithAI(base: Outcome, core: Awaited<ReturnType<typeof runProspectingIntelligenceCore>>) {
  if (!process.env.OPENAI_API_KEY || !core.priorityCases.length) return base
  const safeCases = core.priorityCases.map((item: ProspectingCase) => ({
    id: item.id,
    kind: item.kind,
    status: item.status,
    score: item.score,
    title: item.title,
    location: item.location,
    rol: item.rol,
    areaHa: item.areaHa,
    speciesEvidence: item.speciesEvidence,
    owner: item.owner,
    contactAvailable: Boolean(item.contact?.phone || item.contact?.email),
    market: item.market,
    evidence: item.evidence,
    nextAction: item.nextAction,
  }))

  try {
    const text = await createOpenAIChatCompletion({
      model: "gpt-4o-mini",
      temperature: 0.05,
      maxTokens: 220,
      system: "Eres el Prospección Intelligence Core de Sur Realista. Tu función es convertir evidencia autorizada en máximo 3 opciones y una siguiente acción humana. Usa sólo los casos entregados. No inventes disponibilidad, propietario, teléfono, derechos de agua, precio, superficie, especie detectada por satélite ni causalidad. Una especie declarada en CIREN no es detección satelital. Un contacto sólo existe cuando contactAvailable=true. Un ROL fuera de portal no significa que esté a la venta. Responde en español de Chile, máximo 4 frases, orientado a outcome, no a metodología.",
      prompt: JSON.stringify({ criteria: core.criteria, priorityCases: safeCases, deterministicOutcome: base }),
    })
    return { ...base, summary: text.trim(), generatedBy: "ai" as const }
  } catch (error) {
    console.warn("[Prospeccion Core] AI synthesis fallback", error instanceof Error ? error.message : "unknown error")
    return base
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get("region")?.trim() || ""
  const commune = searchParams.get("commune")?.trim() || ""
  const species = searchParams.get("species")?.trim() || ""
  const minHaRaw = Number(searchParams.get("minHa"))
  const maxHaRaw = Number(searchParams.get("maxHa"))
  const minHa = Number.isFinite(minHaRaw) && minHaRaw > 0 ? minHaRaw : null
  const maxHa = Number.isFinite(maxHaRaw) && maxHaRaw > 0 ? maxHaRaw : null
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 60), 1), 100)
  const criteria = { region, commune, minHa, maxHa, species }

  try {
    const core = await runProspectingIntelligenceCore(criteria, limit)
    const baseOutcome = deterministicOutcome(core)
    const outcome = await synthesizeOutcomeWithAI(baseOutcome, core)

    return NextResponse.json({
      criteria,
      candidates: core.marketCandidates,
      count: core.marketCount,
      offMarketProspects: core.offMarketProspects,
      offMarketCount: core.offMarketCount,
      cases: core.cases,
      priorityCases: core.priorityCases,
      outcome,
      publicEvidence: core.publicEvidence,
      infrastructure: core.infrastructure,
      kmz: {
        market: core.marketKmz.summary,
        offMarket: core.offMarketKmz.summary,
      },
      specialistTrace: core.observedSpecialists,
      sourceRefs: core.sourceRefs,
      groundedEvaluation: core.groundedEvaluation,
      scopeFallback: core.scopeFallback,
      methodology: "prospecting-intelligence-core-v2",
      operationalMutationExecuted: core.operationalMutationExecuted,
      coverage: {
        market: "active",
        officialAgriSources: "CIREN+ODEPA",
        irrigationInfrastructure: "CIREN+CNR-regional",
        soils: "CIREN-regional",
        kmz: "market-spatial-plus-offmarket-exact-rol",
        ownerResearch: "exact-rol-auto-plus-on-demand",
        speciesClassification: "declared-catalogue-only-satellite-pending",
        waterRights: "pending-DGA-connector",
        autonomousDiscovery: "official-polygon-discovery-active",
      },
      note: `${outcome.summary} ${outcome.recommendation}`,
    })
  } catch (error) {
    console.error("[Prospeccion Core] run failed", error)
    return NextResponse.json({ error: "No fue posible ejecutar la prospección con evidencia suficiente." }, { status: 500 })
  }
}
