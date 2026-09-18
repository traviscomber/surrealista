import sharp from "sharp"

import type { SentinelPolygon } from "./sentinel-parcel-analysis"

type Bounds = [number, number, number, number]

export type SentinelSpatialChange = {
  status: "available" | "unconfigured" | "unavailable"
  source: "Copernicus Data Space / Sentinel-2 L2A"
  currentPeriod: { from: string; to: string } | null
  referencePeriod: { from: string; to: string } | null
  bounds: Bounds | null
  width: number | null
  height: number | null
  imageDataUrl: string | null
  summary: {
    validPixelCount: number
    lowerPct: number
    similarPct: number
    higherPct: number
    strongDecreasePct: number
    strongIncreasePct: number
  } | null
  methodology: "pixel-ndvi-change-current-vs-prior-year"
  note: string
}

const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
const PROCESS_URL = "https://sh.dataspace.copernicus.eu/process/v1"
const WGS84 = "http://www.opengis.net/def/crs/EPSG/0/4326"

const CHANGE_COLORS = [
  { key: "strongDecrease", rgb: [140, 56, 173] as const },
  { key: "watchDecrease", rgb: [184, 110, 199] as const },
  { key: "minorDecrease", rgb: [163, 161, 184] as const },
  { key: "similar", rgb: [122, 133, 143] as const },
  { key: "minorIncrease", rgb: [89, 166, 173] as const },
  { key: "watchIncrease", rgb: [43, 184, 173] as const },
  { key: "strongIncrease", rgb: [13, 209, 184] as const },
] as const

type ChangeBucket = typeof CHANGE_COLORS[number]["key"]

let tokenCache: { token: string; expiresAt: number } | null = null

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" })
  } finally {
    clearTimeout(timer)
  }
}

async function accessToken() {
  const clientId = process.env.COPERNICUS_CLIENT_ID?.trim()
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token

  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
  }, 12_000)
  if (!response.ok) throw new Error(`Copernicus OAuth HTTP ${response.status}`)
  const payload = await response.json() as { access_token?: string; expires_in?: number }
  if (!payload.access_token) throw new Error("Copernicus OAuth returned no access token")
  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in || 600)) * 1000,
  }
  return tokenCache.token
}

function validPolygon(polygon: SentinelPolygon | null | undefined) {
  if (!polygon || polygon.type !== "Polygon" || !Array.isArray(polygon.coordinates) || !polygon.coordinates.length) return null
  const rings = polygon.coordinates
    .map((ring) => ring
      .map((point) => [Number(point?.[0]), Number(point?.[1])])
      .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat)))
    .filter((ring) => ring.length >= 4)
  if (!rings.length || rings.reduce((sum, ring) => sum + ring.length, 0) > 10_000) return null
  return { type: "Polygon" as const, coordinates: rings }
}

function monthPeriod(value: string) {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return null
  const from = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1))
  const to = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 1))
  return { from: from.toISOString(), to: to.toISOString() }
}

function polygonBounds(polygon: SentinelPolygon): Bounds | null {
  const points = polygon.coordinates.flat()
  const lngs = points.map((point) => Number(point?.[0])).filter(Number.isFinite)
  const lats = points.map((point) => Number(point?.[1])).filter(Number.isFinite)
  if (!lngs.length || !lats.length) return null
  const bounds: Bounds = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
  if (bounds[2] <= bounds[0] || bounds[3] <= bounds[1]) return null
  if ((bounds[2] - bounds[0]) > 0.25 || (bounds[3] - bounds[1]) > 0.25) return null
  return bounds
}

function rasterSize(bounds: Bounds) {
  const centerLat = (bounds[1] + bounds[3]) / 2
  const widthMeters = (bounds[2] - bounds[0]) * 111_320 * Math.max(0.2, Math.cos(centerLat * Math.PI / 180))
  const heightMeters = (bounds[3] - bounds[1]) * 111_320
  const scale = Math.min(1, 640 / Math.max(widthMeters / 10, heightMeters / 10, 1))
  return {
    width: Math.max(160, Math.min(640, Math.round((widthMeters / 10) * scale))),
    height: Math.max(160, Math.min(640, Math.round((heightMeters / 10) * scale))),
  }
}

