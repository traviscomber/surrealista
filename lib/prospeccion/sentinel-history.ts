import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

import type { ParcelSentinelObservation, SentinelPolygon } from "./sentinel-parcel-analysis"
import { derivePersistentHistorySignal, type SentinelHistorySignal } from "./sentinel-history-signal"

export { derivePersistentHistorySignal } from "./sentinel-history-signal"
export type { SentinelHistorySignal } from "./sentinel-history-signal"

type Point = { lat: number; lng: number }

type StoredObservation = ParcelSentinelObservation & {
  fetchedAt: string | null
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
