import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { runProspectingIntelligenceCore } from "@/lib/prospeccion/intelligence-core"
import { normalizeProspectingCriteria } from "@/lib/prospeccion/normalization"
import { syncSentinelMemory } from "@/lib/prospeccion/sentinel-memory"
import { resolveSentinelCentroidTarget } from "@/lib/prospeccion/sentinel-backfill"
import { lookupExactCirenRol, type ExactCirenRolCandidate } from "@/lib/prospeccion/public-agri-intelligence"
import { getSentinelParcelEvidence, type SentinelPolygon } from "@/lib/prospeccion/sentinel-parcel-analysis"

export const runtime = "nodejs"
export const maxDuration = 30

type DiagnosticTarget = {
  id: string
  rol: string
  region: string | null
  commune: string
  areaHa: number | null
  declaredSpecies: string[]
  surveyYear: number | null
  sourceUrl: string | null
  centroid: { lat: number; lng: number }
  source: "ciren" | "sii"
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function normalizeRol(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\//g, "-")
    .replace(/\s+/g, "")
    .replace(/[^0-9K-]/g, "")
    .replace(/-+/g, "-")
}

function rolVariants(value: unknown) {
  const canonical = normalizeRol(value)
  if (!canonical) return []
  return Array.from(new Set([canonical, canonical.replace(/-/g, "/"), canonical.replace(/-/g, "")]))
}

async function lookupSiiSentinelTargets(requestedRol: string): Promise<DiagnosticTarget[]> {
  const client = admin()
  if (!client) return []

  const variants = rolVariants(requestedRol)
  if (!variants.length) return []

  const { data, error } = await client
    .from("kmz_collection")
    .select("id,region,rol_numbers,metadata")
    .eq("is_active", true)
    .overlaps("rol_numbers", variants)
    .limit(20)

  if (error) {
    console.warn("[Prospeccion Sentinel Diagnostics] SII target lookup failed", error.message)
    return []
  }

  const canonical = normalizeRol(requestedRol)
  const targets = (data ?? []).flatMap((row) => {
    const target = resolveSentinelCentroidTarget(row.metadata)
    if (!target || normalizeRol(target.rol) !== canonical) return []

    return [{
      id: `sii:${String(row.id)}`,
      rol: target.rol,
      region: row.region ? String(row.region) : null,
      commune: target.commune,
      areaHa: null,
      declaredSpecies: [],
      surveyYear: null,
      sourceUrl: null,
      centroid: target.centroid,
      source: "sii" as const,
    }]
  })

  const seen = new Set<string>()
  return targets.filter((target) => {
    const key = [normalizeRol(target.rol), target.commune.toUpperCase(), target.centroid.lat.toFixed(6), target.centroid.lng.toFixed(6)].join("|")
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function escapeSqlLiteral(value: string) {
  return value.replace(/'/g, "''")
}

async function fetchCirenPolygon(sourceUrl: string, rol: string, commune: string): Promise<SentinelPolygon | null> {
  const where = [
    `rolpredi='${escapeSqlLiteral(rol)}'`,
    commune ? `UPPER(desccomu)='${escapeSqlLiteral(commune.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase())}'` : null,
  ].filter(Boolean).join(" AND ")
  const params = new URLSearchParams({
    f: "json",
    where,
    outFields: "rolpredi,desccomu",
    returnGeometry: "true",
    outSR: "4326",
    geometryPrecision: "6",
    resultRecordCount: "5",
  })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(`${sourceUrl}/query?${params.toString()}`, { cache: "no-store", signal: controller.signal })
    if (!response.ok) return null
    const payload = await response.json() as { features?: Array<{ geometry?: { rings?: number[][][] } }> }
    const rings = payload.features?.[0]?.geometry?.rings
    if (!Array.isArray(rings) || !rings.length) return null
    return { type: "Polygon", coordinates: rings }
  } catch (error) {
    console.warn("[Prospeccion Sentinel Diagnostics] CIREN polygon lookup failed", error instanceof Error ? error.message : "unknown error")
    return null
  } finally {
    clearTimeout(timer)
  }
}

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
  const candidateId = searchParams.get("candidateId")?.trim() || ""
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
    let exactRolAreaFilterBypassed = false
    let priorityRols: string[] = []
    let targets: DiagnosticTarget[] = []
    let exactLookup: Awaited<ReturnType<typeof lookupExactCirenRol>> | null = null
    let exactResolutionSource: "ciren" | "sii" | null = null

    if (requestedRol) {
      exactLookup = await lookupExactCirenRol(requestedRol)

      if (exactLookup.candidates.length) {
        const selected = candidateId
          ? exactLookup.candidates.filter((candidate) => candidate.id === candidateId)
          : exactLookup.candidates

        if (candidateId && !selected.length) {
          return NextResponse.json(
            { error: "La coincidencia seleccionada ya no está disponible para este ROL.", requestedRol },
            { status: 404, headers: { "Cache-Control": "private, no-store" } },
          )
        }

        if (!candidateId && selected.length > 1) {
          return NextResponse.json(
            {
              error: `El ROL ${requestedRol} tiene más de una coincidencia territorial. Selecciona el predio correcto.`,
              requestedRol,
              ambiguous: true,
              candidates: selected.map((candidate) => ({
                id: candidate.id,
                rol: candidate.rol,
                region: candidate.region,
                commune: candidate.commune,
                areaHa: candidate.areaHa,
                declaredSpecies: candidate.declaredSpecies,
                surveyYear: candidate.surveyYear,
                source: "CIREN",
              })),
            },
            { status: 409, headers: { "Cache-Control": "private, no-store" } },
          )
        }

        targets = selected
          .filter((candidate) => candidate.centroid)
          .map((candidate) => ({
            id: candidate.id,
            rol: candidate.rol,
            region: candidate.region,
            commune: candidate.commune,
            areaHa: candidate.areaHa,
            declaredSpecies: candidate.declaredSpecies,
            surveyYear: candidate.surveyYear,
            sourceUrl: candidate.sourceUrl,
            centroid: candidate.centroid!,
            source: "ciren" as const,
          }))
        exactResolutionSource = "ciren"
      } else {
        const siiTargets = await lookupSiiSentinelTargets(requestedRol)
        const selected = candidateId
          ? siiTargets.filter((candidate) => candidate.id === candidateId)
          : siiTargets

        if (candidateId && !selected.length) {
          return NextResponse.json(
            { error: "La referencia SII seleccionada ya no está disponible para este ROL.", requestedRol },
            { status: 404, headers: { "Cache-Control": "private, no-store" } },
          )
        }

        if (!candidateId && selected.length > 1) {
          return NextResponse.json(
            {
              error: `El ROL ${requestedRol} tiene más de una referencia territorial SII. Selecciona la correcta.`,
              requestedRol,
              ambiguous: true,
              candidates: selected.map((candidate) => ({
                id: candidate.id,
                rol: candidate.rol,
                region: candidate.region,
                commune: candidate.commune,
                areaHa: null,
                declaredSpecies: [],
                surveyYear: null,
                source: "SII",
              })),
            },
            { status: 409, headers: { "Cache-Control": "private, no-store" } },
          )
        }

        if (!selected.length) {
          const temporarilyIncomplete = exactLookup.status === "partial"
          return NextResponse.json(
            {
              error: temporarilyIncomplete
                ? `No pudimos resolver el ROL ${requestedRol} con CIREN ni con una referencia SII utilizable en esta ejecución.`
                : `No encontramos una geometría CIREN ni una referencia SII con coordenadas para el ROL ${requestedRol}.`,
              requestedRol,
              resolution: {
                status: exactLookup.status,
                searchedLayers: exactLookup.searchedLayers,
                failedLayers: exactLookup.failedLayers,
                fallback: "sii_point_resolution",
              },
            },
            { status: temporarilyIncomplete ? 503 : 404, headers: { "Cache-Control": "private, no-store" } },
          )
        }

        targets = [selected[0]]
        exactResolutionSource = "sii"
      }
    } else {
      const core = await runProspectingIntelligenceCore(criteria, limit)
      priorityRols = core.priorityCases
        .filter((item) => item.kind === "off_market" && item.rol)
        .map((item) => String(item.rol))
        .slice(0, 3)
      targets = core.offMarketProspects
        .filter((item) => priorityRols.includes(item.rol) && item.centroid)
        .map((item) => ({
          id: item.id,
          rol: item.rol,
          region: null,
          commune: item.commune,
          areaHa: item.areaHa,
          declaredSpecies: item.declaredSpecies,
          surveyYear: item.surveyYear,
          sourceUrl: item.sourceUrl,
          centroid: item.centroid!,
          source: "ciren" as const,
        }))
    }

    const results = await Promise.all(targets.map(async (prospect) => {
      const polygon = prospect.sourceUrl ? await fetchCirenPolygon(prospect.sourceUrl, prospect.rol, prospect.commune) : null
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
        region: prospect.region ?? null,
        commune: prospect.commune,
        areaHa: prospect.areaHa,
        declaredSpecies: prospect.declaredSpecies,
        centroid: prospect.centroid,
        polygonAvailable: Boolean(polygon),
        polygon,
        satellite,
        memory,
        resolutionSource: prospect.source,
      }
      console.info("[Prospeccion Sentinel Diagnostics]", {
        rol: prospect.rol,
        region: result.region,
        commune: prospect.commune,
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
      criteria: requestedRol ? null : criteria,
      requestedRol: requestedRol || null,
      targetMode: requestedRol ? "exact-rol" : "priority-top-3",
      exactRolAreaFilterBypassed,
      resolution: exactLookup ? {
        status: exactLookup.status,
        searchedLayers: exactLookup.searchedLayers,
        failedLayers: exactLookup.failedLayers,
        source: exactResolutionSource,
      } : null,
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
