type Point = { lat: number; lng: number }

export type SentinelObservation = {
  from: string
  to: string
  ndvi: number | null
  ndre: number | null
  ndmi: number | null
  sampleCount: number
}

export type SentinelSatelliteEvidence = {
  status: "available" | "unconfigured" | "unavailable"
  source: "Copernicus Data Space / Sentinel-2 L2A"
  sourceUrl: string
  satelliteVerified: false
  classification: {
    state: "features_ready" | "pending_configuration" | "unavailable"
    predictedSpecies: null
    confidence: null
    reason: string
  }
  observations: SentinelObservation[]
  summary: {
    observationCount: number
    meanNdvi: number | null
    maxNdvi: number | null
    meanNdre: number | null
    meanNdmi: number | null
  }
  note: string
}

const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
const STATS_URL = "https://sh.dataspace.copernicus.eu/statistics/v1"
const SOURCE_URL = "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Statistical.html"

let tokenCache: { token: string; expiresAt: number } | null = null

function round(value: number | null, digits = 4) {
  return value == null || !Number.isFinite(value) ? null : Number(value.toFixed(digits))
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 12_000) {
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

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  })
  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
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

function bboxAround(point: Point, radiusMeters = 180) {
  const latDelta = radiusMeters / 111_320
  const lngDelta = radiusMeters / (111_320 * Math.max(0.2, Math.cos(point.lat * Math.PI / 180)))
  return [point.lng - lngDelta, point.lat - latDelta, point.lng + lngDelta, point.lat + latDelta]
}

const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B05", "B08", "B11", "SCL", "dataMask"] }],
    output: [
      { id: "indices", bands: [{ name: "NDVI" }, { name: "NDRE" }, { name: "NDMI" }], sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  }
}
function evaluatePixel(s) {
  const cloudy = [1, 3, 8, 9, 10, 11].includes(s.SCL)
  const valid = s.dataMask && !cloudy && (s.B08 + s.B04) !== 0 && (s.B08 + s.B05) !== 0 && (s.B08 + s.B11) !== 0
  const ndvi = valid ? (s.B08 - s.B04) / (s.B08 + s.B04) : 0
  const ndre = valid ? (s.B08 - s.B05) / (s.B08 + s.B05) : 0
  const ndmi = valid ? (s.B08 - s.B11) / (s.B08 + s.B11) : 0
  return { indices: [ndvi, ndre, ndmi], dataMask: [valid ? 1 : 0] }
}`

function empty(status: "unconfigured" | "unavailable", note: string): SentinelSatelliteEvidence {
  return {
    status,
    source: "Copernicus Data Space / Sentinel-2 L2A",
    sourceUrl: SOURCE_URL,
    satelliteVerified: false,
    classification: {
      state: status === "unconfigured" ? "pending_configuration" : "unavailable",
      predictedSpecies: null,
      confidence: null,
      reason: status === "unconfigured"
        ? "Faltan credenciales OAuth de Copernicus Data Space."
        : "No fue posible obtener una serie espectral utilizable.",
    },
    observations: [],
    summary: { observationCount: 0, meanNdvi: null, maxNdvi: null, meanNdre: null, meanNdmi: null },
    note,
  }
}

function bandMean(entry: any, bandName: string) {
  const bands = entry?.outputs?.indices?.bands ?? {}
  const direct = bands?.[bandName]?.stats?.mean
  if (Number.isFinite(Number(direct))) return Number(direct)
  const fallbackKeys = Object.keys(bands)
  const index = bandName === "NDVI" ? 0 : bandName === "NDRE" ? 1 : 2
  const fallback = bands?.[fallbackKeys[index]]?.stats?.mean
  return Number.isFinite(Number(fallback)) ? Number(fallback) : null
}

function sampleCount(entry: any) {
  const bands = entry?.outputs?.indices?.bands ?? {}
  const first = Object.values(bands)[0] as any
  return Number(first?.stats?.sampleCount || 0)
}

export async function getSentinelSatelliteEvidence(point: Point | null): Promise<SentinelSatelliteEvidence> {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return empty("unavailable", "El prospecto no tiene centroide válido para consultar Sentinel-2.")
  }

  let token: string | null = null
  try {
    token = await accessToken()
  } catch (error) {
    return empty("unavailable", `No fue posible autenticar Copernicus: ${error instanceof Error ? error.message : "error desconocido"}.`)
  }
  if (!token) {
    return empty("unconfigured", "Configura COPERNICUS_CLIENT_ID y COPERNICUS_CLIENT_SECRET para activar Sentinel-2 sin cambiar el contrato del agente.")
  }

  const to = new Date()
  const from = new Date(to)
  from.setUTCFullYear(from.getUTCFullYear() - 1)

  const request = {
    input: {
      bounds: {
        bbox: bboxAround(point),
        properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
      },
      data: [{
        type: "sentinel-2-l2a",
        dataFilter: { mosaickingOrder: "leastCC" },
      }],
    },
    aggregation: {
      timeRange: { from: from.toISOString(), to: to.toISOString() },
      aggregationInterval: { of: "P30D" },
      evalscript: EVALSCRIPT,
      resx: 10,
      resy: 10,
    },
  }

  try {
    const response = await fetchWithTimeout(STATS_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(request),
    }, 18_000)
    if (!response.ok) throw new Error(`Sentinel Statistical API HTTP ${response.status}`)
    const payload = await response.json() as { data?: any[] }
    const observations = (payload.data ?? []).map((entry): SentinelObservation => ({
      from: String(entry?.interval?.from || ""),
      to: String(entry?.interval?.to || ""),
      ndvi: round(bandMean(entry, "NDVI")),
      ndre: round(bandMean(entry, "NDRE")),
      ndmi: round(bandMean(entry, "NDMI")),
      sampleCount: sampleCount(entry),
    })).filter((entry) => entry.sampleCount > 0 && entry.ndvi != null)

    if (!observations.length) return empty("unavailable", "Sentinel-2 respondió sin observaciones válidas libres de nube para el área consultada.")
    const values = (key: "ndvi" | "ndre" | "ndmi") => observations.map((entry) => entry[key]).filter((value): value is number => value != null)
    const mean = (items: number[]) => items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : null
    const ndvi = values("ndvi")
    const ndre = values("ndre")
    const ndmi = values("ndmi")

    return {
      status: "available",
      source: "Copernicus Data Space / Sentinel-2 L2A",
      sourceUrl: SOURCE_URL,
      satelliteVerified: false,
      classification: {
        state: "features_ready",
        predictedSpecies: null,
        confidence: null,
        reason: "La serie NDVI/NDRE/NDMI está disponible, pero la clasificación por especie requiere un modelo validado con muestras CIREN separadas de entrenamiento y prueba.",
      },
      observations,
      summary: {
        observationCount: observations.length,
        meanNdvi: round(mean(ndvi)),
        maxNdvi: ndvi.length ? round(Math.max(...ndvi)) : null,
        meanNdre: round(mean(ndre)),
        meanNdmi: round(mean(ndmi)),
      },
      note: "Sentinel-2 aporta evidencia espectral independiente. No se marca una especie como verificada hasta entrenar y validar un clasificador; una coincidencia CIREN por sí sola no es validación satelital.",
    }
  } catch (error) {
    return empty("unavailable", `Sentinel-2 no estuvo disponible en esta ejecución: ${error instanceof Error ? error.message : "error desconocido"}.`)
  }
}
