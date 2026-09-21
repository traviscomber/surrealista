import { derivePersistentSentinelAnomaly, type SentinelPersistentAnomaly } from "./sentinel-memory"

export type SentinelAttentionRow = {
  rol: string
  rol_key: string
  commune: string
  geometry_mode: string
  geometry_fingerprint: string
  period_from: string
  period_to: string
  ndvi: number | string | null
  ndre: number | string | null
  ndmi: number | string | null
  sample_count: number
  fetched_at?: string | null
}

export type SentinelAttentionItem = {
  rol: string
  commune: string
  geometryMode: string
  geometryFingerprint: string
  observationCount: number
  latestPeriod: string | null
  latest: { ndvi: number | null; ndre: number | null; ndmi: number | null }
  anomaly: SentinelPersistentAnomaly
  severityScore: number
}

export type SentinelAttentionSummary = {
  monitoredRols: number
  actionableCount: number
  strongCount: number
  watchCount: number
  insufficientCount: number
  generatedAt: string
  items: SentinelAttentionItem[]
}

function latestMs(rows: SentinelAttentionRow[]) {
  return rows.reduce((max, row) => Math.max(max, Date.parse(row.period_from) || 0), 0)
}

function severityScore(anomaly: SentinelPersistentAnomaly) {
  const base = anomaly.level === "strong" ? 200 : anomaly.level === "watch" ? 100 : 0
  return base + Math.round(Math.abs(anomaly.ndviDelta ?? 0) * 1000)
}

export function deriveSentinelAttentionQueue(rows: SentinelAttentionRow[], now = new Date()): SentinelAttentionSummary {
  const byRolAndGeometry = new Map<string, SentinelAttentionRow[]>()
  for (const row of rows) {
    const key = `${row.rol_key}::${row.geometry_fingerprint}`
    const current = byRolAndGeometry.get(key) ?? []
    current.push(row)
    byRolAndGeometry.set(key, current)
  }

  const candidatesByRol = new Map<string, SentinelAttentionItem[]>()
  let insufficientCount = 0

  for (const group of byRolAndGeometry.values()) {
    const ordered = [...group].sort((a, b) => a.period_from.localeCompare(b.period_from))
    const anomaly = derivePersistentSentinelAnomaly(ordered)
    if (anomaly.level === "insufficient_data") insufficientCount += 1
    const first = ordered[0]
    if (!first) continue
    const item: SentinelAttentionItem = {
      rol: first.rol,
      commune: first.commune,
      geometryMode: first.geometry_mode,
      geometryFingerprint: first.geometry_fingerprint,
      observationCount: ordered.length,
      latestPeriod: anomaly.latestDate ?? ordered.at(-1)?.period_from ?? null,
      latest: {
        ndvi: ordered.at(-1)?.ndvi == null ? null : Number(ordered.at(-1)?.ndvi),
        ndre: ordered.at(-1)?.ndre == null ? null : Number(ordered.at(-1)?.ndre),
        ndmi: ordered.at(-1)?.ndmi == null ? null : Number(ordered.at(-1)?.ndmi),
      },
      anomaly,
      severityScore: severityScore(anomaly),
    }
    const current = candidatesByRol.get(first.rol_key) ?? []
    current.push(item)
    candidatesByRol.set(first.rol_key, current)
  }

  const monitored = [...candidatesByRol.values()].map((items) => [...items].sort((a, b) => {
    const polygonPreference = Number(b.geometryMode === "ciren_polygon") - Number(a.geometryMode === "ciren_polygon")
    if (polygonPreference) return polygonPreference
    const latestDifference = latestMs(rows.filter((row) => row.geometry_fingerprint === b.geometryFingerprint)) - latestMs(rows.filter((row) => row.geometry_fingerprint === a.geometryFingerprint))
    if (latestDifference) return latestDifference
    return b.observationCount - a.observationCount
  })[0]).filter((item): item is SentinelAttentionItem => Boolean(item))

  const items = monitored
    .filter((item) => item.anomaly.level === "watch" || item.anomaly.level === "strong")
    .sort((a, b) => b.severityScore - a.severityScore || a.rol.localeCompare(b.rol, "es-CL"))

  return {
    monitoredRols: monitored.length,
    actionableCount: items.length,
    strongCount: items.filter((item) => item.anomaly.level === "strong").length,
    watchCount: items.filter((item) => item.anomaly.level === "watch").length,
    insufficientCount,
    generatedAt: now.toISOString(),
    items,
  }
}
