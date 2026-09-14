import { NextResponse } from "next/server"
import { createOpenAIChatCompletion } from "@/lib/ai/openai-chat"
import { findProspectingCandidates } from "@/lib/prospeccion/matching"

export const runtime = "nodejs"
export const maxDuration = 30

type Candidate = Awaited<ReturnType<typeof findProspectingCandidates>>[number]

type Outcome = {
  status: "qualified_candidates" | "regional_expansion" | "no_match"
  summary: string
  recommendation: string
  generatedBy: "evidence" | "ai"
  speciesVerified: false
}

function deterministicOutcome({
  candidates,
  region,
  commune,
  species,
  minHa,
  maxHa,
  scopeFallback,
}: {
  candidates: Candidate[]
  region: string
  commune: string
  species: string
  minHa: number | null
  maxHa: number | null
  scopeFallback: "region" | null
}): Outcome {
  const area = [minHa != null ? `${minHa} ha mín.` : null, maxHa != null ? `${maxHa} ha máx.` : null].filter(Boolean).join(" · ")
  const target = [commune || region, area].filter(Boolean).join(" · ") || "los criterios definidos"

  if (!candidates.length) {
    return {
      status: "no_match",
      summary: `No encontramos candidatos con evidencia de mercado suficiente para ${target}.`,
      recommendation: "Amplía ubicación o superficie, o guarda el mandato para volver a ejecutarlo cuando entren nuevas propiedades.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  const top = candidates[0]
  const location = [top.commune, top.region].filter(Boolean).join(", ") || "ubicación disponible"
  const speciesCaveat = species ? ` La especie ${species} sigue siendo un objetivo declarado, no una detección satelital verificada.` : ""

  if (scopeFallback === "region") {
    return {
      status: "regional_expansion",
      summary: `No hay coincidencias calificadas hoy en ${commune}, pero encontramos ${candidates.length} candidato${candidates.length === 1 ? "" : "s"} en ${region}. El mejor está en ${location}, con ${top.area_ha} ha y ajuste ${top.prospecting_fit_score}/100.${speciesCaveat}`,
      recommendation: "Revisa la evidencia del mejor candidato y mantén el mandato activo para detectar nuevas entradas en la comuna objetivo.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  return {
    status: "qualified_candidates",
    summary: `Encontramos ${candidates.length} candidato${candidates.length === 1 ? "" : "s"} para ${target}. El mejor está en ${location}, con ${top.area_ha} ha, ajuste ${top.prospecting_fit_score}/100 y señal de mercado ${top.opportunity_score}/100.${speciesCaveat}`,
    recommendation: "Parte por el candidato con mayor ajuste, revisa su evidencia territorial y decide si corresponde investigar propietario o mantenerlo en seguimiento.",
    generatedBy: "evidence",
    speciesVerified: false,
  }
}

async function synthesizeOutcomeWithAI(
  base: Outcome,
  criteria: { region: string; commune: string; species: string; minHa: number | null; maxHa: number | null },
  candidates: Candidate[],
): Promise<Outcome> {
  if (!process.env.OPENAI_API_KEY) return base

  const evidence = candidates.slice(0, 5).map((candidate) => ({
    title: candidate.title,
    region: candidate.region,
    commune: candidate.commune,
    area_ha: candidate.area_ha,
    fit_score: candidate.prospecting_fit_score,
    market_score: candidate.opportunity_score,
    confidence: candidate.confidence,
    discount_pct: candidate.discount_pct,
    comparable_count: candidate.benchmark.sample_count,
    source_count: candidate.benchmark.source_count,
  }))

  try {
    const text = await createOpenAIChatCompletion({
      model: "gpt-4o-mini",
      temperature: 0.15,
      maxTokens: 180,
      system: "Eres el analista de prospección territorial de Sur Realista. Redacta un outcome ejecutivo en español de Chile, máximo 3 frases. Usa sólo la evidencia entregada. No inventes propietarios, especies detectadas, coordenadas, disponibilidad ni atributos del predio. Si hay una especie objetivo, declara explícitamente que todavía no está verificada por clasificación satelital. Termina con una acción concreta para el operador.",
      prompt: JSON.stringify({ criteria, deterministic_outcome: base, top_candidates: evidence }),
    })

    return {
      ...base,
      summary: text.trim(),
      recommendation: base.recommendation,
      generatedBy: "ai",
    }
  } catch (error) {
    console.warn("[Prospeccion] AI outcome fallback", error instanceof Error ? error.message : "unknown error")
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
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 40), 1), 100)

  let candidates = await findProspectingCandidates({ region, commune, species, minHa, maxHa }, limit)
  let scopeFallback: "region" | null = null

  if (candidates.length === 0 && commune && region) {
    candidates = await findProspectingCandidates({ region, commune: null, species, minHa, maxHa }, limit)
    if (candidates.length > 0) scopeFallback = "region"
  }

  const criteria = { region, commune, minHa, maxHa, species }
  const baseOutcome = deterministicOutcome({ candidates, region, commune, species, minHa, maxHa, scopeFallback })
  const outcome = await synthesizeOutcomeWithAI(baseOutcome, criteria, candidates)

  return NextResponse.json({
    criteria,
    candidates,
    count: candidates.length,
    methodology: "market-prospecting-v1.2-outcome",
    scopeFallback,
    outcome,
    coverage: {
      market: "active",
      kmz: "available-in-detail-flow",
      speciesClassification: "pending-satellite-pipeline",
      autonomousDiscovery: "not-yet-active",
    },
    note: `${outcome.summary} ${outcome.recommendation}`,
  })
}
