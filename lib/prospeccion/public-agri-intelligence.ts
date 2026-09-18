type ProspectingPublicCriteria = {
  region?: string | null
  commune?: string | null
  species?: string | null
  minHa?: number | null
  maxHa?: number | null
}

type CirenGeometry = {
  rings?: number[][][]
}

type CirenFeature = {
  attributes?: Record<string, unknown>
  geometry?: CirenGeometry
}

type CirenResponse = {
  features?: CirenFeature[]
  exceededTransferLimit?: boolean
  error?: { message?: string }
}

type OdepaResponse = {
  success?: boolean
  result?: {
    records?: Array<Record<string, unknown>>
    total?: number
  }
  error?: { message?: string }
}

export type OffMarketProspect = {
  id: string
  rol: string
  commune: string
  declaredSpecies: string[]
  targetSpeciesMatch: boolean
  source: "CIREN IDE MINAGRI"
  sourceUrl: string
  surveyYear: number
  areaHa: number | null
  areaMatch: boolean | null
  centroid: { lat: number; lng: number } | null
  stage: "detected"
  ownerStatus: "pending"
  contactStatus: "pending"
  evidenceLabel: string
}

export type PublicAgriEvidence = {
  ciren: {
    status: "available" | "unsupported_region" | "unavailable"
    source: "CIREN IDE MINAGRI"
    sourceUrl: string
    layerId: number | null
    surveyYear: number | null
    polygonCount: number
    speciesMatchedCount: number
    sampleRoles: string[]
    species: Array<{ name: string; count: number }>
    offMarketProspects: OffMarketProspect[]
    note: string
  }
  odepa: {
    status: "available" | "unavailable"
    source: "ODEPA / CIREN Catastro Frutícola 2025"
    sourceUrl: string
    recordCount: number
    totalSurfaceHa: number
    speciesMatchedCount: number
    speciesMatchedSurfaceHa: number
    topSpecies: Array<{ name: string; surfaceHa: number }>
    irrigationMethods: Array<{ name: string; surfaceHa: number }>
    note: string
  }
}

const ODEPA_RESOURCE_ID = "1bbc9838-6032-4b89-96e5-8c2ed5d91e3f"
const ODEPA_API = "https://datos.odepa.gob.cl/api/action/datastore_search"
const ODEPA_SOURCE_URL = "https://datos.odepa.gob.cl/dataset/catastro-fruticola"
const CIREN_BASE = "https://esri.ciren.cl/server/rest/services/IDEMINAGRI/CATASTRO_FRUTICOLA/MapServer"
const EARTH_RADIUS_M = 6_378_137

