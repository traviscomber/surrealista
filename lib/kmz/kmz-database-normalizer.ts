import { createHash } from "node:crypto"

export type Coordinate = [number, number, number?]
export type GeometryType = "Point" | "LineString" | "Polygon"
export type GeometryStatus = "real_geometry" | "direct_reference" | "metadata_reference" | "sii_reference" | "bounds_reference"

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
  latitude?: number | string | null
  longitude?: number | string | null
  lat?: number | string | null
  lng?: number | string | null
  location?: unknown
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
  source: "kmz_placemarks" | "kmz_collection.coordinates" | "record_location"
  hash: string
  validationErrors: string[]
}

interface FallbackLocation {
  coordinate: Coordinate
  status: Exclude<GeometryStatus, "real_geometry">
  label: string
  source: string
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

function asLocationPoint(latValue: unknown, lngValue: unknown): Coordinate | null {
  const lat = Number(latValue)
  const lng = Number(lngValue)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null
  return [lng, lat]
}

function readObjectPoint(value: unknown): Coordinate | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>
  return (
    asLocationPoint(item.lat ?? item.latitude, item.lng ?? item.lon ?? item.long ?? item.longitude) ||
    asCoordinate(item.coordinates)
  )
}

function makeFallback(
  coordinate: Coordinate | null,
  status: FallbackLocation["status"],
  label: string,
  source: string,
): FallbackLocation | null {
  return coordinate ? { coordinate, status, label, source } : null
}

function getFallbackLocation(record: KmzCollectionRecord): FallbackLocation | null {
  const metadata = (record.metadata || {}) as Record<string, unknown>
  const siiResolution = metadata.sii_point_resolution as Record<string, unknown> | undefined
  const siiCenter = siiResolution?.center

  const candidates: Array<FallbackLocation | null> = [
    makeFallback(
      asLocationPoint(record.lat ?? record.latitude, record.lng ?? record.longitude),
      "direct_reference",
      "Punto registrado",
      "kmz_collection.lat_lng",
    ),
    makeFallback(readObjectPoint(record.location), "direct_reference", "Punto registrado", "kmz_collection.location"),
    makeFallback(
      asLocationPoint(metadata.lat ?? metadata.latitude, metadata.lng ?? metadata.lon ?? metadata.longitude),
      "metadata_reference",
      "Punto de metadata",
      "metadata.lat_lng",
    ),
    makeFallback(readObjectPoint(metadata.location), "metadata_reference", "Punto de metadata", "metadata.location"),
    makeFallback(readObjectPoint(metadata.center), "metadata_reference", "Centro de metadata", "metadata.center"),
    makeFallback(readObjectPoint(siiCenter), "sii_reference", "Centro territorial SII", "metadata.sii_point_resolution.center"),
  ]

  for (const candidate of candidates) {
    if (candidate) return candidate
  }

  if (record.bounds && typeof record.bounds === "object") {
    const bounds = record.bounds as Record<string, unknown>
    const north = Number(bounds.north)
    const south = Number(bounds.south)
    const east = Number(bounds.east)
    const west = Number(bounds.west)
    if ([north, south, east, west].every(Number.isFinite)) {
      return makeFallback(
        asLocationPoint((north + south) / 2, (east + west) / 2),
        "bounds_reference",
        "Centro aproximado",
        "kmz_collection.bounds",
      )
    }
  }

  return null
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
      geometryStatus: "real_geometry" satisfies GeometryStatus,
      isReferenceLocation: false,
    },
    center: calculateCenter(coordinates),
    bounds: calculateBounds(coordinates),
    region: stored?.region || record.region || undefined,
  }
}

function createLocationPlacemark(record: KmzCollectionRecord, fallback: FallbackLocation): NormalizedPlacemark {
  const coordinates = [fallback.coordinate]
  return {
    name: `${record.file_name} · ${fallback.label}`,
    description: record.description || `${fallback.label} disponible sin geometría detallada recuperada.`,
    coordinates,
    type: "Point",
    properties: {
      rol: record.rol_numbers?.[0] || "",
      category: record.category || "general",
      recoveredFrom: "record_location",
      geometryStatus: fallback.status,
      geometrySource: fallback.source,
      referenceLabel: fallback.label,
      isReferenceLocation: true,
    },
    center: calculateCenter(coordinates),
    bounds: calculateBounds(coordinates),
    region: record.region || undefined,
  }
}

export function normalizeKmzRecord(record: KmzCollectionRecord, storedPlacemarks: StoredPlacemark[] = []): NormalizationProposal {
  const validationErrors: string[] = []
  const sourceRows = storedPlacemarks.length > 0 ? storedPlacemarks : (Array.isArray(record.coordinates) ? record.coordinates : [])
  let placemarks = dedupePlacemarks(
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

  let source: NormalizationProposal["source"] = storedPlacemarks.length > 0 ? "kmz_placemarks" : "kmz_collection.coordinates"

  if (placemarks.length === 0) {
    const fallbackLocation = getFallbackLocation(record)
    if (fallbackLocation) {
      placemarks = [createLocationPlacemark(record, fallbackLocation)]
      source = "record_location"
      validationErrors.push(`Sin geometría detallada; se usa ${fallbackLocation.label.toLowerCase()}`)
    } else {
      validationErrors.push("No existe geometría válida ni ubicación recuperable en la base de datos")
    }
  }

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
    source,
    validationErrors,
  }
  return { ...proposalWithoutHash, hash: createHash("sha256").update(JSON.stringify(proposalWithoutHash)).digest("hex") }
}
