import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

import type { ParcelSentinelObservation, SentinelPolygon } from "./sentinel-parcel-analysis"

type Point = { lat: number; lng: number }

type StoredObservation = ParcelSentinelObservation & {
  fetchedAt: string | null
}

export type SentinelHistorySignal = {
  state: "normal" | "watch" | "large_change" | "insufficient_history"
  latestDate: string | null
  latestNdvi: number | null
  referenceNdvi: number | null
  ndviDelta: number | null
  comparableCount: number
  methodology: "same-season-persistent-history"
  interpretation: string
}

export type SentinelHistoryResult = {
  persistence: "stored" | "read_only" | "unavailable"
  geometryFingerprint: string
  storedObservationCount: number
  firstStoredDate: string | null
  lastStoredDate: string | null
  signal: SentinelHistorySignal
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function rolKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase()
}

function round(value: number | null, digits = 4) {
  return value == null || !Number.isFinite(value) ? null : Number(value.toFixed(digits))
}

function median(values: number[]) {
  if (!values.length) return null
  const ordered = [...values].sort((a, b) => a - b)
  const middle = Math.floor(ordered.length / 2)
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2
}

function dayOfYear(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  const start = Date.UTC(date.getUTCFullYear(), 0, 1)
  return Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86_400_000) + 1
}

function seasonalDistance(a: number, b: number) {
  const diff = Math.abs(a - b)
  return Math.min(diff, 365 - diff)
}

export function derivePersistentHistorySignal(observations: ParcelSentinelObservation[]): SentinelHistorySignal {
  const valid = [...observations]
    .filter((entry): entry is ParcelSentinelObservation & { ndvi: number } => entry.ndvi != null && Number.isFinite(Date.parse(entry.from)))
    .sort((a, b) => a.from.localeCompare(b.from))

  const latest = valid[valid.length - 1]
  if (!latest) {
    return {
      state: "insufficient_history",
      latestDate: null,
      latestNdvi: null,
      referenceNdvi: null,
      ndviDelta: null,
      comparableCount: 0,
      methodology: "same-season-persistent-history",
      interpretation: "Todavía no existe una historia Sentinel suficiente para evaluar cambios del ROL.",
    }
  }

  const latestDay = dayOfYear(latest.from)
  const latestMs = Date.parse(latest.from)
  const comparable = latestDay == null ? [] : valid.filter((entry) => {
    if (entry === latest) return false
    const entryMs = Date.parse(entry.from)
    if (latestMs - entryMs < 180 * 86_400_000) return false
    const entryDay = dayOfYear(entry.from)
    return entryDay != null && seasonalDistance(latestDay, entryDay) <= 45
  })

  const reference = median(comparable.map((entry) => entry.ndvi))
  if (reference == null) {
    return {
      state: "insufficient_history",
      latestDate: latest.from,
      latestNdvi: round(latest.ndvi),
      referenceNdvi: null,
      ndviDelta: null,
      comparableCount: 0,
      methodology: "same-season-persistent-history",
      interpretation: "Hay una observación reciente, pero aún no existe un período histórico comparable guardado para este ROL.",
    }
  }

  const delta = round(latest.ndvi - reference)
  const magnitude = Math.abs(delta ?? 0)
  const state: SentinelHistorySignal["state"] = magnitude >= 0.18 ? "large_change" : magnitude >= 0.10 ? "watch" : "normal"
  const direction = (delta ?? 0) > 0 ? "por encima" : (delta ?? 0) < 0 ? "por debajo" : "en línea"
  const interpretation = state === "normal"
    ? `La señal NDVI reciente está dentro de un rango parecido a su referencia histórica de la misma época (${comparable.length} período${comparable.length === 1 ? "" : "s"} comparable${comparable.length === 1 ? "" : "s"}).`
    : `La señal NDVI reciente está ${direction} de su referencia histórica de la misma época por ${Math.abs(delta ?? 0).toFixed(3)}. Es una alerta espectral heurística para revisar, no un diagnóstico agronómico.`

  return {
    state,
    latestDate: latest.from,
    latestNdvi: round(latest.ndvi),
    referenceNdvi: round(reference),
    ndviDelta: delta,
    comparableCount: comparable.length,
    methodology: "same-season-persistent-history",
    interpretation,
  }
}

export function sentinelGeometryFingerprint(input: { polygon?: SentinelPolygon | null; centroid?: Point | null }) {
  const payload = input.polygon?.coordinates?.length
    ? { type: "Polygon", coordinates: input.polygon.coordinates }
    : { type: "PointFallback", lat: input.centroid?.lat ?? null, lng: input.centroid?.lng ?? null }
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex")
}

function fromRow(row: any): StoredObservation {
  const numeric = (value: unknown) => value == null || !Number.isFinite(Number(value)) ? null : Number(value)
  return {
    from: String(row.period_from),
    to: String(row.period_to),
    ndvi: numeric(row.ndvi),
    ndre: numeric(row.ndre),
    ndmi: numeric(row.ndmi),
    sampleCount: Number(row.sample_count || 0),
    fetchedAt: row.fetched_at ? String(row.fetched_at) : null,
  }
}

export async function persistAndReadSentinelHistory(input: {
  rol: string
  commune: string
  geometryMode: "ciren_polygon" | "centroid_fallback"
  polygon?: SentinelPolygon | null
  centroid?: Point | null
  observations: ParcelSentinelObservation[]
}): Promise<SentinelHistoryResult> {
  const client = db()
  const geometryFingerprint = sentinelGeometryFingerprint({ polygon: input.polygon, centroid: input.centroid })
  const key = rolKey(input.rol)

  if (!client) {
    return {
      persistence: "unavailable",
      geometryFingerprint,
      storedObservationCount: 0,
      firstStoredDate: null,
      lastStoredDate: null,
      signal: derivePersistentHistorySignal(input.observations),
    }
  }

  let persistence: SentinelHistoryResult["persistence"] = "read_only"
  if (input.observations.length) {
    const now = new Date().toISOString()
    const rows = input.observations.map((entry) => ({
      rol: input.rol,
      rol_key: key,
      commune: input.commune || "",
      source: "copernicus-sentinel-2-l2a",
      geometry_mode: input.geometryMode,
      geometry_fingerprint: geometryFingerprint,
      period_from: entry.from,
      period_to: entry.to,
      ndvi: entry.ndvi,
      ndre: entry.ndre,
      ndmi: entry.ndmi,
      sample_count: entry.sampleCount,
      fetched_at: now,
      updated_at: now,
    }))
    const { error } = await client
      .from("prospecting_sentinel_observations")
      .upsert(rows, { onConflict: "rol_key,source,geometry_fingerprint,period_from,period_to" })
    if (error) throw new Error(`Sentinel history persistence failed: ${error.message}`)
    persistence = "stored"
  }

  const { data, error } = await client
    .from("prospecting_sentinel_observations")
    .select("period_from,period_to,ndvi,ndre,ndmi,sample_count,fetched_at")
    .eq("rol_key", key)
    .eq("source", "copernicus-sentinel-2-l2a")
    .eq("geometry_fingerprint", geometryFingerprint)
    .order("period_from", { ascending: true })
    .limit(180)
  if (error) throw new Error(`Sentinel history read failed: ${error.message}`)

  const history = (data || []).map(fromRow)
  return {
    persistence,
    geometryFingerprint,
    storedObservationCount: history.length,
    firstStoredDate: history[0]?.from || null,
    lastStoredDate: history[history.length - 1]?.to || null,
    signal: derivePersistentHistorySignal(history),
  }
}
