type TerritorialCriteria = {
  region?: string | null
}

type CountResponse = {
  count?: number
  error?: { message?: string }
}

export type TerritorialInfrastructureEvidence = {
  irrigation: {
    status: "available" | "unsupported_region" | "unavailable"
    source: "CIREN / CNR Infraestructura de Riego"
    sourceUrl: string
    surveyYear: number | null
    irrigatedAreaFeatures: number
    intakeFeatures: number
    canalFeatures: number
    note: string
  }
  soils: {
    status: "available" | "unsupported_region" | "unavailable"
    source: "CIREN Suelos Agrológicos"
    sourceUrl: string
    surveyYear: number | null
    featureCount: number
    note: string
  }
}

const IRRIGATION_BASE = "https://esri.ciren.cl/server/rest/services/IDEMINAGRI/INFRAESTRUCTURA_DE_RIEGO_CIREN/MapServer"
const SOILS_BASE = "https://esri.ciren.cl/server/rest/services/IDEMINAGRI/SUELOS_AGROLOGICOS/MapServer"

const IRRIGATION_LAYERS: Array<{
  aliases: string[]
  areaLayer: number
  intakeLayer: number
  canalLayer: number
  year: number
}> = [
  { aliases: ["atacama"], areaLayer: 1, intakeLayer: 9, canalLayer: 17, year: 2022 },
  { aliases: ["coquimbo"], areaLayer: 2, intakeLayer: 10, canalLayer: 18, year: 2023 },
  { aliases: ["valparaiso"], areaLayer: 3, intakeLayer: 11, canalLayer: 19, year: 2023 },
  { aliases: ["metropolitana", "metropolitana de santiago", "santiago"], areaLayer: 4, intakeLayer: 12, canalLayer: 20, year: 2025 },
  { aliases: ["ohiggins", "libertador general bernardo ohiggins", "libertador bernardo ohiggins"], areaLayer: 5, intakeLayer: 13, canalLayer: 21, year: 2022 },
  { aliases: ["maule"], areaLayer: 6, intakeLayer: 14, canalLayer: 22, year: 2022 },
  { aliases: ["nuble"], areaLayer: 7, intakeLayer: 15, canalLayer: 23, year: 2026 },
]

