import type { SentinelPolygon } from "./sentinel-parcel-analysis"

const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
const PROCESS_URL = "https://sh.dataspace.copernicus.eu/process/v1"
const WGS84 = "http://www.opengis.net/def/crs/OGC/1.3/CRS84"

let tokenCache: { token: string; expiresAt: number } | null = null

type SpatialPeriod = {
  from: string
  to: string
}

type SpatialBounds = {
  west: number
  south: number
  east: number
  north: number
}

export function sentinelSpatialPeriod(value: string): SpatialPeriod | null {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return null
  const from = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1))
  const to = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 1))
  return { from: from.toISOString(), to: to.toISOString() }
}

export function sentinelPolygonBounds(polygon: SentinelPolygon): SpatialBounds | null {
  const points = polygon.coordinates.flat().filter((point) =>
    Array.isArray(point) &&
    Number.isFinite(Number(point[0])) &&
    Number.isFinite(Number(point[1])),
  )
  if (!points.length) return null
  const lngs = points.map((point) => Number(point[0]))
  const lats = points.map((point) => Number(point[1]))
  return {
    west: Math.min(...lngs),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    north: Math.max(...lats),
  }
}

function rasterDimensions(bounds: SpatialBounds) {
  const centerLat = (bounds.south + bounds.north) / 2
  const widthMeters = Math.max(
    1,
    (bounds.east - bounds.west) * 111_320 * Math.max(0.2, Math.cos(centerLat * Math.PI / 180)),
  )
  const heightMeters = Math.max(1, (bounds.north - bounds.south) * 111_320)
  const maxSide = 512
  const minSide = 256
  if (widthMeters >= heightMeters) {
    return {
      width: maxSide,
      height: Math.max(minSide, Math.round(maxSide * heightMeters / widthMeters)),
    }
  }
  return {
    width: Math.max(minSide, Math.round(maxSide * widthMeters / heightMeters)),
    height: maxSide,
  }
}

const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: { bands: 4, sampleType: "AUTO" }
  }
}
function color(ndvi) {
  if (ndvi < 0.20) return [0.22, 0.24, 0.28]
  if (ndvi < 0.40) return [0.32, 0.40, 0.35]
  if (ndvi < 0.60) return [0.23, 0.52, 0.43]
  if (ndvi < 0.80) return [0.16, 0.68, 0.50]
  return [0.48, 0.82, 0.56]
}
function evaluatePixel(s) {
  const cloudy = [1, 3, 8, 9, 10, 11].includes(s.SCL)
  const denominator = s.B08 + s.B04
  const valid = s.dataMask && !cloudy && denominator !== 0
  if (!valid) return [0, 0, 0, 0]
  const ndvi = (s.B08 - s.B04) / denominator
  const rgb = color(ndvi)
  return [rgb[0], rgb[1], rgb[2], 0.82]
}`

export function buildSentinelSpatialRequest(input: {
  polygon: SentinelPolygon
  period: string
}) {
  const period = sentinelSpatialPeriod(input.period)
  const bounds = sentinelPolygonBounds(input.polygon)
  if (!period || !bounds) return null
  const dimensions = rasterDimensions(bounds)

  return {
    bounds,
    period,
    body: {
      input: {
        bounds: {
          geometry: input.polygon,
          properties: { crs: WGS84 },
        },
        data: [{
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: period,
            mosaickingOrder: "leastCC",
          },
        }],
      },
      output: {
        ...dimensions,
        responses: [{
          identifier: "default",
          format: { type: "image/png" },
        }],
      },
      evalscript: EVALSCRIPT,
    },
  }
}

async function accessToken() {
  const clientId = process.env.COPERNICUS_CLIENT_ID?.trim()
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Copernicus OAuth HTTP ${response.status}`)
  const payload = await response.json() as { access_token?: string; expires_in?: number }
  if (!payload.access_token) throw new Error("Copernicus OAuth returned no access token")
  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in || 600)) * 1000,
  }
  return tokenCache.token
}

export async function fetchSentinelSpatialPng(input: {
  polygon: SentinelPolygon
  period: string
}) {
  const request = buildSentinelSpatialRequest(input)
  if (!request) throw new Error("Invalid Sentinel spatial geometry or period")

  const token = await accessToken()
  if (!token) throw new Error("Copernicus credentials are not configured")

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(PROCESS_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "image/png",
      },
      body: JSON.stringify(request.body),
      cache: "no-store",
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Sentinel Process API HTTP ${response.status}`)
    return {
      bytes: await response.arrayBuffer(),
      bounds: request.bounds,
      period: request.period,
    }
  } finally {
    clearTimeout(timer)
  }
}
