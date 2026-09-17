import { NextResponse } from "next/server"
import { runProspectingIntelligenceCore } from "@/lib/prospeccion/intelligence-core"
import { normalizeProspectingCriteria } from "@/lib/prospeccion/normalization"
import { getSentinelSatelliteEvidence } from "@/lib/prospeccion/sentinel-satellite"

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
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 60), 1), 100)
  const criteria = normalizeProspectingCriteria({ region, commune, minHa, maxHa, species })

  try {
    const core = await runProspectingIntelligenceCore(criteria, limit)
    const priorityRols = core.priorityCases
      .filter((item) => item.kind === "off_market" && item.rol)
      .map((item) => String(item.rol))
      .slice(0, 3)
    const prioritySet = new Set(priorityRols)
    const targets = core.offMarketProspects.filter((item) => prioritySet.has(item.rol))

    const results = await Promise.all(targets.map(async (prospect) => {
      const satellite = await getSentinelSatelliteEvidence(prospect.centroid)
      const result = {
        rol: prospect.rol,
        centroid: prospect.centroid,
        status: satellite.status,
        note: satellite.note,
        summary: satellite.summary,
        classification: satellite.classification,
      }
      console.info("[Prospeccion Sentinel Diagnostics]", result)
      return result
    }))

    return NextResponse.json({
      criteria,
      credentialsConfigured: Boolean(
        process.env.COPERNICUS_CLIENT_ID?.trim() && process.env.COPERNICUS_CLIENT_SECRET?.trim(),
      ),
      priorityRols,
      targetCount: targets.length,
      results,
    })
  } catch (error) {
    console.error("[Prospeccion Sentinel Diagnostics] failed", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sentinel diagnostics failed" },
      { status: 500 },
    )
  }
}