const SOIL_LAYERS: Array<{ aliases: string[]; layerId: number; year: number }> = [
  { aliases: ["atacama"], layerId: 0, year: 2023 },
  { aliases: ["coquimbo"], layerId: 1, year: 2022 },
  { aliases: ["valparaiso"], layerId: 2, year: 2025 },
  { aliases: ["metropolitana", "metropolitana de santiago", "santiago"], layerId: 3, year: 2024 },
  { aliases: ["ohiggins", "libertador general bernardo ohiggins", "libertador bernardo ohiggins"], layerId: 4, year: 2023 },
  { aliases: ["maule"], layerId: 5, year: 2011 },
  { aliases: ["nuble"], layerId: 6, year: 2014 },
  { aliases: ["biobio", "bio bio"], layerId: 7, year: 2014 },
  { aliases: ["araucania", "la araucania"], layerId: 8, year: 2013 },
  { aliases: ["los rios", "rios"], layerId: 9, year: 2017 },
  { aliases: ["los lagos", "lagos"], layerId: 10, year: 2020 },
  { aliases: ["aysen", "aysen del general carlos ibanez del campo"], layerId: 11, year: 2019 },
]

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/\bregion\b/g, "")
    .replace(/\b(del|de|la)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

async function fetchCount(base: string, layerId: number, timeoutMs = 4500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const params = new URLSearchParams({ f: "json", where: "1=1", returnCountOnly: "true" })
    const response = await fetch(`${base}/${layerId}/query?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload = await response.json() as CountResponse
    if (payload.error) throw new Error(payload.error.message || "ArcGIS query failed")
    return Number(payload.count ?? 0)
  } finally {
    clearTimeout(timer)
  }
}

async function getIrrigationEvidence(region: string): Promise<TerritorialInfrastructureEvidence["irrigation"]> {
  const key = normalize(region)
  const layer = IRRIGATION_LAYERS.find((entry) => entry.aliases.some((alias) => normalize(alias) === key))

  if (!layer) {
    return {
      status: "unsupported_region",
      source: "CIREN / CNR Infraestructura de Riego",
      sourceUrl: IRRIGATION_BASE,
      surveyYear: null,
      irrigatedAreaFeatures: 0,
      intakeFeatures: 0,
      canalFeatures: 0,
      note: region ? `La capa CIREN/CNR conectada aún no tiene mapeo regional para ${region}.` : "Define región para consultar infraestructura de riego.",
    }
  }

  try {
    const [areas, intakes, canals] = await Promise.all([
      fetchCount(IRRIGATION_BASE, layer.areaLayer),
      fetchCount(IRRIGATION_BASE, layer.intakeLayer),
      fetchCount(IRRIGATION_BASE, layer.canalLayer),
    ])
    return {
      status: "available",
      source: "CIREN / CNR Infraestructura de Riego",
      sourceUrl: IRRIGATION_BASE,
      surveyYear: layer.year,
      irrigatedAreaFeatures: areas,
      intakeFeatures: intakes,
      canalFeatures: canals,
      note: "Cobertura regional oficial de áreas de riego, bocatomas y canales. Es contexto territorial; la proximidad a un candidato requiere cruce espacial por coordenada/polígono.",
    }
  } catch (error) {
    console.warn("[Prospeccion] irrigation evidence unavailable", error instanceof Error ? error.message : "unknown error")
    return {
      status: "unavailable",
      source: "CIREN / CNR Infraestructura de Riego",
      sourceUrl: IRRIGATION_BASE,
      surveyYear: layer.year,
      irrigatedAreaFeatures: 0,
      intakeFeatures: 0,
      canalFeatures: 0,
      note: "La fuente de infraestructura de riego no respondió en esta ejecución; Prospección continuó con las demás fuentes.",
    }
  }
}

async function getSoilEvidence(region: string): Promise<TerritorialInfrastructureEvidence["soils"]> {
  const key = normalize(region)
  const layer = SOIL_LAYERS.find((entry) => entry.aliases.some((alias) => normalize(alias) === key))

  if (!layer) {
    return {
      status: "unsupported_region",
      source: "CIREN Suelos Agrológicos",
      sourceUrl: SOILS_BASE,
      surveyYear: null,
      featureCount: 0,
      note: region ? `La capa de suelos conectada aún no tiene mapeo regional para ${region}.` : "Define región para consultar suelos agrológicos.",
    }
  }

  try {
    const count = await fetchCount(SOILS_BASE, layer.layerId)
    return {
      status: "available",
      source: "CIREN Suelos Agrológicos",
      sourceUrl: `${SOILS_BASE}/${layer.layerId}`,
      surveyYear: layer.year,
      featureCount: count,
      note: "La cobertura agrológica oficial está disponible para enriquecer aptitud territorial. La clase de suelo de un candidato específico se debe resolver por intersección espacial.",
    }
  } catch (error) {
    console.warn("[Prospeccion] soil evidence unavailable", error instanceof Error ? error.message : "unknown error")
    return {
      status: "unavailable",
      source: "CIREN Suelos Agrológicos",
      sourceUrl: `${SOILS_BASE}/${layer.layerId}`,
      surveyYear: layer.year,
      featureCount: 0,
      note: "La fuente de suelos no respondió en esta ejecución; Prospección continuó con las demás fuentes.",
    }
  }
}

export async function getTerritorialInfrastructureEvidence(criteria: TerritorialCriteria): Promise<TerritorialInfrastructureEvidence> {
  const region = String(criteria.region ?? "").trim()
  const [irrigation, soils] = await Promise.all([
    getIrrigationEvidence(region),
    getSoilEvidence(region),
  ])
  return { irrigation, soils }
}
