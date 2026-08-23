export type CirenNeighborRelation = "same_property" | "adjacent" | "nearby"
export type CirenDataset = "properties" | "soils"

type RegionKey =
  | "arica"
  | "tarapaca"
  | "antofagasta"
  | "atacama"
  | "coquimbo"
  | "valparaiso"
  | "metropolitana"
  | "ohiggins"
  | "maule"
  | "nuble"
  | "biobio"
  | "araucania"
  | "losrios"
  | "loslagos"
  | "aysen"
  | "magallanes"

export interface CirenLayerConfig {
  layerId: number
  sourceYear: number | null
  layerName: string
  dataset: CirenDataset
  sourceService: string
  catalogMode: "live" | "fallback"
}

export interface CirenNeighbor {
  sourceObjectId: string
  rol: string | null
  comuna: string | null
  relation: CirenNeighborRelation
  distanceM: number
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown }
  properties: { rol: string | null; comuna: string | null }
}

export interface CirenSoilContext {
  classes: string[]
  featureCount: number
  sourceService: string
  sourceYear: number | null
  layerId: number | null
  layerName: string | null
  catalogMode: "live" | "fallback" | null
  unsupported: boolean
}

export const CIREN_PROPERTY_SERVICE = "https://esri.ciren.cl/server/rest/services/IDEMINAGRI/PROPIEDADES_RURALES/MapServer"
export const CIREN_SOIL_SERVICE = "https://esri.ciren.cl/server/rest/services/IDEMINAGRI/SUELOS_AGROLOGICOS/MapServer"

// Verified against CIREN IDE Minagri on 2026-08-23. These are fallbacks only:
// the runtime first resolves the live service catalog by layer name so layer IDs can move safely.
const PROPERTY_FALLBACK: Partial<Record<RegionKey, Omit<CirenLayerConfig, "dataset" | "sourceService" | "catalogMode">>> = {
  arica: { layerId: 0, sourceYear: 2018, layerName: "REGIÓN ARICA Y PARINACOTA (CIREN 2018)" },
  tarapaca: { layerId: 1, sourceYear: 2017, layerName: "REGIÓN TARAPACÁ (CIREN 2017)" },
  atacama: { layerId: 2, sourceYear: 2013, layerName: "REGIÓN ATACAMA (2013)" },
  coquimbo: { layerId: 3, sourceYear: 2014, layerName: "REGIÓN COQUIMBO (CIREN 2014)" },
  valparaiso: { layerId: 4, sourceYear: 2022, layerName: "REGIÓN VALPARAÍSO (CIREN 2022)" },
  metropolitana: { layerId: 5, sourceYear: 2023, layerName: "REGIÓN METROPOLITANA (CIREN 2023)" },
  ohiggins: { layerId: 6, sourceYear: 2013, layerName: "REGIÓN LIBERTADOR GENERAL BERNARDO O'HIGGINS (CIREN 2013)" },
  maule: { layerId: 7, sourceYear: 2021, layerName: "REGIÓN MAULE (CIREN 2021)" },
  nuble: { layerId: 8, sourceYear: 2016, layerName: "REGIÓN ÑUBLE (CIREN 2016)" },
  biobio: { layerId: 9, sourceYear: 2016, layerName: "REGIÓN BIOBÍO (CIREN 2016)" },
  araucania: { layerId: 10, sourceYear: 2023, layerName: "REGIÓN ARAUCANÍA (CIREN 2023)" },
  losrios: { layerId: 11, sourceYear: 2018, layerName: "REGIÓN LOS RÍOS (CIREN 2018)" },
  loslagos: { layerId: 12, sourceYear: 2016, layerName: "REGIÓN LOS LAGOS (CIREN 2016)" },
  aysen: { layerId: 13, sourceYear: 2004, layerName: "REGIÓN AYSÉN DEL GENERAL CARLOS IBÁÑEZ DEL CAMPO (CIREN 2004)" },
}

