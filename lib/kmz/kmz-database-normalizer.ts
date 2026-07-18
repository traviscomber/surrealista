import { createHash } from "node:crypto"

export type Coordinate = [number, number, number?]
export type GeometryType = "Point" | "LineString" | "Polygon"

export interface StoredPlacemark {
  name?: string | null
  description?: string | null
  coordinates: unknown
  type?: string | null
  style_url?: string | null
  properties?: Record<string, unknown> | null
  region?: string | null
}

export interface KmzCollectionRecord {
  id: string
  file_name: string
  description?: string | null
  coordinates: unknown
  bounds?: unknown
  region?: string | null
  category?: string | null
  rol_numbers?: string[] | null
  metadata?: Record<string, unknown> | null
  placemarks_count?: number | null
}

export interface NormalizedPlacemark {
  name: string
  description: string
  coordinates: Coordinate[]
  type: GeometryType
  styleUrl?: string
  properties: Record<string, unknown>
  center: { lat: number; lng: number }
  bounds: { north: number; south: number; east: number; west: number }
  region?: string
}

export interface NormalizationProposal {
  coordinates: Coordinate[][]
  placemarks: NormalizedPlacemark[]
  bounds: { north: number; south: number; east: number; west: number }
  region?: string
  counts: { total: number; points: number; lines: number; polygons: number }
  source: "kmz_placemarks" | "kmz_collection.coordinates"
  hash: string
  validationErrors: string[]
}

function asCoordinate(value: unknown): Coordinate | null {
  if (!Array.isArray(value) || value.length < 2) return null
  const lng = Number(value[0])
  const lat = Number(value[1])
  const alt = value.length > 2 ? Number(value[2]) : undefined
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null
  return Number.isFinite(alt) ? [lng, lat, alt] : [lng, lat]
}

function normalizeCoordinates(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) return []
  const direct = value.map(asCoordinate).filter((point): point is Coordinate => point !== null)
  if (direct.length > 0) return direct
  if (value.length === 1 && Array.isArray(value[0])) return normalizeCoordinates(value[0])
  return []
}

function samePoint(a?: Coordinate, b?: Coordinate) {
  return Boolean(a && b && a[0] === b[0] && a[1] === b[1])
}

function inferType(coordinates: Coordinate[], declared?: string | null): GeometryType {
  const normalizedDeclared = declared?.toLowerCase()
  if (normalizedDeclared?.includes("polygon") && coordinates.length >= 4) return "Polygon"
  if (normalizedDeclared?.includes("line") && coordinates.length >= 2) return "LineString"
  if (normalizedDeclared?.includes("point") && coordinates.length >= 1) return "Point"
  if (coordinates.length === 1) return "Point"
  if (coordinates.length >= 4 && samePoint(coordinates[0], coordinates.at(-1))) return "Polygon"
  return "LineString"
}

function calculateBounds(coordinates: Coordinate[]) {
  const lngs = coordinates.map(([lng]) => lng)
  const lats = coordinates.map(([, lat]) => lat)
  return { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) }
}

function calculateCenter(coordinates: Coordinate[]) {
  const bounds = calculateBounds(coordinates)
  return { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }
}

function mergeBounds(placemarks: NormalizedPlacemark[]) {
  return placemarks.reduce(
    (result, item) => ({
      north: Math.max(result.north, item.bounds.north),
      south: Math.min(result.south, item.bounds.south),
      east: Math.max(result.east, item.bounds.east),
      west: Math.min(result.west, item.bounds.west),
    }),
    { north: -90, south: 90, east: -180, west: 180 },
  )
}

function dedupePlacemarks(placemarks: NormalizedPlacemark[]) {
  const seen = new Set<string>()
  return placemarks.filter((placemark) => {
    const key = `${placemark.type}:${JSON.stringify(placemark.coordinates)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function createPlacemark(
  record: KmzCollectionRecord,
  coordinates: Coordinate[],
  index: number,
  stored?: StoredPlacemark,
): NormalizedPlacemark {
  const type = inferType(coordinates, stored?.type)
  const typeLabel = type === "Polygon" ? "Polígono" : type === "LineString" ? "Línea" : "Punto"
  return {
    name: stored?.name?.trim() || `${record.file_name} · ${typeLabel} ${index + 1}`,
    description: stored?.description || record.description || "",
    coordinates,
    type,
    styleUrl: stored?.style_url || undefined,
    properties: {
      ...(stored?.properties || {}),
      rol: record.rol_numbers?.[index] || (stored?.properties?.rol as string | undefined) || "",
      category: record.category || (stored?.properties?.category as string | undefined) || "general",
      recoveredFrom: stored ? "kmz_placemarks" : "kmz_collection.coordinates",
    },
    center: calculateCenter(coordinates),
    bounds: calculateBounds(coordinates),
    region: stored?.region || record.region || undefined,
  }
}

export function normalizeKmzRecord(record: KmzCollectionRecord, storedPlacemarks: StoredPlacemark[] = []): NormalizationProposal {
  const validationErrors: string[] = []
  const sourceRows = storedPlacemarks.length > 0 ? storedPlacemarks : (Array.isArray(record.coordinates) ? record.coordinates : [])
  const placemarks = dedupePlacemarks(
    sourceRows.flatMap((row, index) => {
      const stored = storedPlacemarks.length > 0 ? (row as StoredPlacemark) : undefined
      const coordinates = normalizeCoordinates(stored ? stored.coordinates : row)
      if (coordinates.length === 0) {
        validationErrors.push(`Geometría ${index + 1} inválida o vacía`)
        return []
      }
      return [createPlacemark(record, coordinates, index, stored)]
    }),
  )

  if (placemarks.length === 0) validationErrors.push("No existe geometría válida recuperable en la base de datos")
  const counts = {
    total: placemarks.length,
    points: placemarks.filter(({ type }) => type === "Point").length,
    lines: placemarks.filter(({ type }) => type === "LineString").length,
    polygons: placemarks.filter(({ type }) => type === "Polygon").length,
  }
  const proposalWithoutHash = {
    coordinates: placemarks.map(({ coordinates }) => coordinates),
    placemarks,
    bounds: placemarks.length > 0 ? mergeBounds(placemarks) : { north: 0, south: 0, east: 0, west: 0 },
    region: record.region || undefined,
    counts,
    source: storedPlacemarks.length > 0 ? ("kmz_placemarks" as const) : ("kmz_collection.coordinates" as const),
    validationErrors,
  }
  return { ...proposalWithoutHash, hash: createHash("sha256").update(JSON.stringify(proposalWithoutHash)).digest("hex") }
}
