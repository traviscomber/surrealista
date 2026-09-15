import { NextResponse } from "next/server"
import { createOpenAIChatCompletion } from "@/lib/ai/openai-chat"
import { findProspectingCandidates } from "@/lib/prospeccion/matching"
import { getPublicAgriEvidence, type PublicAgriEvidence } from "@/lib/prospeccion/public-agri-intelligence"
import { getTerritorialInfrastructureEvidence, type TerritorialInfrastructureEvidence } from "@/lib/prospeccion/territorial-infrastructure"

export const runtime = "nodejs"
export const maxDuration = 30

type Candidate = Awaited<ReturnType<typeof findProspectingCandidates>>[number]

type Outcome = {
  status: "qualified_candidates" | "regional_expansion" | "official_off_market_signal" | "no_match"
  summary: string
  recommendation: string
  generatedBy: "evidence" | "ai"
  speciesVerified: false
}

function officialSignalSummary(evidence: PublicAgriEvidence, infrastructure: TerritorialInfrastructureEvidence, species: string) {
  const parts: string[] = []
  if (evidence.ciren.status === "available" && evidence.ciren.polygonCount > 0) {
    parts.push(`${evidence.ciren.polygonCount} polígonos de productores frutícolas CIREN`)
    if (species && evidence.ciren.speciesMatchedCount > 0) {
      parts.push(`${evidence.ciren.speciesMatchedCount} con ${species} declarado en el catastro`)
    }
  }
  if (evidence.odepa.status === "available" && evidence.odepa.recordCount > 0) {
    parts.push(`${evidence.odepa.totalSurfaceHa.toLocaleString("es-CL")} ha frutícolas registradas por ODEPA/CIREN`)
    if (species && evidence.odepa.speciesMatchedCount > 0) {
      parts.push(`${evidence.odepa.speciesMatchedSurfaceHa.toLocaleString("es-CL")} ha asociadas a ${species}`)
    }
  }
  if (infrastructure.irrigation.status === "available") {
    parts.push(`${infrastructure.irrigation.canalFeatures.toLocaleString("es-CL")} elementos de canal y ${infrastructure.irrigation.intakeFeatures.toLocaleString("es-CL")} bocatomas en la cobertura regional CIREN/CNR`)
  }
  if (infrastructure.soils.status === "available" && infrastructure.soils.featureCount > 0) {
    parts.push(`cobertura oficial de suelos agrológicos disponible (${infrastructure.soils.featureCount.toLocaleString("es-CL")} entidades)`)
  }
  return parts.join("; ")
}

