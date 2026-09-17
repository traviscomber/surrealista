import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

import type { ParcelSentinelObservation, SentinelPolygon } from "@/lib/prospeccion/sentinel-parcel-analysis"

type Point = { lat: number; lng: number }

type StoredObservation = {
  period_from: string
  period_to: string
  ndvi: number | string | null
  ndre: number | string | null
  ndmi: number | string | null
  sample_count: number
}

export type SentinelPersistentAnomaly = {
  level: "none" | "watch" | "strong" | "insufficient_data"
  direction: "above" | "below" | "similar" | "insufficient_data"
  latestDate: string | null
  latestNdvi: number | null
  seasonalBaselineNdvi: number | null
  ndviDelta: number | null
  latestNdmi: number | null
  seasonalBaselineNdmi: number | null
  ndmiDelta: number | null
  baselineCount: number
  interpretation: string
  methodology: "same-season-persisted-history"
}

export type SentinelMemoryStatus = {
  available: boolean
  persisted: boolean
  rowCount: number
  historyFrom: string | null
  historyTo: string | null
  geometryFingerprint: string
  anomaly: SentinelPersistentAnomaly
  note: string
}

const SOURCE = "copernicus-sentinel-2-l2a"
const DAY = 24 * 60 * 60 * 1000

function round(value: number | null, digits = 4) {
  return value == null || !Number.isFinite(value) ? null : Number(value.toFixed(digits))
}

function numeric(value: number | string | null) {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

export function normalizeRolKey(rol: string) {
  return rol.trim().toUpperCase().replace(/\s+/g, "")
}

export function canonicalSentinelPeriod(value: string) {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return null
  const from = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1))
  const to = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 1))
  return { from: from.toISOString(), to: to.toISOString() }
}

export function sentinelGeometryFingerprint(input: { polygon?: SentinelPolygon | null; centroid?: Point | null }) {
  const basis = input.polygon?.coordinates?.length
    ? { type: "Polygon", coordinates: input.polygon.coordinates }
    : {
        type: "PointFallback",
        lat: input.centroid ? Number(input.centroid.lat.toFixed(6)) : null,
        lng: input.centroid ? Number(input.centroid.lng.toFixed(6)) : null,
      }
  return createHash("sha256").update(JSON.stringify(basis)).digest("hex")
}

function emptyAnomaly(): SentinelPersistentAnomaly {
  return {
    level: "insufficient_data",
    direction: "insufficient_data",
    latestDate: null,
    latestNdvi: null,
    seasonalBaselineNdvi: null,
    ndviDelta: null,
    latestNdmi: null,
    seasonalBaselineNdmi: null,
    ndmiDelta: null,
    baselineCount: 0,
    interpretation: "Aún no existe suficiente historia persistida del mismo ROL y geometría para detectar una anomalía espectral.",
    methodology: "same-season-persisted-history",
  }
}

