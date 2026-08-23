export type CirenNeighborRelation = "same_property" | "adjacent" | "nearby"

export interface CirenLayerConfig {
  layerId: number
  sourceYear: number | null
}

export interface CirenNeighbor {
  sourceObjectId: string
  rol: string | null
  comuna: string | null
  relation: CirenNeighborRelation
  distanceM: number
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown }
  properties: Record<string, unknown>
}

const SERVICE = "https://esri.ciren.cl/server/rest/services/IDEMINAGRI/PROPIEDADES_RURALES/MapServer"

// Layer ids and vintage are published by CIREN's IDE Minagri service.
// Keep this explicit so provenance and staleness are visible to CAMPOS.
const REGION_LAYERS: Record<string, CirenLayerConfig> = {
  "Región de Arica y Parinacota": { layerId: 0, sourceYear: 2021 },
  "Tarapacá": { layerId: 1, sourceYear: 2021 },
  "Antofagasta": { layerId: 2, sourceYear: 2021 },
  "Atacama": { layerId: 3, sourceYear: 2020 },
  "Coquimbo": { layerId: 4, sourceYear: 2020 },
  "Valparaíso": { layerId: 5, sourceYear: 2022 },
  "Metropolitana": { layerId: 6, sourceYear: 2023 },
  "Libertador General Bernardo O'Higgins": { layerId: 7, sourceYear: 2021 },
  "Región del Maule": { layerId: 8, sourceYear: 2021 },
  "Ñuble": { layerId: 9, sourceYear: 2021 },
  "Bío Bío": { layerId: 10, sourceYear: 2021 },
  "La Araucanía": { layerId: 11, sourceYear: 2021 },
  "Los Ríos": { layerId: 12, sourceYear: 2019 },
  "Los Lagos": { layerId: 13, sourceYear: 2016 },
  "Región de Aysén del General Carlos Ibáñez del Campo": { layerId: 14, sourceYear: 2004 },
  "Magallanes y de la Antártica Chilena": { layerId: 15, sourceYear: 2021 },
}

export function getCirenLayer(region: string) {
  return REGION_LAYERS[region] || null
}

function polygonRings(geometry: any): number[][][] {
  if (!geometry || !Array.isArray(geometry.coordinates)) return []
  if (geometry.type === "Polygon") return geometry.coordinates.filter(Array.isArray)
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon: any) => Array.isArray(polygon) ? polygon : [])
  return []
}

function bboxFromGeometry(geometry: any) {
  const points = polygonRings(geometry).flat().filter((p) => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])))
  if (!points.length) return null
  const lngs = points.map((p) => Number(p[0]))
  const lats = points.map((p) => Number(p[1]))
  return { west: Math.min(...lngs), east: Math.max(...lngs), south: Math.min(...lats), north: Math.max(...lats) }
}

function centerOfBbox(b: { west: number; east: number; south: number; north: number }) {
  return { lng: (b.west + b.east) / 2, lat: (b.south + b.north) / 2 }
}

function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(h))
}

function bboxGapMeters(a: ReturnType<typeof bboxFromGeometry>, b: ReturnType<typeof bboxFromGeometry>) {
  if (!a || !b) return Number.POSITIVE_INFINITY
  const lat = (a.south + a.north + b.south + b.north) / 4
  const dxDeg = Math.max(0, Math.max(a.west, b.west) - Math.min(a.east, b.east))
  const dyDeg = Math.max(0, Math.max(a.south, b.south) - Math.min(a.north, b.north))
  const dx = dxDeg * 111320 * Math.max(0.1, Math.cos(lat * Math.PI / 180))
  const dy = dyDeg * 110540
  return Math.hypot(dx, dy)
}

function bboxOverlapRatio(a: ReturnType<typeof bboxFromGeometry>, b: ReturnType<typeof bboxFromGeometry>) {
  if (!a || !b) return 0
  const iw = Math.max(0, Math.min(a.east, b.east) - Math.max(a.west, b.west))
  const ih = Math.max(0, Math.min(a.north, b.north) - Math.max(a.south, b.south))
  const intersection = iw * ih
  const areaA = Math.max(1e-12, (a.east - a.west) * (a.north - a.south))
  const areaB = Math.max(1e-12, (b.east - b.west) * (b.north - b.south))
  return intersection / Math.min(areaA, areaB)
}

