type MetadataRecord = Record<string, unknown>

function record(value: unknown): MetadataRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as MetadataRecord : null
}

function numeric(value: unknown) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const SENTINEL_CRON_BATCH_MAX = 24
export const SENTINEL_CRON_CONCURRENCY = 2

export function resolveSentinelCronBatchLimit(value: unknown) {
  if (value == null || value === "") return SENTINEL_CRON_BATCH_MAX
  const requested = Number(value)
  const safeRequested = Number.isFinite(requested) ? Math.floor(requested) : SENTINEL_CRON_BATCH_MAX
  return Math.max(1, Math.min(safeRequested, SENTINEL_CRON_BATCH_MAX))
}

export type SentinelCentroidTarget = {
  rol: string
  commune: string
  centroid: { lat: number; lng: number }
  source: "sii_point_resolution"
}

export function resolveSentinelCentroidTarget(metadata: unknown): SentinelCentroidTarget | null {
  const root = record(metadata)
  const sii = record(root?.sii_point_resolution)
  const siiRecord = record(sii?.record)
  const raw = record(siiRecord?.raw)
  const coordinates = record(siiRecord?.coordinates)

  const rol = String(siiRecord?.rol ?? "").trim()
  const commune = String(siiRecord?.comuna ?? raw?.nombreComuna ?? "").trim()
  const lat = numeric(coordinates?.lat)
  const lng = numeric(coordinates?.lng)

  if (!rol || !commune || lat == null || lng == null) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return {
    rol,
    commune,
    centroid: { lat, lng },
    source: "sii_point_resolution",
  }
}


export function normalizeSentinelRol(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\//g, "-")
    .replace(/\s+/g, "")
    .replace(/[^0-9K-]/g, "")
    .replace(/-+/g, "-")
}

export function resolveRequestedRolFromSiiMetadata(requestedRol: string, metadata: unknown) {
  const target = resolveSentinelCentroidTarget(metadata)
  if (!target) return null
  return normalizeSentinelRol(target.rol) === normalizeSentinelRol(requestedRol) ? target : null
}


export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<Array<PromiseSettledResult<R>>> {
  const safeConcurrency = Math.max(1, Math.floor(concurrency || 1))
  const results: Array<PromiseSettledResult<R>> = new Array(items.length)
  let cursor = 0

  async function runWorker() {
    while (true) {
      const index = cursor++
      if (index >= items.length) return
      try {
        results[index] = { status: "fulfilled", value: await worker(items[index], index) }
      } catch (reason) {
        results[index] = { status: "rejected", reason }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(safeConcurrency, items.length) }, () => runWorker()))
  return results
}