const CHANGE_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [
      { datasource: "current", bands: ["B04", "B08", "SCL", "dataMask"] },
      { datasource: "reference", bands: ["B04", "B08", "SCL", "dataMask"] }
    ],
    output: { bands: 4, sampleType: "AUTO" }
  }
}
function valid(s) {
  return s && s.dataMask && ![1, 3, 8, 9, 10, 11].includes(s.SCL) && (s.B08 + s.B04) !== 0
}
function ndvi(s) {
  return (s.B08 - s.B04) / (s.B08 + s.B04)
}
function evaluatePixel(samples) {
  const current = samples.current && samples.current[0]
  const reference = samples.reference && samples.reference[0]
  if (!valid(current) || !valid(reference)) return [0, 0, 0, 0]

  const delta = ndvi(current) - ndvi(reference)
  if (delta <= -0.15) return [0.55, 0.22, 0.68, 0.92]
  if (delta <= -0.08) return [0.72, 0.43, 0.78, 0.82]
  if (delta < -0.04) return [0.64, 0.63, 0.72, 0.48]
  if (delta <= 0.04) return [0.48, 0.52, 0.56, 0.22]
  if (delta < 0.08) return [0.35, 0.65, 0.68, 0.48]
  if (delta < 0.15) return [0.17, 0.72, 0.68, 0.82]
  return [0.05, 0.82, 0.72, 0.92]
}`

function nearestBucket(r: number, g: number, b: number): ChangeBucket {
  let best = CHANGE_COLORS[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of CHANGE_COLORS) {
    const distance =
      (r - candidate.rgb[0]) ** 2 +
      (g - candidate.rgb[1]) ** 2 +
      (b - candidate.rgb[2]) ** 2
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return best.key
}

export function summarizeSpatialPixels(raw: Uint8Array) {
  const counts: Record<ChangeBucket, number> = {
    strongDecrease: 0,
    watchDecrease: 0,
    minorDecrease: 0,
    similar: 0,
    minorIncrease: 0,
    watchIncrease: 0,
    strongIncrease: 0,
  }
  let validPixelCount = 0

  for (let index = 0; index + 3 < raw.length; index += 4) {
    const alpha = raw[index + 3]
    if (alpha < 8) continue
    const bucket = nearestBucket(raw[index], raw[index + 1], raw[index + 2])
    counts[bucket] += 1
    validPixelCount += 1
  }

  if (!validPixelCount) {
    return {
      validPixelCount: 0,
      lowerPct: 0,
      similarPct: 0,
      higherPct: 0,
      strongDecreasePct: 0,
      strongIncreasePct: 0,
    }
  }

  const pct = (count: number) => Math.round((count / validPixelCount) * 1000) / 10
  const lower = counts.strongDecrease + counts.watchDecrease + counts.minorDecrease
  const higher = counts.strongIncrease + counts.watchIncrease + counts.minorIncrease

  return {
    validPixelCount,
    lowerPct: pct(lower),
    similarPct: pct(counts.similar),
    higherPct: pct(higher),
    strongDecreasePct: pct(counts.strongDecrease),
    strongIncreasePct: pct(counts.strongIncrease),
  }
}

async function summarizeSpatialPng(bytes: Buffer) {
  const { data } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return summarizeSpatialPixels(data)
}

function empty(status: "unconfigured" | "unavailable", note: string): SentinelSpatialChange {
  return {
    status,
    source: "Copernicus Data Space / Sentinel-2 L2A",
    currentPeriod: null,
    referencePeriod: null,
    bounds: null,
    width: null,
    height: null,
    imageDataUrl: null,
    summary: null,
    methodology: "pixel-ndvi-change-current-vs-prior-year",
    note,
  }
}

export async function getSentinelSpatialChange(input: {
  polygon: SentinelPolygon
  currentDate: string
  referenceDate: string
}): Promise<SentinelSpatialChange> {
  const polygon = validPolygon(input.polygon)
  if (!polygon) return empty("unavailable", "El polígono CIREN no es utilizable para el análisis espacial.")
  const bounds = polygonBounds(polygon)
  if (!bounds) return empty("unavailable", "El polígono CIREN excede el tamaño permitido o no tiene límites válidos.")
  const currentPeriod = monthPeriod(input.currentDate)
  const referencePeriod = monthPeriod(input.referenceDate)
  if (!currentPeriod || !referencePeriod) return empty("unavailable", "No existen dos períodos válidos para comparar espacialmente.")

  let token: string | null = null
  try {
    token = await accessToken()
  } catch (error) {
    return empty("unavailable", `No fue posible autenticar Copernicus: ${error instanceof Error ? error.message : "error desconocido"}.`)
  }
  if (!token) return empty("unconfigured", "Faltan credenciales OAuth de Copernicus para generar la capa espacial.")

  const { width, height } = rasterSize(bounds)
  const request = {
    input: {
      bounds: { geometry: polygon, properties: { crs: WGS84 } },
      data: [
        {
          id: "current",
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: currentPeriod,
            mosaickingOrder: "leastCC",
          },
        },
        {
          id: "reference",
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: referencePeriod,
            mosaickingOrder: "leastCC",
          },
        },
      ],
    },
    output: {
      width,
      height,
      responses: [{ identifier: "default", format: { type: "image/png" } }],
    },
    evalscript: CHANGE_EVALSCRIPT,
  }

  try {
    const response = await fetchWithTimeout(PROCESS_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "image/png",
      },
      body: JSON.stringify(request),
    }, 20_000)
    if (!response.ok) throw new Error(`Sentinel Process API HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (!bytes.length) throw new Error("Sentinel Process API returned an empty raster")

    const summary = await summarizeSpatialPng(bytes)

    return {
      status: "available",
      source: "Copernicus Data Space / Sentinel-2 L2A",
      currentPeriod,
      referencePeriod,
      bounds,
      width,
      height,
      imageDataUrl: `data:image/png;base64,${bytes.toString("base64")}`,
      summary,
      methodology: "pixel-ndvi-change-current-vs-prior-year",
      note: "La capa compara NDVI píxel a píxel entre dos períodos equivalentes y está recortada por el polígono CIREN. Muestra cambio espectral, no causa agronómica, especie, rendimiento ni condición de riego.",
    }
  } catch (error) {
    return empty("unavailable", `No fue posible generar la capa espacial Sentinel-2: ${error instanceof Error ? error.message : "error desconocido"}.`)
  }
}
