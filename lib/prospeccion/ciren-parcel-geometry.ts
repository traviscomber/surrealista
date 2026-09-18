export type CirenSentinelPolygon = {
  type: "Polygon"
  coordinates: number[][][]
}

const ALLOWED_HOST = "esri.ciren.cl"
const ALLOWED_PATH = /^\/server\/rest\/services\/IDEMINAGRI\/CATASTRO_FRUTICOLA\/MapServer\/\d+\/?$/i

function escapeSqlLiteral(value: string) {
  return value.replace(/'/g, "''")
}

function normalizeCommune(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
}

export function isAllowedCirenParcelSource(sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl)
    return parsed.protocol === "https:" && parsed.hostname === ALLOWED_HOST && ALLOWED_PATH.test(parsed.pathname)
  } catch {
    return false
  }
}

export async function fetchCirenParcelPolygon(sourceUrl: string, rol: string, commune: string): Promise<CirenSentinelPolygon | null> {
  if (!isAllowedCirenParcelSource(sourceUrl)) return null

  const where = [
    `rolpredi='${escapeSqlLiteral(rol)}'`,
    commune ? `UPPER(desccomu)='${escapeSqlLiteral(normalizeCommune(commune))}'` : null,
  ].filter(Boolean).join(" AND ")

  const params = new URLSearchParams({
    f: "json",
    where,
    outFields: "rolpredi,desccomu",
    returnGeometry: "true",
    outSR: "4326",
    geometryPrecision: "6",
    resultRecordCount: "5",
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(`${sourceUrl.replace(/\/$/, "")}/query?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
    if (!response.ok) return null
    const payload = await response.json() as { features?: Array<{ geometry?: { rings?: number[][][] } }> }
    const rings = payload.features?.[0]?.geometry?.rings
    if (!Array.isArray(rings) || !rings.length) return null
    return { type: "Polygon", coordinates: rings }
  } catch (error) {
    console.warn("[Prospeccion CIREN Geometry] lookup failed", error instanceof Error ? error.message : "unknown error")
    return null
  } finally {
    clearTimeout(timer)
  }
}
