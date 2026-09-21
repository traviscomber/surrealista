type Point = { lat: number; lng: number }

export type SentinelPolygon = {
  type: "Polygon"
  coordinates: number[][][]
}

export type ParcelSentinelObservation = {
  from: string
  to: string
  ndvi: number | null
  ndre: number | null
  ndmi: number | null
  sampleCount: number
}

export type InterannualSignal =
  | "large_increase"
  | "moderate_increase"
  | "similar"
  | "moderate_decrease"
  | "large_decrease"
  | "insufficient_data"

export type ParcelSentinelEvidence = {
  status: "available" | "unconfigured" | "unavailable"
  source: "Copernicus Data Space / Sentinel-2 L2A"
  sourceUrl: string
  geometryMode: "ciren_polygon" | "centroid_fallback"
  satelliteVerified: false
  observations: ParcelSentinelObservation[]
  summary: {
    observationCount: number
    meanNdvi: number | null
    maxNdvi: number | null
    meanNdre: number | null
    meanNdmi: number | null
  }
  temporal: {
    from: string | null
    to: string | null
    peakNdvi: { date: string; value: number } | null
    minimumNdvi: { date: string; value: number } | null
    ndviAmplitude: number | null
    recentNdviTrend: "rising" | "falling" | "stable" | "insufficient_data"
    recentNdviDelta: number | null
    recentNdmiTrend: "rising" | "falling" | "stable" | "insufficient_data"
    recentNdmiDelta: number | null
    annualVariationSignal: "high" | "moderate" | "low" | "insufficient_data"
    interpretation: string
  }
  baseline: {
    latestDate: string | null
    previousYearDate: string | null
    latestNdvi: number | null
    previousYearNdvi: number | null
    ndviDelta: number | null
    latestNdmi: number | null
    previousYearNdmi: number | null
    ndmiDelta: number | null
    signal: InterannualSignal
    interpretation: string
    methodology: "nearest-valid-period-about-one-year-earlier"
  }
  classification: {
    state: "features_ready" | "pending_configuration" | "unavailable"
    predictedSpecies: null
    confidence: null
    reason: string
  }
  note: string
  retryable: boolean
}

const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
const STATS_URL = "https://sh.dataspace.copernicus.eu/statistics/v1"
const SOURCE_URL = "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Statistical.html"
const WGS84 = "http://www.opengis.net/def/crs/EPSG/0/4326"

let tokenCache: { token: string; expiresAt: number } | null = null

function round(value: number | null, digits = 4) {
  return value == null || !Number.isFinite(value) ? null : Number(value.toFixed(digits))
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

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

function bboxAround(point: Point, radiusMeters = 180) {
  const latDelta = radiusMeters / 111_320
  const lngDelta = radiusMeters / (111_320 * Math.max(0.2, Math.cos(point.lat * Math.PI / 180)))
  return [point.lng - lngDelta, point.lat - latDelta, point.lng + lngDelta, point.lat + latDelta]
}

function validPolygon(polygon: SentinelPolygon | null | undefined) {
  if (!polygon || polygon.type !== "Polygon" || !Array.isArray(polygon.coordinates) || !polygon.coordinates.length) return null
  const rings = polygon.coordinates
    .map((ring) => ring
      .map((point) => [Number(point?.[0]), Number(point?.[1])])
      .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat)))
    .filter((ring) => ring.length >= 4)
  if (!rings.length) return null
  return { type: "Polygon" as const, coordinates: rings }
}

