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

  const candidates = await findProspectingCandidates({ region, commune, species, minHa, maxHa }, limit)

  return NextResponse.json({
    criteria: { region, commune, minHa, maxHa, species },
    candidates,
    count: candidates.length,
    methodology: "market-prospecting-v1",
    coverage: {
      market: "active",
      kmz: "available-in-detail-flow",
      speciesClassification: "pending-satellite-pipeline",
      autonomousDiscovery: "not-yet-active",
    },
    note: species
      ? `La especie objetivo (${species}) queda registrada como criterio, pero no participa todavía del score: la clasificación satelital por especie aún no está activa.`
      : "Prospección v1 prioriza ubicación, superficie y señal real de mercado. La clasificación satelital por especie se incorpora en la siguiente fase.",
  })
}
