import { NextResponse } from "next/server"
import { findProspectingCandidates } from "@/lib/prospeccion/matching"

export const runtime = "nodejs"
export const maxDuration = 30

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

  const speciesNote = species
    ? `La especie objetivo (${species}) queda registrada como criterio, pero no participa todavía del score: la clasificación satelital por especie aún no está activa.`
    : "La clasificación satelital por especie se incorpora en la siguiente fase."

  const locationNote = scopeFallback === "region"
    ? `No hay oportunidades calificadas actualmente en ${commune}; se muestran coincidencias de ${region} con la misma superficie objetivo para no devolver un falso cero.`
    : "Prospección prioriza ubicación, superficie y señal real de mercado."

  return NextResponse.json({
    criteria: { region, commune, minHa, maxHa, species },
    candidates,
    count: candidates.length,
    methodology: "market-prospecting-v1.1",
    scopeFallback,
    coverage: {
      market: "active",
      kmz: "available-in-detail-flow",
      speciesClassification: "pending-satellite-pipeline",
      autonomousDiscovery: "not-yet-active",
    },
    note: `${locationNote} ${speciesNote}`,
  })
}
