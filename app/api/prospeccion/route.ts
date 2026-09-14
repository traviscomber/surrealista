import { NextResponse } from "next/server"
import { listRealOpportunities } from "@/lib/home-spotter/opportunities"

export const runtime = "nodejs"
export const maxDuration = 30

type Opportunity = Awaited<ReturnType<typeof listRealOpportunities>>[number]

function normalize(value: string | null) {
  return String(value || "").trim().toLocaleLowerCase("es-CL")
}

function hectares(areaM2: number) {
  return areaM2 / 10_000
}

function scoreCandidate(item: Opportunity, params: {
  region: string
  commune: string
  minHa: number | null
  maxHa: number | null
}) {
  const areaHa = hectares(Number(item.area_m2 || 0))
  const regionMatch = !params.region || normalize(item.region) === normalize(params.region)
  const communeMatch = !params.commune || normalize(item.commune).includes(normalize(params.commune))
  const minMatch = params.minHa == null || areaHa >= params.minHa
  const maxMatch = params.maxHa == null || areaHa <= params.maxHa

  if (!regionMatch || !communeMatch || !minMatch || !maxMatch) return null

  const geographicFit = params.commune ? 100 : params.region ? 85 : 65
  const areaFit = params.minHa != null || params.maxHa != null ? 100 : 70
  const marketSignal = Number(item.opportunity_score || 0)
  const fitScore = Math.round(geographicFit * 0.4 + areaFit * 0.25 + marketSignal * 0.35)

  return {
    ...item,
    area_ha: Number(areaHa.toFixed(2)),
    prospecting_fit_score: fitScore,
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

  const opportunities = await listRealOpportunities(100)
  const candidates = opportunities
    .map((item) => scoreCandidate(item, { region, commune, minHa, maxHa }))
    .filter(Boolean)
    .sort((a, b) => Number(b?.prospecting_fit_score || 0) - Number(a?.prospecting_fit_score || 0))
    .slice(0, limit)

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
