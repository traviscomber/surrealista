export type KmzGeometryType = "Point" | "LineString" | "Polygon"

export interface KmzRenderablePlacemark {
  name: string
  type: KmzGeometryType
  coordinates: number[][]
  description?: string
  styleUrl?: string
  properties: Record<string, unknown>
}

interface GeometryContext {
  name: string
  description?: string
  declaredType?: string | null
  styleUrl?: string
  properties?: Record<string, unknown>
}

const COORDINATE_EPSILON = 1e-9

function isFiniteCoordinatePair(value: unknown): value is [number, number] {
  if (!Array.isArray(value) || value.length < 2) return false
  const lng = Number(value[0])
  const lat = Number(value[1])
  return Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
}

function sameCoordinate(a?: number[], b?: number[], epsilon = COORDINATE_EPSILON) {
  return Boolean(a && b && Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon)
}

function normalizeCoordinatePath(value: unknown): number[][] {
  if (!Array.isArray(value)) return []

  const normalized = value
    .filter(isFiniteCoordinatePair)
    .map((pair) => [Number(pair[0]), Number(pair[1])])

  return normalized.filter((coordinate, index) => index === 0 || !sameCoordinate(coordinate, normalized[index - 1]))
}

function closePolygon(coordinates: number[][]): number[][] {
  if (coordinates.length < 3) return coordinates
  if (sameCoordinate(coordinates[0], coordinates[coordinates.length - 1])) return coordinates
  return [...coordinates, [...coordinates[0]]]
}

function polygonMetrics(coordinates: number[][]) {
  if (coordinates.length < 3) return { area: 0, bboxArea: 0, closureRatio: Number.POSITIVE_INFINITY }
  const lngs = coordinates.map(([lng]) => lng)
  const lats = coordinates.map(([, lat]) => lat)
  const width = Math.max(...lngs) - Math.min(...lngs)
  const height = Math.max(...lats) - Math.min(...lats)
  const diagonal = Math.hypot(width, height)
  let doubleArea = 0
  for (let index = 0; index < coordinates.length; index += 1) {
    const [x1, y1] = coordinates[index]
    const [x2, y2] = coordinates[(index + 1) % coordinates.length]
    doubleArea += x1 * y2 - x2 * y1
  }
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  return {
    area: Math.abs(doubleArea) / 2,
    bboxArea: width * height,
    closureRatio: diagonal > 0 ? Math.hypot(first[0] - last[0], first[1] - last[1]) / diagonal : Number.POSITIVE_INFINITY,
  }
}

function looksLikeOpenPolygon(coordinates: number[][]) {
  const unique = new Set(coordinates.map(([lng, lat]) => `${lng.toFixed(8)}:${lat.toFixed(8)}`))
  if (unique.size < 3) return false
  const { area, bboxArea, closureRatio } = polygonMetrics(coordinates)
  if (bboxArea <= 0) return false
  const fillRatio = area / bboxArea
  return coordinates.length >= 4 && closureRatio <= 0.35 && fillRatio >= 0.03
}

export function isRenderableKmzPolygon(coordinates: number[][]) {
  if (coordinates.length < 4) return false
  const unique = new Set(coordinates.map(([lng, lat]) => `${lng.toFixed(8)}:${lat.toFixed(8)}`))
  if (unique.size < 3) return false
  const { area, bboxArea } = polygonMetrics(coordinates)
  return bboxArea > 0 && area > 0
}

export function inferKmzGeometryType(coordinates: number[][], declared?: string | null): KmzGeometryType {
  const normalizedDeclared = declared?.toLowerCase() || ""
  if (normalizedDeclared.includes("polygon")) return coordinates.length >= 3 ? "Polygon" : "Point"
  if (normalizedDeclared.includes("line")) return coordinates.length >= 2 ? "LineString" : "Point"
  if (normalizedDeclared.includes("point")) return "Point"
  if (coordinates.length <= 1) return "Point"
  if (sameCoordinate(coordinates[0], coordinates[coordinates.length - 1]) || looksLikeOpenPolygon(coordinates)) return "Polygon"
  return "LineString"
}

function placemarkFromPath(path: number[][], context: GeometryContext): KmzRenderablePlacemark | null {
  if (path.length === 0) return null

  const inferred = inferKmzGeometryType(path, context.declaredType)
  const coordinates = inferred === "Polygon" ? closePolygon(path) : path
  if (inferred === "Polygon" && !isRenderableKmzPolygon(coordinates)) return null
  if (inferred === "LineString" && coordinates.length < 2) return null

  return {
    name: context.name,
    type: inferred,
    coordinates,
    description: context.description,
    styleUrl: context.styleUrl,
    properties: {
      ...(context.properties || {}),
      geometryStatus: "real_geometry",
      isReferenceLocation: false,
      geometryNormalized: true,
    },
  }
}

function objectPoint(value: Record<string, unknown>, context: GeometryContext): KmzRenderablePlacemark | null {
  const latitude = Number(value.latitude ?? value.lat)
  const longitude = Number(value.longitude ?? value.lng ?? value.lon ?? value.long)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null

  return placemarkFromPath([[longitude, latitude]], {
    ...context,
    declaredType: "Point",
    name: typeof value.name === "string" && value.name ? value.name : context.name,
    description: typeof value.description === "string" ? value.description : context.description,
  })
}