const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B05", "B08", "B11", "SCL", "dataMask"] }],
    output: [
      { id: "indices", bands: ["NDVI", "NDRE", "NDMI"], sampleType: "FLOAT32" },
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

function bandMean(entry: any, bandName: string) {
  const bands = entry?.outputs?.indices?.bands ?? {}
  const direct = bands?.[bandName]?.stats?.mean
  if (Number.isFinite(Number(direct))) return Number(direct)
  const keys = Object.keys(bands)
  const index = bandName === "NDVI" ? 0 : bandName === "NDRE" ? 1 : 2
  const fallback = bands?.[keys[index]]?.stats?.mean
  return Number.isFinite(Number(fallback)) ? Number(fallback) : null
}

function sampleCount(entry: any) {
  const bands = entry?.outputs?.indices?.bands ?? {}
  const first = Object.values(bands)[0] as any
  return Number(first?.stats?.sampleCount || 0)
}

function trend(values: Array<{ date: string; value: number }>) {
  if (values.length < 2) return { direction: "insufficient_data" as const, delta: null }
  const delta = round(values[values.length - 1].value - values[values.length - 2].value)
  if (delta == null) return { direction: "insufficient_data" as const, delta: null }
  if (delta > 0.03) return { direction: "rising" as const, delta }
  if (delta < -0.03) return { direction: "falling" as const, delta }
  return { direction: "stable" as const, delta }
}

function temporalAnalysis(observations: ParcelSentinelObservation[]): ParcelSentinelEvidence["temporal"] {
  const ordered = [...observations].sort((a, b) => a.from.localeCompare(b.from))
  const ndvi = ordered.filter((entry): entry is ParcelSentinelObservation & { ndvi: number } => entry.ndvi != null).map((entry) => ({ date: entry.from, value: entry.ndvi }))
  const ndmi = ordered.filter((entry): entry is ParcelSentinelObservation & { ndmi: number } => entry.ndmi != null).map((entry) => ({ date: entry.from, value: entry.ndmi }))
  if (!ndvi.length) {
    return {
      from: null, to: null, peakNdvi: null, minimumNdvi: null, ndviAmplitude: null,
      recentNdviTrend: "insufficient_data", recentNdviDelta: null,
      recentNdmiTrend: "insufficient_data", recentNdmiDelta: null,
      annualVariationSignal: "insufficient_data",
      interpretation: "No hay una serie temporal suficiente para describir cambios espectrales.",
    }
  }

  const currentYearStart = Date.now() - 370 * 24 * 60 * 60 * 1000
  const currentYearNdvi = ndvi.filter((entry) => Date.parse(entry.date) >= currentYearStart)
  const basis = currentYearNdvi.length ? currentYearNdvi : ndvi.slice(-12)
  const peak = basis.reduce((best, current) => current.value > best.value ? current : best)
  const minimum = basis.reduce((best, current) => current.value < best.value ? current : best)
  const amplitude = round(peak.value - minimum.value)
  const ndviTrend = trend(ndvi)
  const ndmiTrend = trend(ndmi)
  const annualVariationSignal = amplitude == null ? "insufficient_data" : amplitude >= 0.35 ? "high" : amplitude >= 0.18 ? "moderate" : "low"

  const ndviText = ndviTrend.direction === "rising" ? "NDVI aumenta en el último intervalo válido." : ndviTrend.direction === "falling" ? "NDVI disminuye en el último intervalo válido." : ndviTrend.direction === "stable" ? "NDVI cambia poco en el último intervalo válido." : "No hay suficientes puntos recientes para describir NDVI."
  const ndmiText = ndmiTrend.direction === "rising" ? "NDMI aumenta en el último intervalo válido." : ndmiTrend.direction === "falling" ? "NDMI disminuye en el último intervalo válido." : ndmiTrend.direction === "stable" ? "NDMI cambia poco en el último intervalo válido." : "No hay suficientes puntos recientes para describir NDMI."

  return {
    from: ordered[0]?.from || null,
    to: ordered[ordered.length - 1]?.to || null,
    peakNdvi: { date: peak.date, value: round(peak.value) ?? peak.value },
    minimumNdvi: { date: minimum.date, value: round(minimum.value) ?? minimum.value },
    ndviAmplitude: amplitude,
    recentNdviTrend: ndviTrend.direction,
    recentNdviDelta: ndviTrend.delta,
    recentNdmiTrend: ndmiTrend.direction,
    recentNdmiDelta: ndmiTrend.delta,
    annualVariationSignal,
    interpretation: `${ndviText} ${ndmiText} Son cambios espectrales; por sí solos no prueban especie, calidad, riego ni estrés hídrico.`,
  }
}

export function deriveInterannualBaseline(observations: ParcelSentinelObservation[]): ParcelSentinelEvidence["baseline"] {
  const valid = [...observations]
    .filter((entry): entry is ParcelSentinelObservation & { ndvi: number } => entry.ndvi != null && Number.isFinite(Date.parse(entry.from)))
    .sort((a, b) => a.from.localeCompare(b.from))
  const latest = valid[valid.length - 1]
  if (!latest) {
    return {
      latestDate: null, previousYearDate: null, latestNdvi: null, previousYearNdvi: null, ndviDelta: null,
      latestNdmi: null, previousYearNdmi: null, ndmiDelta: null, signal: "insufficient_data",
      interpretation: "No hay observaciones suficientes para comparar con el año anterior.",
      methodology: "nearest-valid-period-about-one-year-earlier",
    }
  }

  const latestMs = Date.parse(latest.from)
  const targetMs = latestMs - 365.25 * 24 * 60 * 60 * 1000
  const candidates = valid.filter((entry) => {
    const distanceDays = Math.abs(Date.parse(entry.from) - targetMs) / (24 * 60 * 60 * 1000)
    return distanceDays <= 60
  })
  const previous = candidates.sort((a, b) => Math.abs(Date.parse(a.from) - targetMs) - Math.abs(Date.parse(b.from) - targetMs))[0]
  if (!previous) {
    return {
      latestDate: latest.from, previousYearDate: null, latestNdvi: latest.ndvi, previousYearNdvi: null, ndviDelta: null,
      latestNdmi: latest.ndmi, previousYearNdmi: null, ndmiDelta: null, signal: "insufficient_data",
      interpretation: "Hay dato reciente, pero no existe un período válido comparable alrededor de un año antes.",
      methodology: "nearest-valid-period-about-one-year-earlier",
    }
  }

  const ndviDelta = round(latest.ndvi - previous.ndvi)
  const ndmiDelta = latest.ndmi != null && previous.ndmi != null ? round(latest.ndmi - previous.ndmi) : null
  const signal: InterannualSignal = ndviDelta == null ? "insufficient_data" : ndviDelta >= 0.15 ? "large_increase" : ndviDelta >= 0.08 ? "moderate_increase" : ndviDelta <= -0.15 ? "large_decrease" : ndviDelta <= -0.08 ? "moderate_decrease" : "similar"
  const interpretation = signal === "large_increase" ? "NDVI está bastante por encima del período comparable del año anterior." : signal === "moderate_increase" ? "NDVI está moderadamente por encima del período comparable del año anterior." : signal === "large_decrease" ? "NDVI está bastante por debajo del período comparable del año anterior." : signal === "moderate_decrease" ? "NDVI está moderadamente por debajo del período comparable del año anterior." : signal === "similar" ? "NDVI está en un rango parecido al período comparable del año anterior." : "No hay base suficiente para comparar interanualmente."

  return {
    latestDate: latest.from,
    previousYearDate: previous.from,
    latestNdvi: latest.ndvi,
    previousYearNdvi: previous.ndvi,
    ndviDelta,
    latestNdmi: latest.ndmi,
    previousYearNdmi: previous.ndmi,
    ndmiDelta,
    signal,
    interpretation: `${interpretation} La etiqueta usa umbrales heurísticos de cambio espectral y no es un diagnóstico agronómico.`,
    methodology: "nearest-valid-period-about-one-year-earlier",
  }
}

function empty(status: "unconfigured" | "unavailable", geometryMode: ParcelSentinelEvidence["geometryMode"], note: string, retryable = false): ParcelSentinelEvidence {
  return {
    status,
    source: "Copernicus Data Space / Sentinel-2 L2A",
    sourceUrl: SOURCE_URL,
    geometryMode,
    satelliteVerified: false,
    observations: [],
    summary: { observationCount: 0, meanNdvi: null, maxNdvi: null, meanNdre: null, meanNdmi: null },
    temporal: temporalAnalysis([]),
    baseline: deriveInterannualBaseline([]),
    classification: {
      state: status === "unconfigured" ? "pending_configuration" : "unavailable",
      predictedSpecies: null,
      confidence: null,
      reason: status === "unconfigured" ? "Faltan credenciales OAuth de Copernicus Data Space." : "No fue posible obtener una serie espectral utilizable.",
    },
    note,
    retryable,
  }
}

export function isRetryableSentinelProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  const name = error && typeof error === "object" && "name" in error
    ? String((error as { name?: unknown }).name ?? "")
    : ""
  if (name === "AbortError") return true
  return /HTTP (?:429|5\\d\\d)\\b/i.test(message)
    || /(?:fetch failed|network|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up)/i.test(message)
}

