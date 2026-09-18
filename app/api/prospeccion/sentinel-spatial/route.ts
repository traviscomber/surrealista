import { NextRequest, NextResponse } from "next/server"

import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { getSentinelSpatialChange } from "@/lib/prospeccion/sentinel-spatial"
import type { SentinelPolygon } from "@/lib/prospeccion/sentinel-parcel-analysis"

export const runtime = "nodejs"
export const maxDuration = 30

type SpatialRequest = {
  polygon?: SentinelPolygon
  currentDate?: string
  referenceDate?: string
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  if (!(await verifyInternalAccessToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    )
  }

  try {
    const body = await request.json() as SpatialRequest
    if (!body.polygon || !body.currentDate || !body.referenceDate) {
      return NextResponse.json(
        { error: "Se requiere polígono CIREN y dos períodos comparables." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      )
    }

    const spatial = await getSentinelSpatialChange({
      polygon: body.polygon,
      currentDate: body.currentDate,
      referenceDate: body.referenceDate,
    })

    return NextResponse.json(spatial, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("[Prospeccion Sentinel Spatial] failed", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sentinel spatial analysis failed" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    )
  }
}