function deterministicOutcome({
  candidates,
  region,
  commune,
  species,
  minHa,
  maxHa,
  scopeFallback,
  publicEvidence,
  infrastructure,
}: {
  candidates: Candidate[]
  region: string
  commune: string
  species: string
  minHa: number | null
  maxHa: number | null
  scopeFallback: "region" | null
  publicEvidence: PublicAgriEvidence
  infrastructure: TerritorialInfrastructureEvidence
}): Outcome {
  const area = [minHa != null ? `${minHa} ha mín.` : null, maxHa != null ? `${maxHa} ha máx.` : null].filter(Boolean).join(" · ")
  const target = [commune || region, area].filter(Boolean).join(" · ") || "los criterios definidos"
  const officialSignal = officialSignalSummary(publicEvidence, infrastructure, species)
  const hasOfficialSignal = Boolean(officialSignal)

  if (!candidates.length) {
    if (hasOfficialSignal) {
      return {
        status: "official_off_market_signal",
        summary: `No hay avisos calificados para ${target}, pero sí existe evidencia territorial oficial en la zona: ${officialSignal}. ${species ? `Esto respalda investigar ${species} como hipótesis territorial, pero no confirma que un predio específico corresponda a esa especie.` : "Esto abre una ruta de prospección fuera de portales publicados."}`,
        recommendation: "Cruza primero polígonos/ROL oficiales con inventario KMZ y luego resuelve por candidato la intersección con riego, suelos y propietario antes de priorizar contacto.",
        generatedBy: "evidence",
        speciesVerified: false,
      }
    }

    return {
      status: "no_match",
      summary: `No encontramos candidatos con evidencia de mercado suficiente para ${target}, ni una señal oficial concluyente en las fuentes consultadas en esta ejecución.`,
      recommendation: "Amplía ubicación o superficie, o guarda el mandato para volver a ejecutarlo cuando entren nuevas propiedades y fuentes territoriales.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  const top = candidates[0]
  const location = [top.commune, top.region].filter(Boolean).join(", ") || "ubicación disponible"
  const speciesCaveat = species ? ` La especie ${species} sigue siendo un objetivo declarado, no una detección satelital verificada.` : ""
  const officialContext = hasOfficialSignal ? ` Contexto oficial adicional: ${officialSignal}.` : ""

  if (scopeFallback === "region") {
    return {
      status: "regional_expansion",
      summary: `No hay coincidencias calificadas hoy en ${commune}, pero encontramos ${candidates.length} candidato${candidates.length === 1 ? "" : "s"} en ${region}. El mejor está en ${location}, con ${top.area_ha} ha y ajuste ${top.prospecting_fit_score}/100.${officialContext}${speciesCaveat}`,
      recommendation: "Revisa la evidencia del mejor candidato y mantén el mandato activo; en paralelo, usa la capa oficial para abrir prospectos fuera del mercado publicado.",
      generatedBy: "evidence",
      speciesVerified: false,
    }
  }

  return {
    status: "qualified_candidates",
    summary: `Encontramos ${candidates.length} candidato${candidates.length === 1 ? "" : "s"} para ${target}. El mejor está en ${location}, con ${top.area_ha} ha, ajuste ${top.prospecting_fit_score}/100 y señal de mercado ${top.opportunity_score}/100.${officialContext}${speciesCaveat}`,
    recommendation: "Parte por el candidato con mayor ajuste, contrasta su evidencia con CIREN/ODEPA y luego resuelve riego/suelo por cruce espacial antes de investigar propietario.",
    generatedBy: "evidence",
    speciesVerified: false,
  }
}

async function synthesizeOutcomeWithAI(
  base: Outcome,
  criteria: { region: string; commune: string; species: string; minHa: number | null; maxHa: number | null },
  candidates: Candidate[],
  publicEvidence: PublicAgriEvidence,
  infrastructure: TerritorialInfrastructureEvidence,
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
      temperature: 0.1,
      maxTokens: 240,
      system: "Eres el analista de prospección territorial de Sur Realista. Redacta un outcome ejecutivo en español de Chile, máximo 4 frases. Usa sólo la evidencia entregada. CIREN, ODEPA, riego CNR/CIREN y suelos son contexto territorial oficial: no los presentes como prueba de que un aviso inmobiliario sea el mismo predio ni como prueba de proximidad a un candidato. No inventes propietarios, especies detectadas, coordenadas, disponibilidad, derechos de agua ni atributos del predio. Si hay una especie objetivo, distingue entre especie declarada en catastro y detección satelital: la segunda todavía no está verificada. Termina con una acción concreta para el operador.",
      prompt: JSON.stringify({
        criteria,
        deterministic_outcome: base,
        top_candidates: evidence,
        official_agri_evidence: publicEvidence,
        official_territorial_infrastructure: infrastructure,
      }),
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
  const criteria = { region, commune, minHa, maxHa, species }

  const [initialCandidates, publicEvidence, infrastructure] = await Promise.all([
    findProspectingCandidates(criteria, limit),
    getPublicAgriEvidence(criteria),
    getTerritorialInfrastructureEvidence(criteria),
  ])

  let candidates = initialCandidates
  let scopeFallback: "region" | null = null

  if (candidates.length === 0 && commune && region) {
    candidates = await findProspectingCandidates({ region, commune: null, species, minHa, maxHa }, limit)
    if (candidates.length > 0) scopeFallback = "region"
  }

  const baseOutcome = deterministicOutcome({ candidates, region, commune, species, minHa, maxHa, scopeFallback, publicEvidence, infrastructure })
  const outcome = await synthesizeOutcomeWithAI(baseOutcome, criteria, candidates, publicEvidence, infrastructure)

  return NextResponse.json({
    criteria,
    candidates,
    count: candidates.length,
    methodology: "market-plus-official-territorial-prospecting-v1.4",
    scopeFallback,
    outcome,
    publicEvidence,
    infrastructure,
    coverage: {
      market: "active",
      officialAgriSources: "CIREN+ODEPA",
      irrigationInfrastructure: "CIREN+CNR-regional",
      soils: "CIREN-regional",
      kmz: "available-in-detail-flow",
      speciesClassification: "pending-satellite-pipeline",
      waterRights: "pending-DGA-connector",
      autonomousDiscovery: "official-polygons-active-satellite-pending",
    },
    note: `${outcome.summary} ${outcome.recommendation}`,
  })
}
