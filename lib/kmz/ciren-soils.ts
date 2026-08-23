import { CIREN_SOIL_SERVICE, resolveCirenLayer, type CirenSoilContext } from "@/lib/kmz/ciren-neighbors"

function polygonRings(geometry: any): number[][][] {
  if (!geometry || !Array.isArray(geometry.coordinates)) return []
  if (geometry.type === "Polygon") return geometry.coordinates.filter(Array.isArray)
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon: any) => Array.isArray(polygon) ? polygon : [])
  }
  return []
}

function pick(attributes: Record<string, unknown>, candidates: string[]) {
  const entries = Object.entries(attributes)
  for (const candidate of candidates) {
    const found = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (found && found[1] != null && String(found[1]).trim()) return found[1]
  }
  return null
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

export async function discoverCirenSoilsPost(input: {
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

  // Use POST because real KMZ polygons can contain hundreds or thousands of vertices.
  // Sending the complete polygon in the query string can exceed proxy/ArcGIS URL limits.
  const response = await fetch(`${config.sourceService}/${config.layerId}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "SurRealista-CAMPOS/1.0",
    },
    body: params.toString(),
    next: { revalidate: 60 * 60 * 24 * 7 },
  })

  if (!response.ok) throw new Error(`CIREN soils query failed (${response.status})`)
  const payload = await response.json()
  if (payload?.error) throw new Error(`CIREN soils query: ${payload.error.message || "ArcGIS error"}`)

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
