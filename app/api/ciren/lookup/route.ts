import { NextRequest, NextResponse } from "next/server"

const CIREN_BASE = "https://esri.ciren.cl/server/rest/services/PROPIEDADES_RURALES_1/FeatureServer"

const ALLOWED_LAYERS = new Set([1, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 26])

// CIREN rural cadastral layers are useful as historical/reference evidence.
// They must never overwrite current SII or Sur Realista canonical values automatically.
const LAYER_YEAR: Record<number, number | null> = {
  1: null,
  14: null,
  15: null,
  16: null,
  17: null,
  19: null,
  20: null,
  21: null,
  22: null,
  23: null,
  24: 2016,
  25: null,
  26: null,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))
  const layer = Number(searchParams.get("layer") ?? "24")

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 })
  }

  if (lat < -60 || lat > -15 || lng < -80 || lng > -65) {
    return NextResponse.json({ error: "coordinates are outside Chile bounds" }, { status: 400 })
  }

  if (!ALLOWED_LAYERS.has(layer)) {
    return NextResponse.json({ error: "unsupported CIREN layer" }, { status: 400 })
  }

  const params = new URLSearchParams({
    f: "json",
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "rol,desccomu,comudere,provdere,regidere",
    returnGeometry: "false",
  })

  const url = `${CIREN_BASE}/${layer}/query?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "SurRealista/1.0 CIREN historical read-only lookup" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "CIREN upstream error", status: response.status },
        { status: 502 },
      )
    }

    const payload = await response.json()
    if (payload?.error) {
      return NextResponse.json({ error: "CIREN query error", details: payload.error }, { status: 502 })
    }

    const matches = Array.isArray(payload?.features)
      ? payload.features.map((feature: { attributes?: Record<string, unknown> }) => feature.attributes ?? {})
      : []

    return NextResponse.json({
      source: "CIREN",
      evidenceClass: "historical_reference",
      authoritativeForCurrentState: false,
      automaticOverwriteAllowed: false,
      datasetYear: LAYER_YEAR[layer] ?? null,
      layer,
      query: { lat, lng },
      count: matches.length,
      matches,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "CIREN lookup failed", details: error instanceof Error ? error.message : "unknown error" },
      { status: 502 },
    )
  }
}
