import { NextResponse } from "next/server"
import { getDgaWaterRightsEvidence } from "@/lib/prospeccion/dga-water-rights"
import { getSentinelSatelliteEvidence } from "@/lib/prospeccion/sentinel-satellite"

export const runtime = "nodejs"
export const maxDuration = 30

function finiteNumber(value: string | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rol = searchParams.get("rol")?.trim() || null
  const region = searchParams.get("region")?.trim() || null
  const commune = searchParams.get("commune")?.trim() || null
  const lat = finiteNumber(searchParams.get("lat"))
  const lng = finiteNumber(searchParams.get("lng"))
  const point = lat != null && lng != null ? { lat, lng } : null

  const [waterRights, satellite] = await Promise.all([
    getDgaWaterRightsEvidence(region, commune),
    getSentinelSatelliteEvidence(point),
  ])

  return NextResponse.json({
    rol,
    region,
    commune,
    point,
    waterRights,
    satellite,
    guard: {
      waterRightAssociatedToRol: false,
      satelliteSpeciesVerified: false,
      authority: "deterministic_evidence_guard",
      note: "DGA por comuna y Sentinel-2 aportan evidencia de contexto. Ninguna de las dos fuentes, por sí sola, acredita asociación jurídica de un derecho de agua al ROL ni especie frutal verificada por satélite.",
    },
    methodology: "prospecting-enrichment-v1",
  })
}