const SOIL_FALLBACK: Partial<Record<RegionKey, Omit<CirenLayerConfig, "dataset" | "sourceService" | "catalogMode">>> = {
  atacama: { layerId: 0, sourceYear: 2023, layerName: "REGIÓN DE ATACAMA (CIREN 2023)" },
  coquimbo: { layerId: 1, sourceYear: 2022, layerName: "REGIÓN DE COQUIMBO (CIREN 2022)" },
  valparaiso: { layerId: 2, sourceYear: 2025, layerName: "REGIÓN DE VALPARAÍSO (CIREN 2025)" },
  metropolitana: { layerId: 3, sourceYear: 2024, layerName: "REGIÓN METROPOLITANA DE SANTIAGO (CIREN 2024)" },
  ohiggins: { layerId: 4, sourceYear: 2023, layerName: "REGIÓN DEL LIBERTADOR GENERAL BERNARDO O'HIGGINS (CIREN 2023)" },
  maule: { layerId: 5, sourceYear: 2011, layerName: "REGIÓN DEL MAULE (CIREN 2011)" },
  nuble: { layerId: 6, sourceYear: 2014, layerName: "REGIÓN DE ÑUBLE (CIREN 2014)" },
  biobio: { layerId: 7, sourceYear: 2014, layerName: "REGIÓN DEL BIOBÍO (CIREN 2014)" },
  araucania: { layerId: 8, sourceYear: 2013, layerName: "REGIÓN DE LA ARAUCANÍA (CIREN 2013)" },
  losrios: { layerId: 9, sourceYear: 2017, layerName: "REGIÓN DE LOS RÍOS (CIREN 2017)" },
  loslagos: { layerId: 10, sourceYear: 2020, layerName: "REGIÓN DE LOS LAGOS (CIREN 2020)" },
  aysen: { layerId: 11, sourceYear: 2019, layerName: "REGIÓN DE AYSÉN DEL GENERAL CARLOS IBÁÑEZ DEL CAMPO (CIREN 2019)" },
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function regionKey(value: unknown): RegionKey | null {
  const text = normalizeText(value)
  if (!text) return null
  if (text.includes("arica")) return "arica"
  if (text.includes("tarapaca")) return "tarapaca"
  if (text.includes("antofagasta")) return "antofagasta"
  if (text.includes("atacama")) return "atacama"
  if (text.includes("coquimbo")) return "coquimbo"
  if (text.includes("valparaiso")) return "valparaiso"
  if (text.includes("metropolitana") || text.includes("santiago")) return "metropolitana"
  if (text.includes("higgins")) return "ohiggins"
  if (text.includes("maule")) return "maule"
  if (text.includes("nuble")) return "nuble"
  if (text.includes("biobio") || text.includes("bio bio")) return "biobio"
  if (text.includes("araucania")) return "araucania"
  if (text.includes("los rios")) return "losrios"
  if (text.includes("los lagos")) return "loslagos"
  if (text.includes("aysen") || text.includes("ibanez del campo")) return "aysen"
  if (text.includes("magallanes") || text.includes("antartica chilena")) return "magallanes"
  return null
}

function extractYear(name: unknown) {
  const matches = String(name || "").match(/\b(?:19|20)\d{2}\b/g)
  if (!matches?.length) return null
  const year = Number(matches[matches.length - 1])
  return Number.isFinite(year) ? year : null
}

async function loadLiveCatalog(dataset: CirenDataset) {
  const service = dataset === "properties" ? CIREN_PROPERTY_SERVICE : CIREN_SOIL_SERVICE
  try {
    const response = await fetch(`${service}?f=json`, {
      headers: { "User-Agent": "SurRealista-CAMPOS/1.0" },
      next: { revalidate: 60 * 60 * 24 * 7 },
    })
    if (!response.ok) throw new Error(`catalog ${response.status}`)
    const payload = await response.json()
    if (!Array.isArray(payload?.layers)) throw new Error("catalog has no layers")

    const catalog = new Map<RegionKey, CirenLayerConfig>()
    for (const layer of payload.layers) {
      const key = regionKey(layer?.name)
      const id = Number(layer?.id)
      if (!key || !Number.isFinite(id)) continue
      catalog.set(key, {
        layerId: id,
        sourceYear: extractYear(layer?.name),
        layerName: String(layer?.name || `Layer ${id}`),
        dataset,
        sourceService: service,
        catalogMode: "live",
      })
    }
    return catalog
  } catch (error) {
    console.warn(`[CIREN] ${dataset} catalog lookup failed; using verified fallback`, error)
    return null
  }
}

function fallbackCatalog(dataset: CirenDataset) {
  const service = dataset === "properties" ? CIREN_PROPERTY_SERVICE : CIREN_SOIL_SERVICE
  const fallback = dataset === "properties" ? PROPERTY_FALLBACK : SOIL_FALLBACK
  const catalog = new Map<RegionKey, CirenLayerConfig>()
  for (const [key, config] of Object.entries(fallback)) {
    if (!config) continue
    catalog.set(key as RegionKey, {
      ...config,
      dataset,
      sourceService: service,
      catalogMode: "fallback",
    })
  }
  return catalog
}

export async function resolveCirenLayer(region: string, dataset: CirenDataset) {
  const key = regionKey(region)
  if (!key) return null
  const live = await loadLiveCatalog(dataset)
  return live?.get(key) || fallbackCatalog(dataset).get(key) || null
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

function ensureArcGisPayload(payload: any, label: string) {
  if (payload?.error) throw new Error(`${label}: ${payload.error.message || "ArcGIS error"}`)
  return payload
}

export async function discoverCirenNeighbors(input: {
  region: string
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown }
  targetRoles?: string[]
  radiusM?: number
}) {
  const config = await resolveCirenLayer(input.region, "properties")
  if (!config) {
    return {
      sourceService: CIREN_PROPERTY_SERVICE,
      sourceYear: null,
      layerId: null,
      layerName: null,
      catalogMode: null,
      neighbors: [] as CirenNeighbor[],
      unsupported: true,
    }
  }

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
  const response = await fetch(`${config.sourceService}/${config.layerId}/query?${params.toString()}`, {
    headers: { "User-Agent": "SurRealista-CAMPOS/1.0" },
    next: { revalidate: 60 * 60 * 24 * 7 },
  })
  if (!response.ok) throw new Error(`CIREN properties query failed (${response.status})`)
  const payload = ensureArcGisPayload(await response.json(), "CIREN properties query")
  const targetRoles = new Set((input.targetRoles || []).map(normalizeRol).filter(Boolean))

  const neighbors: CirenNeighbor[] = (payload.features || []).flatMap((feature: any) => {
    if (!feature?.geometry || !["Polygon", "MultiPolygon"].includes(feature.geometry.type)) return []
    const attrs = feature.properties || {}
    const candidateBbox = bboxFromGeometry(feature.geometry)
    if (!candidateBbox) return []
    const rol = normalizeRol(pick(attrs, ["rol", "rol_sii", "rolpred", "rol_predio", "rolprop"]))
    const comuna = pick(attrs, ["desccomu", "comuna", "nom_comuna", "comuna_nom"])
    const objectId = pick(attrs, ["objectid_1", "objectid", "fid", "id", "mslink"]) || `${rol || "parcel"}:${candidateBbox.west}:${candidateBbox.south}`
    const gap = bboxGapMeters(targetBbox, candidateBbox)
    const centerDistance = metersBetween(center, centerOfBbox(candidateBbox))
    const overlap = bboxOverlapRatio(targetBbox, candidateBbox)
    const sameRole = Boolean(rol && targetRoles.has(rol))
    let relation: CirenNeighborRelation = "nearby"
    if (sameRole || overlap >= 0.65) relation = "same_property"
    else if (gap <= 20) relation = "adjacent"
    if (relation === "nearby" && gap > radiusM) return []

    const safeComuna = comuna ? String(comuna) : null
    return [{
      sourceObjectId: String(objectId),
      rol,
      comuna: safeComuna,
      relation,
      distanceM: Math.round(relation === "same_property" ? 0 : Math.min(gap, centerDistance)),
      geometry: feature.geometry,
      properties: { rol, comuna: safeComuna },
    }]
  })

  const seen = new Set<string>()
  const uniqueNeighbors = neighbors.filter((neighbor) => {
    const key = `${neighbor.sourceObjectId}:${neighbor.rol || ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  uniqueNeighbors.sort((a, b) => {
    const rank = { same_property: 0, adjacent: 1, nearby: 2 }
    return rank[a.relation] - rank[b.relation] || a.distanceM - b.distanceM
  })

  return {
    sourceService: config.sourceService,
    sourceYear: config.sourceYear,
    layerId: config.layerId,
    layerName: config.layerName,
    catalogMode: config.catalogMode,
    neighbors: uniqueNeighbors,
    unsupported: false,
  }
}

function normalizeSoilClass(value: unknown) {
  const text = String(value || "").trim().toUpperCase().replace(/\s+/g, " ")
  if (!text) return null
  const roman = text.match(/\b(?:VIII|VII|VI|V|IV|III|II|I)\b/)
  if (roman) return roman[0]
  if (text === "N.C." || text === "NC" || text.includes("NO CLAS")) return "N.C."
  return text.length <= 24 ? text : null
}

function soilSortValue(value: string) {
  const order: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, "N.C.": 99 }
  return order[value] ?? 50
}

export async function discoverCirenSoils(input: {
  region: string
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown }
}): Promise<CirenSoilContext> {
  const config = await resolveCirenLayer(input.region, "soils")
  if (!config) {
    return {
      classes: [],
      featureCount: 0,
      sourceService: CIREN_SOIL_SERVICE,
      sourceYear: null,
      layerId: null,
      layerName: null,
      catalogMode: null,
      unsupported: true,
    }
  }

  const rings = polygonRings(input.geometry)
  const outerRing = rings.find((ring) => Array.isArray(ring) && ring.length >= 4)
  if (!outerRing) throw new Error("Target KMZ has no usable polygon geometry for soil lookup")

  const params = new URLSearchParams({
    f: "json",
    where: "1=1",
    geometry: JSON.stringify({ rings: [outerRing], spatialReference: { wkid: 4326 } }),
    geometryType: "esriGeometryPolygon",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
    resultRecordCount: "2000",
  })

  const response = await fetch(`${config.sourceService}/${config.layerId}/query?${params.toString()}`, {
    headers: { "User-Agent": "SurRealista-CAMPOS/1.0" },
    next: { revalidate: 60 * 60 * 24 * 7 },
  })
  if (!response.ok) throw new Error(`CIREN soils query failed (${response.status})`)
  const payload = ensureArcGisPayload(await response.json(), "CIREN soils query")
  const values = new Set<string>()

  for (const feature of payload.features || []) {
    const attrs = feature?.attributes || feature?.properties || {}
    const raw = pick(attrs, ["textcaus", "cap_uso", "capacidad", "clase", "clase_uso"])
    const value = normalizeSoilClass(raw)
    if (value) values.add(value)
  }

  const classes = Array.from(values).sort((a, b) => soilSortValue(a) - soilSortValue(b) || a.localeCompare(b, "es"))
  return {
    classes,
    featureCount: Array.isArray(payload.features) ? payload.features.length : 0,
    sourceService: config.sourceService,
    sourceYear: config.sourceYear,
    layerId: config.layerId,
    layerName: config.layerName,
    catalogMode: config.catalogMode,
    unsupported: false,
  }
}