export async function getSentinelParcelEvidence(input: { centroid: Point | null; polygon?: SentinelPolygon | null }): Promise<ParcelSentinelEvidence> {
  const polygon = validPolygon(input.polygon)
  const geometryMode: ParcelSentinelEvidence["geometryMode"] = polygon ? "ciren_polygon" : "centroid_fallback"
  if (!polygon && (!input.centroid || !Number.isFinite(input.centroid.lat) || !Number.isFinite(input.centroid.lng))) {
    return empty("unavailable", geometryMode, "El ROL no tiene polígono CIREN ni centroide válido para consultar Sentinel-2.")
  }

  let token: string | null = null
  try {
    token = await accessToken()
  } catch (error) {
    return empty("unavailable", geometryMode, `No fue posible autenticar Copernicus: ${error instanceof Error ? error.message : "error desconocido"}.`, isRetryableSentinelProviderError(error))
  }
  if (!token) return empty("unconfigured", geometryMode, "Configura las credenciales OAuth de Copernicus para activar el análisis Sentinel-2.")

  const now = new Date()
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const from = new Date(Date.UTC(to.getUTCFullYear() - 2, to.getUTCMonth(), 1))
  const bounds = polygon
    ? { geometry: polygon, properties: { crs: WGS84 } }
    : { bbox: bboxAround(input.centroid as Point), properties: { crs: WGS84 } }

  const request = {
    input: {
      bounds,
      data: [{ type: "sentinel-2-l2a", dataFilter: { mosaickingOrder: "leastCC" } }],
    },
    aggregation: {
      timeRange: { from: from.toISOString(), to: to.toISOString() },
      aggregationInterval: { of: "P1M" },
      evalscript: EVALSCRIPT,
      resx: 10,
      resy: 10,
    },
  }

  try {
    const response = await fetchWithTimeout(STATS_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(request),
    }, 22_000)
    if (!response.ok) throw new Error(`Sentinel Statistical API HTTP ${response.status}`)
    const payload = await response.json() as { data?: any[] }
    const observations = (payload.data ?? []).map((entry): ParcelSentinelObservation => ({
      from: String(entry?.interval?.from || ""),
      to: String(entry?.interval?.to || ""),
      ndvi: round(bandMean(entry, "NDVI")),
      ndre: round(bandMean(entry, "NDRE")),
      ndmi: round(bandMean(entry, "NDMI")),
      sampleCount: sampleCount(entry),
    })).filter((entry) => entry.sampleCount > 0 && entry.ndvi != null)

    if (!observations.length) return empty("unavailable", geometryMode, "Sentinel-2 respondió sin observaciones válidas libres de nube para el área consultada.")
    const values = (key: "ndvi" | "ndre" | "ndmi") => observations.map((entry) => entry[key]).filter((value): value is number => value != null)
    const ndvi = values("ndvi")
    const ndre = values("ndre")
    const ndmi = values("ndmi")

    return {
      status: "available",
      source: "Copernicus Data Space / Sentinel-2 L2A",
      sourceUrl: SOURCE_URL,
      geometryMode,
      satelliteVerified: false,
      observations,
      summary: {
        observationCount: observations.length,
        meanNdvi: round(mean(ndvi)),
        maxNdvi: ndvi.length ? round(Math.max(...ndvi)) : null,
        meanNdre: round(mean(ndre)),
        meanNdmi: round(mean(ndmi)),
      },
      temporal: temporalAnalysis(observations),
      baseline: deriveInterannualBaseline(observations),
      classification: {
        state: "features_ready",
        predictedSpecies: null,
        confidence: null,
        reason: "La serie espectral está disponible, pero identificar especie requiere un clasificador validado con muestras independientes.",
      },
      note: polygon
        ? "Sentinel-2 fue calculado sobre el polígono oficial CIREN del ROL. Los índices describen respuesta espectral; no verifican por sí solos especie, calidad, riego ni estrés hídrico."
        : "No se recuperó un polígono CIREN utilizable; Sentinel-2 usó una ventana alrededor del centroide como fallback. Los índices no verifican por sí solos especie, calidad, riego ni estrés hídrico.",
      retryable: false,
    }
  } catch (error) {
    return empty("unavailable", geometryMode, `Sentinel-2 no estuvo disponible en esta ejecución: ${error instanceof Error ? error.message : "error desconocido"}.`, isRetryableSentinelProviderError(error))
  }
}
