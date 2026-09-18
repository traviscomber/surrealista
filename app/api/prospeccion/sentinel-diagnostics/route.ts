import { NextRequest, NextResponse } from "next/server"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { runProspectingIntelligenceCore } from "@/lib/prospeccion/intelligence-core"
import { fetchCirenParcelPolygon } from "@/lib/prospeccion/ciren-parcel-geometry"
import { normalizeProspectingCriteria } from "@/lib/prospeccion/normalization"
import { syncSentinelMemory } from "@/lib/prospeccion/sentinel-memory"
import { getSentinelParcelEvidence, type SentinelPolygon } from "@/lib/prospeccion/sentinel-parcel-analysis"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  if (!(await verifyInternalAccessToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    )
  }

  const { searchParams } = new URL(request.url)
  const requestedRol = searchParams.get("rol")?.trim() || ""
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

    const targets = requestedRol
      ? core.offMarketProspects.filter((item) => item.rol === requestedRol)
      : core.offMarketProspects.filter((item) => priorityRols.includes(item.rol))

    if (requestedRol && !targets.length) {
      return NextResponse.json(
        {
          error: `El ROL ${requestedRol} no aparece dentro de los prospectos encontrados con estos filtros. Ajusta comuna, especie o rango de hectáreas y vuelve a intentar.`,
          criteria,
          requestedRol,
          availableRols: core.offMarketProspects.slice(0, 20).map((item) => item.rol),
        },
        { status: 404, headers: { "Cache-Control": "private, no-store" } },
      )
    }

    const results = await Promise.all(targets.map(async (prospect) => {
      const polygon = await fetchCirenParcelPolygon(prospect.sourceUrl, prospect.rol, prospect.commune)
      const satellite = await getSentinelParcelEvidence({ centroid: prospect.centroid, polygon })
      const memory = await syncSentinelMemory({
        rol: prospect.rol,
        commune: prospect.commune,
        geometryMode: satellite.geometryMode,
        polygon,
        centroid: prospect.centroid,
        observations: satellite.observations,
      })
      const result = {
        rol: prospect.rol,
        commune: prospect.commune,
        areaHa: prospect.areaHa,
        declaredSpecies: prospect.declaredSpecies,
        centroid: prospect.centroid,
        polygonAvailable: Boolean(polygon),
        polygon,
        sourceUrl: prospect.sourceUrl,
        satellite,
        memory,
      }
      console.info("[Prospeccion Sentinel Diagnostics]", {
        rol: prospect.rol,
        status: satellite.status,
        geometryMode: satellite.geometryMode,
        observationCount: satellite.summary.observationCount,
        baseline: satellite.baseline,
        memoryRows: memory.rowCount,
        anomaly: memory.anomaly,
      })
      return result
    }))

    return NextResponse.json({
      criteria,
      requestedRol: requestedRol || null,
      targetMode: requestedRol ? "exact-rol" : "priority-top-3",
      deploymentEnvironment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      credentialsConfigured: Boolean(
        process.env.COPERNICUS_CLIENT_ID?.trim() && process.env.COPERNICUS_CLIENT_SECRET?.trim(),
      ),
      priorityRols,
      targetCount: targets.length,
      results,
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("[Prospeccion Sentinel Diagnostics] failed", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sentinel diagnostics failed" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    )
  }
}
