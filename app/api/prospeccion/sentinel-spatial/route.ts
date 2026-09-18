import { NextRequest, NextResponse } from "next/server"

import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { fetchCirenParcelPolygon, isAllowedCirenParcelSource } from "@/lib/prospeccion/ciren-parcel-geometry"
import { fetchSentinelSpatialPng } from "@/lib/prospeccion/sentinel-spatial"

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
  const rol = searchParams.get("rol")?.trim() || ""
  const commune = searchParams.get("commune")?.trim() || ""
  const sourceUrl = searchParams.get("source")?.trim() || ""
  const period = searchParams.get("period")?.trim() || ""

  if (!rol || !period || !isAllowedCirenParcelSource(sourceUrl)) {
    return NextResponse.json(
      { error: "ROL, período y fuente CIREN válida son obligatorios." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    )
  }

  const polygon = await fetchCirenParcelPolygon(sourceUrl, rol, commune)
  if (!polygon) {
    return NextResponse.json(
      { error: "No se encontró un polígono CIREN utilizable para este ROL." },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    )
  }

  try {
    const raster = await fetchSentinelSpatialPng({ polygon, period })
    return new NextResponse(raster.bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "X-Sentinel-Geometry": "ciren_polygon",
        "X-Sentinel-Period-From": raster.period.from,
        "X-Sentinel-Period-To": raster.period.to,
      },
    })
  } catch (error) {
    console.error("[Prospeccion Sentinel Spatial] failed", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sentinel spatial processing failed" },
      { status: 502, headers: { "Cache-Control": "private, no-store" } },
    )
  }
}