export function derivePersistentSentinelAnomaly(rows: StoredObservation[]): SentinelPersistentAnomaly {
  const ordered = [...rows]
    .filter((row) => Number.isFinite(Date.parse(row.period_from)))
    .sort((a, b) => a.period_from.localeCompare(b.period_from))
  const latest = [...ordered].reverse().find((row) => numeric(row.ndvi) != null)
  if (!latest) return emptyAnomaly()

  const latestMs = Date.parse(latest.period_from)
  const latestNdvi = numeric(latest.ndvi)
  const latestNdmi = numeric(latest.ndmi)
  if (latestNdvi == null) return emptyAnomaly()

  const comparable = ordered.filter((row) => {
    if (row === latest || numeric(row.ndvi) == null) return false
    const ageDays = (latestMs - Date.parse(row.period_from)) / DAY
    if (ageDays < 300) return false
    const years = Math.max(1, Math.round(ageDays / 365.25))
    const expectedDays = years * 365.25
    return Math.abs(ageDays - expectedDays) <= 45
  })

  if (!comparable.length) {
    return {
      ...emptyAnomaly(),
      latestDate: latest.period_from,
      latestNdvi,
      latestNdmi,
      interpretation: "El ROL ya tiene historia persistida, pero todavía no existe un período estacional comparable para detectar una anomalía.",
    }
  }

  const ndviBaselineValues = comparable.map((row) => numeric(row.ndvi)).filter((value): value is number => value != null)
  const ndmiBaselineValues = comparable.map((row) => numeric(row.ndmi)).filter((value): value is number => value != null)
  const seasonalBaselineNdvi = round(mean(ndviBaselineValues))
  const seasonalBaselineNdmi = round(mean(ndmiBaselineValues))
  const ndviDelta = seasonalBaselineNdvi == null ? null : round(latestNdvi - seasonalBaselineNdvi)
  const ndmiDelta = latestNdmi == null || seasonalBaselineNdmi == null ? null : round(latestNdmi - seasonalBaselineNdmi)

  const absolute = Math.abs(ndviDelta ?? 0)
  const level: SentinelPersistentAnomaly["level"] = ndviDelta == null
    ? "insufficient_data"
    : absolute >= 0.15
      ? "strong"
      : absolute >= 0.08
        ? "watch"
        : "none"
  const direction: SentinelPersistentAnomaly["direction"] = ndviDelta == null
    ? "insufficient_data"
    : ndviDelta >= 0.08
      ? "above"
      : ndviDelta <= -0.08
        ? "below"
        : "similar"

  const interpretation = level === "strong"
    ? `Cambio espectral fuerte: NDVI está ${direction === "above" ? "por encima" : "por debajo"} de la referencia estacional persistida del mismo ROL.`
    : level === "watch"
      ? `Cambio espectral a vigilar: NDVI está ${direction === "above" ? "por encima" : "por debajo"} de la referencia estacional persistida del mismo ROL.`
      : level === "none"
        ? "Sin anomalía espectral relevante: NDVI permanece cerca de la referencia estacional persistida del mismo ROL."
        : "No hay base suficiente para detectar una anomalía espectral."

  return {
    level,
    direction,
    latestDate: latest.period_from,
    latestNdvi: round(latestNdvi),
    seasonalBaselineNdvi,
    ndviDelta,
    latestNdmi: round(latestNdmi),
    seasonalBaselineNdmi,
    ndmiDelta,
    baselineCount: comparable.length,
    interpretation: `${interpretation} Los umbrales son heurísticos y no constituyen un diagnóstico agronómico.`,
    methodology: "same-season-persisted-history",
  }
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function syncSentinelMemory(input: {
  rol: string
  commune: string
  geometryMode: "ciren_polygon" | "centroid_fallback"
  polygon?: SentinelPolygon | null
  centroid?: Point | null
  observations: ParcelSentinelObservation[]
}): Promise<SentinelMemoryStatus> {
  const fingerprint = sentinelGeometryFingerprint({ polygon: input.polygon, centroid: input.centroid })
  const client = db()
  if (!client) {
    return {
      available: false,
      persisted: false,
      rowCount: 0,
      historyFrom: null,
      historyTo: null,
      geometryFingerprint: fingerprint,
      anomaly: emptyAnomaly(),
      note: "Memoria Sentinel no disponible porque faltan variables server-side de Supabase.",
    }
  }

  try {
    const rolKey = normalizeRolKey(input.rol)
    const fetchedAt = new Date().toISOString()
    const rows = input.observations.flatMap((observation) => {
      const period = canonicalSentinelPeriod(observation.from)
      if (!period) return []
      return [{
        rol: input.rol,
        rol_key: rolKey,
        commune: input.commune || "",
        source: SOURCE,
        geometry_mode: input.geometryMode,
        geometry_fingerprint: fingerprint,
        period_from: period.from,
        period_to: period.to,
        ndvi: observation.ndvi,
        ndre: observation.ndre,
        ndmi: observation.ndmi,
        sample_count: observation.sampleCount,
        fetched_at: fetchedAt,
        updated_at: fetchedAt,
      }]
    })

    if (rows.length) {
      const { error: upsertError } = await client
        .from("prospecting_sentinel_observations")
        .upsert(rows, { onConflict: "rol_key,source,geometry_fingerprint,period_from,period_to" })
      if (upsertError) throw upsertError
    }

    const { data, error } = await client
      .from("prospecting_sentinel_observations")
      .select("period_from,period_to,ndvi,ndre,ndmi,sample_count")
      .eq("rol_key", rolKey)
      .eq("source", SOURCE)
      .eq("geometry_fingerprint", fingerprint)
      .order("period_from", { ascending: true })
      .limit(120)
    if (error) throw error

    const history = (data ?? []) as StoredObservation[]
    return {
      available: true,
      persisted: rows.length > 0,
      rowCount: history.length,
      historyFrom: history[0]?.period_from ?? null,
      historyTo: history[history.length - 1]?.period_to ?? null,
      geometryFingerprint: fingerprint,
      anomaly: derivePersistentSentinelAnomaly(history),
      note: "Las observaciones se guardan por ROL, geometría y mes calendario; consultas repetidas actualizan el mismo registro en vez de duplicarlo.",
    }
  } catch (error) {
    console.warn("[Prospeccion Sentinel Memory] persistence unavailable", error instanceof Error ? error.message : "unknown error")
    return {
      available: false,
      persisted: false,
      rowCount: 0,
      historyFrom: null,
      historyTo: null,
      geometryFingerprint: fingerprint,
      anomaly: emptyAnomaly(),
      note: "Copernicus respondió, pero la memoria persistente no pudo actualizarse en esta ejecución.",
    }
  }
}
