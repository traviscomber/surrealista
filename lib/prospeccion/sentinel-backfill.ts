type MetadataRecord = Record<string, unknown>

function record(value: unknown): MetadataRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as MetadataRecord : null
}

function numeric(value: unknown) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
