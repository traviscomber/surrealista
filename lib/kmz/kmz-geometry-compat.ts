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

function isFiniteCoordinatePair(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(Number(value[0]))
    && Number.isFinite(Number(value[1]))
}

function normalizeCoordinatePath(value: unknown): number[][] {
  if (!Array.isArray(value)) return []

  return value
    .filter(isFiniteCoordinatePair)
    .map((pair) => [Number(pair[0]), Number(pair[1])])
}

function closePolygon(coordinates: number[][]): number[][] {
  if (coordinates.length < 3) return coordinates
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) return coordinates
  return [...coordinates, [...first]]
}

export function isRenderableKmzPolygon(coordinates: number[][]) {
  if (coordinates.length < 4) return false
  const unique = new Set(coordinates.map(([lng, lat]) => `${lng.toFixed(8)}:${lat.toFixed(8)}`))
  return unique.size >= 3
}

export function inferKmzGeometryType(coordinates: number[][], declared?: string | null): KmzGeometryType {
  if (declared === "Polygon" || declared === "LineString" || declared === "Point") return declared
  if (coordinates.length <= 1) return "Point"

  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  return coordinates.length >= 4 && first?.[0] === last?.[0] && first?.[1] === last?.[1]
    ? "Polygon"
    : "LineString"
}

function placemarkFromPath(path: number[][], context: GeometryContext): KmzRenderablePlacemark | null {
  if (path.length === 0) return null

  const inferred = inferKmzGeometryType(path, context.declaredType)
  const coordinates = inferred === "Polygon" ? closePolygon(path) : path
  if (inferred === "Polygon" && !isRenderableKmzPolygon(coordinates)) return null

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
    },
  }
}

function objectPoint(value: Record<string, unknown>, context: GeometryContext): KmzRenderablePlacemark | null {
  const latitude = Number(value.latitude ?? value.lat)
  const longitude = Number(value.longitude ?? value.lng ?? value.lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return placemarkFromPath([[longitude, latitude]], {
    ...context,
    declaredType: "Point",
    name: typeof value.name === "string" && value.name ? value.name : context.name,
    description: typeof value.description === "string" ? value.description : context.description,
  })
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

  const candidates = [record.coordinates, record.geometry, record.rings, record.paths, record.placemarks]
  for (const candidate of candidates) {
    if (candidate != null) collectGeometry(candidate, nestedContext, output)
  }
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
    const signature = `${placemark.type}:${placemark.coordinates.map(([lng, lat]) => `${lng.toFixed(8)},${lat.toFixed(8)}`).join(";")}`
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}