function collectGeoJson(record: Record<string, unknown>, context: GeometryContext, output: KmzRenderablePlacemark[]) {
  const type = typeof record.type === "string" ? record.type.toLowerCase() : ""
  if (type === "feature") {
    if (record.geometry) collectGeometry(record.geometry, context, output)
    return true
  }
  if (type === "featurecollection" && Array.isArray(record.features)) {
    record.features.forEach((feature, index) => collectGeometry(feature, { ...context, name: `${context.name} · Capa ${index + 1}` }, output))
    return true
  }
  if (!record.coordinates) return false

  if (type === "polygon" && Array.isArray(record.coordinates)) {
    const outerRing = record.coordinates[0]
    const path = normalizeCoordinatePath(outerRing)
    const placemark = placemarkFromPath(path, { ...context, declaredType: "Polygon" })
    if (placemark) output.push(placemark)
    return true
  }

  if (type === "multipolygon" && Array.isArray(record.coordinates)) {
    record.coordinates.forEach((polygon, index) => {
      const outerRing = Array.isArray(polygon) ? polygon[0] : null
      const path = normalizeCoordinatePath(outerRing)
      const placemark = placemarkFromPath(path, {
        ...context,
        name: `${context.name} · Polígono ${index + 1}`,
        declaredType: "Polygon",
      })
      if (placemark) output.push(placemark)
    })
    return true
  }

  if (type === "linestring") {
    const placemark = placemarkFromPath(normalizeCoordinatePath(record.coordinates), { ...context, declaredType: "LineString" })
    if (placemark) output.push(placemark)
    return true
  }

  if (type === "multilinestring" && Array.isArray(record.coordinates)) {
    record.coordinates.forEach((line, index) => {
      const placemark = placemarkFromPath(normalizeCoordinatePath(line), {
        ...context,
        name: `${context.name} · Línea ${index + 1}`,
        declaredType: "LineString",
      })
      if (placemark) output.push(placemark)
    })
    return true
  }

  if (type === "point") {
    const point = isFiniteCoordinatePair(record.coordinates) ? [record.coordinates] : []
    const placemark = placemarkFromPath(point as number[][], { ...context, declaredType: "Point" })
    if (placemark) output.push(placemark)
    return true
  }

  return false
}

function collectGeometry(value: unknown, context: GeometryContext, output: KmzRenderablePlacemark[]) {
  if (value == null) return

  if (Array.isArray(value)) {
    const directPath = normalizeCoordinatePath(value)
    if (directPath.length > 0) {
      const placemark = placemarkFromPath(directPath, context)
      if (placemark) output.push(placemark)
      return
    }

    value.forEach((child, index) => {
      collectGeometry(child, {
        ...context,
        name: `${context.name} · Capa ${index + 1}`,
      }, output)
    })
    return
  }

  if (typeof value !== "object") return
  const record = value as Record<string, unknown>

  if (collectGeoJson(record, context, output)) return

  const point = objectPoint(record, context)
  if (point) {
    output.push(point)
    return
  }

  const nestedContext: GeometryContext = {
    name: typeof record.name === "string" && record.name ? record.name : context.name,
    description: typeof record.description === "string" ? record.description : context.description,
    declaredType: typeof record.type === "string"
      ? record.type
      : typeof record.geometryType === "string"
        ? record.geometryType
        : context.declaredType,
    styleUrl: typeof record.styleUrl === "string"
      ? record.styleUrl
      : typeof record.style_url === "string"
        ? record.style_url
        : context.styleUrl,
    properties: {
      ...(context.properties || {}),
      ...(record.properties && typeof record.properties === "object" && !Array.isArray(record.properties)
        ? record.properties as Record<string, unknown>
        : {}),
    },
  }

  const candidates = [
    record.coordinates,
    record.geometry,
    record.rings,
    record.paths,
    record.placemarks,
    record.outerBoundaryIs,
    record.linearRing,
    record.LinearRing,
  ]
  for (const candidate of candidates) {
    if (candidate != null) collectGeometry(candidate, nestedContext, output)
  }
}

function canonicalCoordinateSignature(placemark: KmzRenderablePlacemark) {
  const points = placemark.coordinates.map(([lng, lat]) => `${lng.toFixed(7)},${lat.toFixed(7)}`)
  if (placemark.type !== "Polygon" || points.length < 4) return `${placemark.type}:${points.join(";")}`

  const ring = points[0] === points[points.length - 1] ? points.slice(0, -1) : points
  if (ring.length === 0) return `${placemark.type}:`

  const rotations = (source: string[]) => source.map((_, index) => [...source.slice(index), ...source.slice(0, index)].join(";"))
  const forward = rotations(ring)
  const reverse = rotations([...ring].reverse())
  return `${placemark.type}:${[...forward, ...reverse].sort()[0]}`
}

export function extractKmzGeometry(
  value: unknown,
  options: {
    name: string
    description?: string
    declaredType?: string | null
    styleUrl?: string
    properties?: Record<string, unknown>
  },
): KmzRenderablePlacemark[] {
  const output: KmzRenderablePlacemark[] = []
  collectGeometry(value, options, output)

  const seen = new Set<string>()
  return output.filter((placemark) => {
    const signature = canonicalCoordinateSignature(placemark)
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}