const CIREN_PRODUCER_LAYERS: Array<{ aliases: string[]; layerId: number; year: number }> = [
  { aliases: ["arica y parinacota"], layerId: 55, year: 2022 },
  { aliases: ["tarapaca"], layerId: 56, year: 2022 },
  { aliases: ["atacama"], layerId: 57, year: 2024 },
  { aliases: ["coquimbo"], layerId: 58, year: 2024 },
  { aliases: ["valparaiso"], layerId: 59, year: 2025 },
  { aliases: ["metropolitana", "metropolitana de santiago", "santiago"], layerId: 60, year: 2025 },
  { aliases: ["ohiggins", "o higgins", "libertador general bernardo ohiggins", "libertador general bernardo o higgins", "libertador bernardo ohiggins", "libertador bernardo o higgins"], layerId: 61, year: 2024 },
  { aliases: ["maule"], layerId: 62, year: 2024 },
  { aliases: ["nuble"], layerId: 63, year: 2024 },
  { aliases: ["biobio", "bio bio"], layerId: 64, year: 2024 },
  { aliases: ["araucania", "la araucania"], layerId: 65, year: 2024 },
  { aliases: ["los rios", "rios"], layerId: 66, year: 2024 },
  { aliases: ["los lagos", "lagos"], layerId: 67, year: 2024 },
  { aliases: ["aysen", "aysen del general carlos ibanez del campo"], layerId: 68, year: 2022 },
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

function normalizeSpecies(value: unknown) {
  const normalized = normalize(value)
  if (!normalized) return ""
  return normalized.replace(/es$/, "").replace(/s$/, "").trim()
}

function matchesSpecies(value: unknown, target: string) {
  if (!target) return true
  const actual = normalizeSpecies(value)
  return actual.includes(target) || target.includes(actual)
}

function formalRegion(region: string | null | undefined) {
  const n = normalize(region)
  const found = CIREN_PRODUCER_LAYERS.find((entry) => entry.aliases.some((alias) => normalize(alias) === n))
  if (!found) return null
  const formalByLayer: Record<number, string> = {
    55: "Arica y Parinacota",
    56: "Tarapacá",
    57: "Atacama",
    58: "Coquimbo",
    59: "Valparaíso",
    60: "Metropolitana de Santiago",
    61: "Libertador General Bernardo O'Higgins",
    62: "Maule",
    63: "Ñuble",
    64: "Biobío",
    65: "La Araucanía",
    66: "Los Ríos",
    67: "Los Lagos",
    68: "Aysén del General Carlos Ibáñez del Campo",
  }
  return formalByLayer[found.layerId] ?? null
}

function escapeSqlLiteral(value: string) {
  return value.replace(/'/g, "''")
}

function normalizeCirenPlace(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ")
}

async function fetchJsonWithTimeout(url: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

function aggregateBySurface(records: Array<Record<string, unknown>>, field: string) {
  const totals = new Map<string, number>()
  for (const record of records) {
    const name = String(record[field] ?? "").trim()
    if (!name) continue
    const surface = Number(record["Superficie (ha)"] ?? 0)
    totals.set(name, (totals.get(name) ?? 0) + (Number.isFinite(surface) ? surface : 0))
  }
  return [...totals.entries()]
    .map(([name, surfaceHa]) => ({ name, surfaceHa: Number(surfaceHa.toFixed(2)) }))
    .sort((a, b) => b.surfaceHa - a.surfaceHa)
    .slice(0, 5)
}

function ringSignedAreaSqM(ring: number[][]) {
  if (!Array.isArray(ring) || ring.length < 3) return 0
  let total = 0
  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i]
    const next = ring[(i + 1) % ring.length]
    const lon1 = Number(current?.[0]) * Math.PI / 180
    const lat1 = Number(current?.[1]) * Math.PI / 180
    const lon2 = Number(next?.[0]) * Math.PI / 180
    const lat2 = Number(next?.[1]) * Math.PI / 180
    if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) continue
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  return total * EARTH_RADIUS_M * EARTH_RADIUS_M / 2
}

function polygonAreaHa(geometry?: CirenGeometry) {
  const rings = geometry?.rings
  if (!Array.isArray(rings) || !rings.length) return null
  const areaSqM = Math.abs(rings.reduce((sum, ring) => sum + ringSignedAreaSqM(ring), 0))
  if (!Number.isFinite(areaSqM) || areaSqM <= 0) return null
  return Number((areaSqM / 10_000).toFixed(2))
}

function polygonCentroid(geometry?: CirenGeometry) {
  const ring = geometry?.rings?.[0]
  if (!Array.isArray(ring) || !ring.length) return null
  const valid = ring
    .map((point) => ({ lng: Number(point?.[0]), lat: Number(point?.[1]) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
  if (!valid.length) return null
  const total = valid.reduce((acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }), { lat: 0, lng: 0 })
  return {
    lat: Number((total.lat / valid.length).toFixed(6)),
    lng: Number((total.lng / valid.length).toFixed(6)),
  }
}

function areaMatches(areaHa: number | null, minHa?: number | null, maxHa?: number | null) {
  if (areaHa == null) return minHa == null && maxHa == null ? true : null
  if (minHa != null && areaHa < minHa) return false
  if (maxHa != null && areaHa > maxHa) return false
  return true
}

function buildOffMarketProspects(
  features: CirenFeature[],
  criteria: ProspectingPublicCriteria,
  speciesTarget: string,
  surveyYear: number,
  sourceUrl: string,
) {
  const seen = new Set<string>()
  const prospects: OffMarketProspect[] = []

  for (const feature of features) {
    const attributes = feature.attributes ?? {}
    const rol = String(attributes.rolpredi ?? "").trim()
    const commune = String(attributes.desccomu ?? "").trim()
    const declaredSpecies = [attributes.especie_01, attributes.especie_02, attributes.especie_03, attributes.especie_04]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
    const targetSpeciesMatch = speciesTarget ? declaredSpecies.some((name) => matchesSpecies(name, speciesTarget)) : true
    const areaHa = polygonAreaHa(feature.geometry)
    const areaMatch = areaMatches(areaHa, criteria.minHa, criteria.maxHa)

    if (!rol || !targetSpeciesMatch || areaMatch === false || seen.has(rol)) continue
    if ((criteria.minHa != null || criteria.maxHa != null) && areaMatch !== true) continue

    seen.add(rol)
    prospects.push({
      id: `ciren:${surveyYear}:${rol}`,
      rol,
      commune,
      declaredSpecies,
      targetSpeciesMatch,
      source: "CIREN IDE MINAGRI",
      sourceUrl,
      surveyYear,
      areaHa,
      areaMatch,
      centroid: polygonCentroid(feature.geometry),
      stage: "detected",
      ownerStatus: "pending",
      contactStatus: "pending",
      evidenceLabel: [
        `ROL oficial en catastro ${surveyYear}`,
        areaHa != null ? `${areaHa.toLocaleString("es-CL")} ha estimadas desde polígono oficial` : null,
        speciesTarget ? "especie objetivo declarada" : null,
      ].filter(Boolean).join(" · "),
    })
    if (prospects.length >= 30) break
  }

  return prospects
}

async function getCirenEvidence(criteria: ProspectingPublicCriteria): Promise<PublicAgriEvidence["ciren"]> {
  const region = String(criteria.region ?? "").trim()
  const commune = String(criteria.commune ?? "").trim()
  const speciesTarget = normalizeSpecies(criteria.species)
  const regionKey = normalize(region)
  const layer = CIREN_PRODUCER_LAYERS.find((entry) => entry.aliases.some((alias) => normalize(alias) === regionKey))

  if (!layer) {
    return {
      status: "unsupported_region",
      source: "CIREN IDE MINAGRI",
      sourceUrl: CIREN_BASE,
      layerId: null,
      surveyYear: null,
      polygonCount: 0,
      speciesMatchedCount: 0,
      sampleRoles: [],
      species: [],
      offMarketProspects: [],
      note: region ? `CIREN no expone una capa de productores frutícolas mapeada para ${region} en este conector.` : "Define región para consultar la capa oficial de productores frutícolas.",
    }
  }

  const cirenCommune = normalizeCirenPlace(commune)
  const where = cirenCommune ? `UPPER(desccomu)='${escapeSqlLiteral(cirenCommune)}'` : "1=1"
  const sourceUrl = `${CIREN_BASE}/${layer.layerId}`
  const params = new URLSearchParams({
    f: "json",
    where,
    outFields: "desccomu,rolpredi,especie_01,especie_02,especie_03,especie_04",
    returnGeometry: "true",
    outSR: "4326",
    geometryPrecision: "6",
    resultRecordCount: "1200",
  })

  try {
    const payload = await fetchJsonWithTimeout(`${sourceUrl}/query?${params.toString()}`) as CirenResponse
    if (payload.error) throw new Error(payload.error.message || "CIREN query failed")
    const features = payload.features ?? []
    const speciesCounts = new Map<string, number>()
    let speciesMatchedCount = 0
    const roles = new Set<string>()

    for (const feature of features) {
      const attributes = feature.attributes ?? {}
      const featureSpecies = [attributes.especie_01, attributes.especie_02, attributes.especie_03, attributes.especie_04]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
      for (const name of featureSpecies) speciesCounts.set(name, (speciesCounts.get(name) ?? 0) + 1)
      if (!speciesTarget || featureSpecies.some((name) => matchesSpecies(name, speciesTarget))) speciesMatchedCount += 1
      const role = String(attributes.rolpredi ?? "").trim()
      if (role) roles.add(role)
    }

    const offMarketProspects = buildOffMarketProspects(features, criteria, speciesTarget, layer.year, sourceUrl)

    return {
      status: "available",
      source: "CIREN IDE MINAGRI",
      sourceUrl,
      layerId: layer.layerId,
      surveyYear: layer.year,
      polygonCount: features.length,
      speciesMatchedCount: speciesTarget ? speciesMatchedCount : 0,
      sampleRoles: [...roles].slice(0, 5),
      species: [...speciesCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      offMarketProspects,
      note: payload.exceededTransferLimit
        ? "La consulta alcanzó el límite de transferencia de CIREN; los conteos son un mínimo observable. Los prospectos retornados sí fueron filtrados con la geometría recibida."
        : "Prospectos construidos desde polígonos oficiales CIREN. Superficie estimada desde geometría oficial; especie declarada no equivale a detección satelital ni disponibilidad comercial.",
    }
  } catch (error) {
    console.warn("[Prospeccion] CIREN unavailable", error instanceof Error ? error.message : "unknown error")
    return {
      status: "unavailable",
      source: "CIREN IDE MINAGRI",
      sourceUrl,
      layerId: layer.layerId,
      surveyYear: layer.year,
      polygonCount: 0,
      speciesMatchedCount: 0,
      sampleRoles: [],
      species: [],
      offMarketProspects: [],
      note: "CIREN no respondió en esta ejecución; Prospección continuó con las demás fuentes.",
    }
  }
}

async function getOdepaEvidence(criteria: ProspectingPublicCriteria): Promise<PublicAgriEvidence["odepa"]> {
  const region = formalRegion(criteria.region)
  const commune = String(criteria.commune ?? "").trim()
  const speciesTarget = normalizeSpecies(criteria.species)
  const filters: Record<string, string> = {}
  if (commune) filters.Comuna = commune
  else if (region) filters.Region = region

  try {
    const payload = await fetchJsonWithTimeout(ODEPA_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_id: ODEPA_RESOURCE_ID, limit: 2000, filters }),
    }) as OdepaResponse

    if (!payload.success || !payload.result) throw new Error(payload.error?.message || "ODEPA query failed")
    let records = payload.result.records ?? []
    if (region) records = records.filter((record) => normalize(record.Region) === normalize(region))
    if (commune) records = records.filter((record) => normalize(record.Comuna) === normalize(commune))

    const matched = speciesTarget ? records.filter((record) => matchesSpecies(record.Especie, speciesTarget)) : []
    const totalSurfaceHa = records.reduce((sum, record) => sum + (Number(record["Superficie (ha)"]) || 0), 0)
    const speciesMatchedSurfaceHa = matched.reduce((sum, record) => sum + (Number(record["Superficie (ha)"]) || 0), 0)

    return {
      status: "available",
      source: "ODEPA / CIREN Catastro Frutícola 2025",
      sourceUrl: ODEPA_SOURCE_URL,
      recordCount: records.length,
      totalSurfaceHa: Number(totalSurfaceHa.toFixed(2)),
      speciesMatchedCount: matched.length,
      speciesMatchedSurfaceHa: Number(speciesMatchedSurfaceHa.toFixed(2)),
      topSpecies: aggregateBySurface(records, "Especie"),
      irrigationMethods: aggregateBySurface(records, "Metodo de riego"),
      note: "Catastro estadístico oficial. Sirve para contexto productivo y validación territorial; no prueba que un aviso inmobiliario corresponda al mismo predio.",
    }
  } catch (error) {
    console.warn("[Prospeccion] ODEPA unavailable", error instanceof Error ? error.message : "unknown error")
    return {
      status: "unavailable",
      source: "ODEPA / CIREN Catastro Frutícola 2025",
      sourceUrl: ODEPA_SOURCE_URL,
      recordCount: 0,
      totalSurfaceHa: 0,
      speciesMatchedCount: 0,
      speciesMatchedSurfaceHa: 0,
      topSpecies: [],
      irrigationMethods: [],
      note: "ODEPA no respondió en esta ejecución; Prospección continuó con las demás fuentes.",
    }
  }
}


export type ExactCirenRolCandidate = OffMarketProspect & {
  region: string
  layerId: number
}

export type ExactCirenRolLookup = {
  status: "found" | "not_found" | "partial"
  candidates: ExactCirenRolCandidate[]
  searchedLayers: number
  failedLayers: number
}

export async function lookupExactCirenRol(rolInput: string): Promise<ExactCirenRolLookup> {
  const rol = String(rolInput ?? "").trim()
  if (!rol) return { status: "not_found", candidates: [], searchedLayers: 0, failedLayers: 0 }

  const outcomes = await Promise.all(CIREN_PRODUCER_LAYERS.map(async (layer) => {
    const sourceUrl = `${CIREN_BASE}/${layer.layerId}`
    const params = new URLSearchParams({
      f: "json",
      where: `rolpredi='${escapeSqlLiteral(rol)}'`,
      outFields: "desccomu,rolpredi,especie_01,especie_02,especie_03,especie_04",
      returnGeometry: "true",
      outSR: "4326",
      geometryPrecision: "6",
      resultRecordCount: "20",
    })

    try {
      const payload = await fetchJsonWithTimeout(`${sourceUrl}/query?${params.toString()}`) as CirenResponse
      if (payload.error) throw new Error(payload.error.message || "CIREN query failed")
      const region = formalRegion(layer.aliases[0]) ?? layer.aliases[0]
      const candidates = (payload.features ?? []).map((feature, index) => {
        const attributes = feature.attributes ?? {}
        const commune = String(attributes.desccomu ?? "").trim()
        const declaredSpecies = [attributes.especie_01, attributes.especie_02, attributes.especie_03, attributes.especie_04]
          .map((value) => String(value ?? "").trim())
          .filter(Boolean)
        const areaHa = polygonAreaHa(feature.geometry)
        return {
          id: `ciren:${layer.year}:${layer.layerId}:${rol}:${index}`,
          rol,
          region,
          commune,
          declaredSpecies,
          targetSpeciesMatch: true,
          source: "CIREN IDE MINAGRI" as const,
          sourceUrl,
          surveyYear: layer.year,
          layerId: layer.layerId,
          areaHa,
          areaMatch: true,
          centroid: polygonCentroid(feature.geometry),
          stage: "detected" as const,
          ownerStatus: "pending" as const,
          contactStatus: "pending" as const,
          evidenceLabel: [
            `ROL oficial en catastro ${layer.year}`,
            region,
            commune,
            areaHa != null ? `${areaHa.toLocaleString("es-CL")} ha estimadas desde polígono oficial` : null,
          ].filter(Boolean).join(" · "),
        } satisfies ExactCirenRolCandidate
      })
      return { failed: false, candidates }
    } catch (error) {
      console.warn("[Prospeccion] CIREN exact ROL lookup failed", {
        rol,
        layerId: layer.layerId,
        error: error instanceof Error ? error.message : "unknown error",
      })
      return { failed: true, candidates: [] as ExactCirenRolCandidate[] }
    }
  }))

  const candidates = outcomes.flatMap((outcome) => outcome.candidates)
  const failedLayers = outcomes.filter((outcome) => outcome.failed).length
  return {
    status: candidates.length ? "found" : failedLayers ? "partial" : "not_found",
    candidates,
    searchedLayers: outcomes.length,
    failedLayers,
  }
}

export async function getPublicAgriEvidence(criteria: ProspectingPublicCriteria): Promise<PublicAgriEvidence> {
  const [ciren, odepa] = await Promise.all([getCirenEvidence(criteria), getOdepaEvidence(criteria)])
  return { ciren, odepa }
}
