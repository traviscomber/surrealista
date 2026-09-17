import type { ParcelSentinelObservation } from "./sentinel-parcel-analysis"

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