function normalizeRol(value: unknown) {
  return String(value || "").replace(/[^0-9kK-]/g, "").toUpperCase() || null
}

function pick(attributes: Record<string, unknown>, candidates: string[]) {
  const entries = Object.entries(attributes)
  for (const candidate of candidates) {
    const found = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (found && found[1] != null && String(found[1]).trim()) return found[1]
  }
  return null
}

export async function discoverCirenNeighbors(input: {
  region: string
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown }
  targetRoles?: string[]
  radiusM?: number
}) {
  const config = getCirenLayer(input.region)
  if (!config) return { sourceService: SERVICE, sourceYear: null, layerId: null, neighbors: [] as CirenNeighbor[], unsupported: true }

  const targetBbox = bboxFromGeometry(input.geometry)
  if (!targetBbox) throw new Error("Target KMZ has no usable polygon geometry")
  const radiusM = Math.min(3000, Math.max(250, input.radiusM ?? 1200))
  const center = centerOfBbox(targetBbox)
  const latPad = radiusM / 110540
  const lngPad = radiusM / (111320 * Math.max(0.1, Math.cos(center.lat * Math.PI / 180)))
  const envelope = `${targetBbox.west - lngPad},${targetBbox.south - latPad},${targetBbox.east + lngPad},${targetBbox.north + latPad}`

  const params = new URLSearchParams({
    f: "geojson",
    where: "1=1",
    geometry: envelope,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "500",
  })
  const response = await fetch(`${SERVICE}/${config.layerId}/query?${params.toString()}`, {
    headers: { "User-Agent": "SurRealista-CAMPOS/1.0" },
    next: { revalidate: 60 * 60 * 24 * 7 },
  })
  if (!response.ok) throw new Error(`CIREN query failed (${response.status})`)
  const payload = await response.json()
  const targetRoles = new Set((input.targetRoles || []).map(normalizeRol).filter(Boolean))

  const neighbors: CirenNeighbor[] = (payload.features || []).flatMap((feature: any) => {
    if (!feature?.geometry || !["Polygon", "MultiPolygon"].includes(feature.geometry.type)) return []
    const attrs = feature.properties || {}
    const candidateBbox = bboxFromGeometry(feature.geometry)
    if (!candidateBbox) return []
    const rol = normalizeRol(pick(attrs, ["rol", "rol_sii", "rolpred", "rol_predio", "rolprop"]));
    const comuna = pick(attrs, ["desccomu", "comuna", "nom_comuna", "comuna_nom"])
    const objectId = pick(attrs, ["objectid", "objectid_1", "fid", "id"]) || `${rol || "parcel"}:${candidateBbox.west}:${candidateBbox.south}`
    const gap = bboxGapMeters(targetBbox, candidateBbox)
    const centerDistance = metersBetween(center, centerOfBbox(candidateBbox))
    const overlap = bboxOverlapRatio(targetBbox, candidateBbox)
    const sameRole = Boolean(rol && targetRoles.has(rol))
    let relation: CirenNeighborRelation = "nearby"
    if (sameRole || overlap >= 0.65) relation = "same_property"
    else if (gap <= 20) relation = "adjacent"
    if (relation === "nearby" && gap > radiusM) return []

    return [{
      sourceObjectId: String(objectId),
      rol,
      comuna: comuna ? String(comuna) : null,
      relation,
      distanceM: Math.round(relation === "same_property" ? 0 : Math.min(gap, centerDistance)),
      geometry: feature.geometry,
      properties: attrs,
    }]
  })

  neighbors.sort((a, b) => {
    const rank = { same_property: 0, adjacent: 1, nearby: 2 }
    return rank[a.relation] - rank[b.relation] || a.distanceM - b.distanceM
  })

  return { sourceService: SERVICE, sourceYear: config.sourceYear, layerId: config.layerId, neighbors, unsupported: false }
}
