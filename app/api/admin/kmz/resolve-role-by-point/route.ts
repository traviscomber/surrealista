import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { extractRolNumbersFromTargets } from "@/lib/kmz/rol-extraction"
import { SiiMapasPublicProvider } from "@/lib/sii/sii-mapas-public-client"
import { parseRolParts } from "@/lib/sii/types"

export const runtime = "nodejs"
export const maxDuration = 120

type ResolvePointRequest = {
  kmzId: string
  comuna: string
  persist?: boolean
  maxSamples?: number
}

type SamplePoint = {
  lat: number
  lng: number
  label: string
  source: "coordinates" | "bounds"
}

type TextResolutionAttempt = {
  rol: string
  normalizedRol: string
  found: boolean
}

type NameSearchAttempt = {
  query: string
  candidates: number
  inspected: number
  matchedRol?: string
  matchedDistanceKm?: number
  matchedCoordinateSource?: "direct" | "projected-ah" | "projected-csa"
}

type RankedAddressCandidate = {
  rol: string
  query: string
  textScore: number
  summary: Awaited<ReturnType<SiiMapasPublicProvider["searchByAddress"]>>[number]
  distanceKm?: number
  coordinateSource?: "direct" | "projected-ah" | "projected-csa"
}

type EvaluatedNameCandidate = {
  rol: string
  distanceKm: number
  coordinateSource?: "direct" | "projected-ah" | "projected-csa"
  textScore: number
  record: NonNullable<Awaited<ReturnType<SiiMapasPublicProvider["getByRol"]>>>
}

const GENERIC_NAME_TOKENS = new Set([
  "ALIGN",
  "ARCHIVO",
  "BACKGROUND",
  "BGCOLOR",
  "BODY",
  "BORDER",
  "CAMPO",
  "CELLPADDING",
  "CELLSPACING",
  "CHARSET",
  "COMPRA",
  "CONTENT",
  "DOCTYPE",
  "FONT",
  "FUNDO",
  "HEAD",
  "HEIGHT",
  "HTML",
  "HTTP",
  "HTTPS",
  "IMG",
  "META",
  "KMZ",
  "KML",
  "LOTE",
  "LOTES",
  "MARGIN",
  "MSXSL",
  "NAMESPACE",
  "OVERFLOW",
  "PARCELA",
  "PARCELAS",
  "PADDING",
  "PREDIO",
  "PREDIAL",
  "PROPIEDAD",
  "REFUGIO",
  "RGB",
  "ROL",
  "RURAL",
  "RURAI",
  "SITIO",
  "SOC",
  "SOCIEDAD",
  "SRC",
  "STYLE",
  "SUCURSAL",
  "SUB",
  "SUBDIVISION",
  "TABLE",
  "TERRENO",
  "TEXT",
  "TYPE",
  "USER",
  "UTF",
  "VALIGN",
  "VERDANA",
  "WIDTH",
  "WWW",
  "XSL",
  "XSLT",
])

const MIN_NAME_MATCH_DISTANCE_KM = 9
const MIN_PROJECTED_AH_MATCH_DISTANCE_KM = 6
const MIN_PROJECTED_CSA_MATCH_DISTANCE_KM = 8
const MAX_SEARCH_QUERY_TOKENS = 6
const MAX_SEARCH_QUERY_LENGTH = 64
const MAX_NAME_SEARCH_CANDIDATES = 6
const MAX_POINT_RESOLVED_ROLES = 8
const STRUCTURED_DESCRIPTION_VALUE_KEYS = new Set([
  "NOMBRE",
  "LOTE",
  "SECTOR",
  "FUNDO",
  "ISLA",
  "PREDIO",
  "PARCELA",
  "CAMPO",
  "HIJUELA",
  "LOCALIDAD",
  "DIRECCION",
  "DIRECCIÓN",
])
const STRUCTURED_DESCRIPTION_IGNORED_KEYS = new Set([
  "FID",
  "FID_PRPIED",
  "FID_PRPIED_",
  "FID_AREALO",
  "ID",
  "HA",
  "HA_1",
  "SHAPE_LENG",
  "SHAPE_AREA",
  "OBJECTID",
  "CODIGO",
])

function getAllowedNameMatchDistanceKm(coordinateSource?: "direct" | "projected-ah" | "projected-csa") {
  switch (coordinateSource) {
    case "projected-ah":
      return MIN_PROJECTED_AH_MATCH_DISTANCE_KM
    case "projected-csa":
      return MIN_PROJECTED_CSA_MATCH_DISTANCE_KM
    default:
      return MIN_NAME_MATCH_DISTANCE_KM
  }
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(url, key)
}

function getCenter(bounds: any): { lat: number; lng: number } | null {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)

  if (![north, south, east, west].every(Number.isFinite)) {
    return null
  }

  return {
    lat: (north + south) / 2,
    lng: (east + west) / 2,
  }
}

function getCenterFromPoints(points: Array<{ lat: number; lng: number }>): { lat: number; lng: number } | null {
  if (points.length === 0) {
    return null
  }

  const totals = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng,
    }),
    { lat: 0, lng: 0 },
  )

  return {
    lat: totals.lat / points.length,
    lng: totals.lng / points.length,
  }
}

function getBoundsSpanSequence(bounds: any) {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)

  const latDelta = Number.isFinite(north) && Number.isFinite(south) ? Math.abs(north - south) : 0
  const lngDelta = Number.isFinite(east) && Number.isFinite(west) ? Math.abs(east - west) : 0
  const naturalSpan = Math.max(latDelta, lngDelta)
  const baseSpan = Math.min(Math.max(naturalSpan * 1.5, 0.02), 0.12)

  return Array.from(new Set([baseSpan, Math.min(baseSpan * 2, 0.12), Math.min(baseSpan * 4, 0.12)].map((value) => Number(value.toFixed(4)))))
}

function expandRolForComuna(rol: string, comuna: string): string | null {
  const parsed = parseRolParts(rol)
  if (!parsed) return null

  if (parsed.comuna) {
    return `${parsed.comuna}-${parsed.manzana}-${parsed.predio}`
  }

  if (!comuna) return null
  return `${comuna}-${parsed.manzana}-${parsed.predio}`
}

function isFiniteCoordinatePair(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[A-Z0-9#]+;/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ")
    .replace(/\.[A-Z0-9]+$/gi, " ")
    .replace(/[_=+*"'`|~^\\]/g, " ")
    .replace(/[()_[\]{}]/g, " ")
    .replace(/[<>]/g, " ")
    .replace(/[,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
}

function looksLikeGpsTrackSummary(value?: string | null) {
  if (typeof value !== "string") return false

  const normalized = normalizeSearchText(value)
  if (!normalized) return false

  const gpsMarkers = [
    "DISTANCE",
    "ELAPSED TIME",
    "AVG SPEED",
    "MAX SPEED",
    "AVG PACE",
    "START TIME",
    "FINISH TIME",
    "START LOCATION",
    "FINISH LOCATION",
    "LATITUDE",
    "LONGITUDE",
    "NAUTICAL MILES",
    "METERS",
    "KILOMETERS",
    "ZONE",
    "EASTING",
    "NORTHING",
  ]

  const markerHits = gpsMarkers.filter((marker) => normalized.includes(marker)).length
  return markerHits >= 3
}

function tokenizeSearchText(value: string) {
  return normalizeSearchText(value)
    .split(/[\s/-]+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
}

function extractStructuredDescriptionTargets(value?: string | null) {
  if (typeof value !== "string" || !value.trim()) return []

  const decoded = decodeHtmlEntities(value)
  const targets = new Set<string>()
  const rowMatches = Array.from(decoded.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1] || "")

  for (const rowHtml of rowMatches) {
    const cells = Array.from(rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi))
      .map((match) => normalizeSearchText(match[1] || ""))
      .filter(Boolean)

    if (cells.length === 1) {
      const singleValueTokens = tokenizeSearchText(cells[0]).filter((token) => !STRUCTURED_DESCRIPTION_IGNORED_KEYS.has(token))
      const singlePhrase = singleValueTokens.join(" ").trim()
      if (singlePhrase.length >= 6) {
        targets.add(singlePhrase)
      }
      continue
    }

    if (cells.length < 2) {
      continue
    }

    const key = cells[0]
    const rawValue = cells[1]
    if (STRUCTURED_DESCRIPTION_IGNORED_KEYS.has(key)) continue

    const keyTokens = tokenizeSearchText(key)
    const keyLabel = keyTokens.join(" ")
    const shouldIncludeValue =
      STRUCTURED_DESCRIPTION_VALUE_KEYS.has(keyLabel) ||
      keyTokens.some((token) => STRUCTURED_DESCRIPTION_VALUE_KEYS.has(token))

    if (!shouldIncludeValue) continue

    const normalizedValue = rawValue.replace(/\bLOTE\s+N\b/g, "LOTE")
    const valueTokens = tokenizeSearchText(normalizedValue).filter((token) => !STRUCTURED_DESCRIPTION_IGNORED_KEYS.has(token))
    if (valueTokens.length === 0) continue

    const phrase = valueTokens.join(" ").trim()
    if (phrase.length >= 4) {
      targets.add(phrase)
    }
  }

  if (targets.size === 0) {
    const stripped = normalizeSearchText(decoded)
      .replace(/\b(FID|ID|SHAPE|AREA|LENG|OBJECTID|HTTP|HTML|META)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (stripped.length >= 4) {
      targets.add(stripped)
    }
  }

  return Array.from(targets).slice(0, 6)
}

function toSearchPhrases(value: string) {
  const tokens = tokenizeSearchText(value)
  if (tokens.length === 0) return []

  const phrases = new Set<string>()
  const filteredTokens = tokens.filter((token) => {
    if (/^\d+$/.test(token)) return false
    if (GENERIC_NAME_TOKENS.has(token)) return false
    if (/^\d{4,}$/.test(token)) return false
    return token.length >= 3
  })

  if (filteredTokens.length > 0) {
    phrases.add(filteredTokens.slice(0, MAX_SEARCH_QUERY_TOKENS).join(" "))

    if (filteredTokens.length >= 2) {
      phrases.add(filteredTokens.slice(-2).join(" "))
      phrases.add(filteredTokens.slice(0, 2).join(" "))
    }

    if (filteredTokens.length >= 3) {
      phrases.add(filteredTokens.slice(-3).join(" "))
    }

    for (const token of filteredTokens) {
      if (token.length >= 5) {
        phrases.add(token)
      }
    }
  }

  if (tokens.length >= 2) {
    const compactTokens = tokens
      .filter((token) => token.length >= 3 && !GENERIC_NAME_TOKENS.has(token) && !/^\d{4,}$/.test(token))
      .slice(0, 3)

    if (compactTokens.length >= 2) {
      phrases.add(compactTokens.join(" "))
    }
  }

  return Array.from(phrases)
    .map((phrase) => phrase.replace(/\s+/g, " ").trim())
    .filter((phrase) => phrase.length >= 4 && phrase.length <= MAX_SEARCH_QUERY_LENGTH)
}

function getNameSearchQueries(targets: string[]) {
  const queries = new Set<string>()

  for (const target of targets) {
    for (const phrase of toSearchPhrases(target)) {
      queries.add(phrase)
    }
  }

  return Array.from(queries).slice(0, 8)
}

function isHtmlLike(value?: string | null) {
  return typeof value === "string" && /<[^>]+>/.test(value)
}

function stripKmzFilename(value?: string | null) {
  if (typeof value !== "string") return null
  const cleaned = value.replace(/\.kmz$/i, "").trim()
  return cleaned || null
}

function getTextMatchScore(query: string, candidate: { direccion?: string; destino?: string; rol?: string }) {
  const queryTokens = tokenizeSearchText(query)
  const haystack = normalizeSearchText([candidate.direccion, candidate.destino, candidate.rol].filter(Boolean).join(" "))

  if (!haystack) return 0

  let score = 0
  for (const token of queryTokens) {
    if (token.length < 3) continue
    if (haystack.includes(token)) {
      score += token.length >= 6 ? 3 : 2
    }
  }

  if (haystack.includes(normalizeSearchText(query))) {
    score += 4
  }

  return score
}

function getDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusKm = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180

  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const haversine = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))

  return earthRadiusKm * arc
}

function pushCoordinatePoints(value: any, bucket: Array<{ lat: number; lng: number }>) {
  if (!value) return

  if (Array.isArray(value)) {
    const [first, second] = value
    if (typeof first === "number" && typeof second === "number") {
      if (isFiniteCoordinatePair(second, first)) {
        bucket.push({ lat: second, lng: first })
      }
      return
    }

    for (const entry of value) {
      pushCoordinatePoints(entry, bucket)
    }
    return
  }

  if (typeof value === "object") {
    const lng = Number(value.lng ?? value.lon ?? value.longitude ?? value.x)
    const lat = Number(value.lat ?? value.latitude ?? value.y)

    if (isFiniteCoordinatePair(lat, lng)) {
      bucket.push({ lat, lng })
      return
    }

    for (const nestedValue of Object.values(value)) {
      pushCoordinatePoints(nestedValue, bucket)
    }
  }
}

function dedupeSamplePoints(points: SamplePoint[]) {
  const seen = new Set<string>()
  return points.filter((point) => {
    const key = `${point.lat.toFixed(8)},${point.lng.toFixed(8)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function getCoordinateSamplePoints(coordinates: any, maxSamples = 12): SamplePoint[] {
  const rawPoints: Array<{ lat: number; lng: number }> = []
  pushCoordinatePoints(coordinates, rawPoints)

  const unique = dedupeSamplePoints(
    rawPoints.map((point, index) => ({
      ...point,
      label: `coordinate-${index + 1}`,
      source: "coordinates" as const,
    })),
  )

  if (unique.length <= maxSamples) {
    return unique
  }

  const step = (unique.length - 1) / (maxSamples - 1)
  const sampled: SamplePoint[] = []

  for (let index = 0; index < maxSamples; index++) {
    sampled.push(unique[Math.round(index * step)])
  }

  return dedupeSamplePoints(sampled).slice(0, maxSamples)
}

function getBoundsSamplePoints(bounds: any, maxSamples = 9): SamplePoint[] {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)

  if (![north, south, east, west].every(Number.isFinite)) {
    return []
  }

  const safeMaxSamples = Math.max(maxSamples, 1)
  const latRange = north - south
  const lngRange = east - west
  const areaIndicator = Math.abs(latRange * lngRange)

  const gridSize = safeMaxSamples >= 21 || areaIndicator >= 0.08 ? 5 : safeMaxSamples >= 13 || areaIndicator >= 0.02 ? 4 : 3
  const latFractions = Array.from({ length: gridSize }, (_, index) =>
    gridSize === 1 ? 0.5 : index / (gridSize - 1),
  )
  const lngFractions = latFractions

  const preferredOrder = [
    [0.5, 0.5, "center"],
    [0.75, 0.25, "north-west"],
    [0.75, 0.75, "north-east"],
    [0.25, 0.25, "south-west"],
    [0.25, 0.75, "south-east"],
    [0.75, 0.5, "north"],
    [0.25, 0.5, "south"],
    [0.5, 0.25, "west"],
    [0.5, 0.75, "east"],
  ] as const

  const seenLabels = new Set<string>()
  const candidates: SamplePoint[] = []

  for (const [latFraction, lngFraction, label] of preferredOrder) {
    const point = {
      lat: south + latRange * latFraction,
      lng: west + lngRange * lngFraction,
      label,
      source: "bounds" as const,
    }

    candidates.push(point)
    seenLabels.add(`${latFraction}:${lngFraction}`)
  }

  for (const latFraction of latFractions) {
    for (const lngFraction of lngFractions) {
      const key = `${latFraction}:${lngFraction}`
      if (seenLabels.has(key)) continue

      candidates.push({
        lat: south + latRange * latFraction,
        lng: west + lngRange * lngFraction,
        label: `grid-${latFraction.toFixed(2)}-${lngFraction.toFixed(2)}`,
        source: "bounds" as const,
      })
    }
  }

  return dedupeSamplePoints(candidates).slice(0, Math.min(safeMaxSamples, candidates.length))
}

function getSamplePoints(
  bounds: any,
  coordinates: any,
  maxSamples = 9,
): {
  points: SamplePoint[]
  coordinateSamples: number
  boundsSamples: number
} {
  const safeMaxSamples = Math.max(maxSamples, 1)
  const coordinateLimit = Math.min(Math.max(safeMaxSamples * 2, safeMaxSamples), 24)
  const coordinatePoints = getCoordinateSamplePoints(coordinates, coordinateLimit)
  const boundsPoints = getBoundsSamplePoints(bounds, safeMaxSamples)
  const points = dedupeSamplePoints([...coordinatePoints, ...boundsPoints]).slice(0, Math.max(coordinatePoints.length, safeMaxSamples))

  return {
    points,
    coordinateSamples: coordinatePoints.length,
    boundsSamples: boundsPoints.length,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolvePointRequest
    const persist = body.persist === true

    if (!body.kmzId || !body.comuna) {
      return NextResponse.json(
        {
          success: false,
          error: "kmzId and comuna are required",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseAdmin()
    const { data: kmz, error } = await supabase
      .from("kmz_collection")
      .select("id, file_name, description, bounds, coordinates, rol_numbers, metadata")
      .eq("id", body.kmzId)
      .single()

    if (error || !kmz) {
      return NextResponse.json({ success: false, error: "KMZ not found" }, { status: 404 })
    }

    const { data: placemarks, error: placemarkError } = await supabase
      .from("kmz_placemarks")
      .select("name, description, properties")
      .eq("kmz_id", kmz.id)
      .limit(5000)

    if (placemarkError) {
      throw placemarkError
    }

    const { points: samplePoints, coordinateSamples, boundsSamples } = getSamplePoints(
      kmz.bounds,
      kmz.coordinates,
      body.maxSamples || 9,
    )
    const center = getCenter(kmz.bounds) || getCenterFromPoints(samplePoints)
    if (!center || samplePoints.length === 0) {
      return NextResponse.json({ success: false, error: "KMZ has no valid coordinates or bounds" }, { status: 400 })
    }

    const provider = new SiiMapasPublicProvider()
    const detailedCandidateCache = new Map<string, Awaited<ReturnType<SiiMapasPublicProvider["getByRol"]>>>()
    const spanSequence = getBoundsSpanSequence(kmz.bounds)
    const attempts: Array<{
      label: string
      source: "coordinates" | "bounds"
      lat: number
      lng: number
      span: number
      found: boolean
    }> = []
    const providerErrors: string[] = []
    const textAttempts: TextResolutionAttempt[] = []
    const nameSearchAttempts: NameSearchAttempt[] = []
    const pointResolvedRecords = new Map<string, SiiAvaluoRecord>()
    let matchedPoint: SamplePoint | null = null
    let record = null
    let resolutionMethod: "text" | "name-search" | "point" | null = null
    let rateLimited = false

    const extractedRoles = extractRolNumbersFromTargets([
      {
        name: kmz.file_name,
        description: kmz.description,
        properties: {},
        metadata: kmz.metadata || {},
      },
      ...(placemarks || []).map((placemark: any) => ({
        name: placemark.name || "",
        description: placemark.description,
        properties: placemark.properties || {},
      })),
    ])

    for (const extractedRole of extractedRoles) {
      const normalizedRol = expandRolForComuna(extractedRole, body.comuna)
      if (!normalizedRol) {
        textAttempts.push({ rol: extractedRole, normalizedRol: "", found: false })
        continue
      }

      const parsed = parseRolParts(normalizedRol)
      if (!parsed?.comuna || !parsed.manzana || !parsed.predio) {
        textAttempts.push({ rol: extractedRole, normalizedRol, found: false })
        continue
      }

      let candidate = null
      try {
        candidate = await provider.getByRol(parsed)
      } catch (error: any) {
        providerErrors.push(`text:${normalizedRol}:${error?.message || "unknown error"}`)
        if (`${error?.message || ""}`.includes("429")) {
          rateLimited = true
        }
      }

      textAttempts.push({ rol: extractedRole, normalizedRol, found: Boolean(candidate) })

      if (candidate) {
        record = candidate
        resolutionMethod = "text"
        break
      }

      if (rateLimited) {
        break
      }
    }

    if (!record && !rateLimited) {
      const kmzDescription = typeof kmz.description === "string" ? kmz.description : null
      const metadataDescription = typeof kmz.metadata?.description === "string" ? kmz.metadata.description : null
      const safeKmzDescription = looksLikeGpsTrackSummary(kmzDescription) ? null : kmzDescription
      const safeMetadataDescription = looksLikeGpsTrackSummary(metadataDescription) ? null : metadataDescription
      const placemarkFreeTextTargets = (placemarks || [])
        .flatMap((placemark: any) => [placemark.name, placemark.description])
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .filter((value) => !looksLikeGpsTrackSummary(value))
      const placemarkStructuredTargets = (placemarks || []).flatMap((placemark: any) =>
        extractStructuredDescriptionTargets(placemark.description),
      )
      const nameSearchQueries = getNameSearchQueries(
        [
          stripKmzFilename(kmz.file_name),
          typeof kmz.metadata?.name === "string" ? stripKmzFilename(kmz.metadata.name) : null,
          ...extractStructuredDescriptionTargets(safeKmzDescription),
          ...extractStructuredDescriptionTargets(safeMetadataDescription),
          ...placemarkStructuredTargets,
          isHtmlLike(safeKmzDescription) ? null : safeKmzDescription,
          isHtmlLike(safeMetadataDescription) ? null : safeMetadataDescription,
          ...placemarkFreeTextTargets,
        ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
      )

      for (const query of nameSearchQueries) {
        let candidates: Awaited<ReturnType<SiiMapasPublicProvider["searchByAddress"]>> = []
        try {
          candidates = await provider.searchByAddress({ comuna: body.comuna, calle: query })
        } catch (error: any) {
          providerErrors.push(`name-search:${query}:${error?.message || "unknown error"}`)
          if (`${error?.message || ""}`.includes("429")) {
            rateLimited = true
          }
          nameSearchAttempts.push({
            query,
            candidates: 0,
            inspected: 0,
          })
          continue
        }

        const rankedCandidates = candidates
          .map(
            (candidate) =>
              ({
                rol: candidate.rol,
                query,
                textScore: getTextMatchScore(query, candidate),
                summary: candidate,
                distanceKm: candidate.coordinates ? getDistanceKm(center, candidate.coordinates) : undefined,
                coordinateSource: candidate.coordinateSource,
              }) satisfies RankedAddressCandidate,
          )
          .filter((candidate) => {
            if (candidate.textScore <= 0) return false
            if (candidate.distanceKm === undefined) return true
            return candidate.distanceKm <= getAllowedNameMatchDistanceKm(candidate.coordinateSource)
          })
          .sort((left, right) => {
            if (right.textScore !== left.textScore) return right.textScore - left.textScore
            if (left.distanceKm !== undefined && right.distanceKm !== undefined) {
              return left.distanceKm - right.distanceKm
            }
            if (left.distanceKm !== undefined) return -1
            if (right.distanceKm !== undefined) return 1
            return 0
          })
          .slice(0, MAX_NAME_SEARCH_CANDIDATES)

        const attempt: NameSearchAttempt = {
          query,
          candidates: candidates.length,
          inspected: rankedCandidates.length,
        }
        for (const rankedCandidate of rankedCandidates) {
          if (
            rankedCandidate.distanceKm !== undefined &&
            rankedCandidate.distanceKm > getAllowedNameMatchDistanceKm(rankedCandidate.coordinateSource)
          ) {
            continue
          }

          const parsed = parseRolParts(rankedCandidate.rol)
          if (!parsed?.comuna || !parsed.manzana || !parsed.predio) {
            continue
          }

          let detailedCandidate = detailedCandidateCache.get(rankedCandidate.rol)
          if (detailedCandidate === undefined) {
            try {
              detailedCandidate = await provider.getByRol(parsed)
              detailedCandidateCache.set(rankedCandidate.rol, detailedCandidate)
            } catch (error: any) {
              providerErrors.push(`name-detail:${rankedCandidate.rol}:${error?.message || "unknown error"}`)
              if (`${error?.message || ""}`.includes("429")) {
                rateLimited = true
              }
              break
            }
          }

          if (!detailedCandidate?.coordinates) {
            continue
          }

          const distanceKm =
            rankedCandidate.distanceKm !== undefined
              ? rankedCandidate.distanceKm
              : getDistanceKm(center, detailedCandidate.coordinates)
          const allowedDistanceKm = getAllowedNameMatchDistanceKm(
            detailedCandidate.coordinateSource || rankedCandidate.coordinateSource,
          )
          if (distanceKm > allowedDistanceKm) {
            continue
          }

          attempt.matchedRol = detailedCandidate.rol
          attempt.matchedDistanceKm = Number(distanceKm.toFixed(3))
          attempt.matchedCoordinateSource = detailedCandidate.coordinateSource || rankedCandidate.coordinateSource
          record = detailedCandidate
          resolutionMethod = "name-search"
          break
        }

        nameSearchAttempts.push(attempt)

        if (record) {
          break
        }

        if (rateLimited) {
          break
        }
      }
    }

    if (!record && !rateLimited) {
      for (const point of samplePoints) {
        for (const span of spanSequence) {
          let candidate = null
          try {
            candidate = await provider.getByPoint({ comuna: body.comuna, lat: point.lat, lng: point.lng, span })
          } catch (error: any) {
            providerErrors.push(`point:${point.label}:${span}:${error?.message || "unknown error"}`)
            if (`${error?.message || ""}`.includes("429")) {
              rateLimited = true
            }
          }

          attempts.push({ ...point, span, found: Boolean(candidate) })

          if (candidate) {
            pointResolvedRecords.set(candidate.rol, candidate)
            if (!record) {
              matchedPoint = point
              record = candidate
              resolutionMethod = "point"
            }
            break
          }

          if (rateLimited) {
            break
          }
        }

        if (pointResolvedRecords.size >= MAX_POINT_RESOLVED_ROLES || rateLimited) {
          break
        }
      }
    }

    if (!record) {
      return NextResponse.json({
        success: true,
        found: false,
        kmz: {
          id: kmz.id,
          fileName: kmz.file_name,
          center,
        },
        sampling: {
          total: samplePoints.length,
          coordinateSamples,
          boundsSamples,
          spans: spanSequence,
        },
        extractedRoles,
        textAttempts,
        nameSearchAttempts,
        attempts,
        providerErrors,
        source: "SII Mapas getFeatureInfo",
      })
    }

    const roles = Array.from(
      new Set([...(kmz.rol_numbers || []), ...pointResolvedRecords.keys(), record.rol].filter(Boolean)),
    )

    if (persist) {
      const { error: updateError } = await supabase
        .from("kmz_collection")
        .update({
          rol_numbers: roles,
          metadata: {
            ...(kmz.metadata || {}),
            sii_point_resolution: {
              resolved_at: new Date().toISOString(),
              source: "SII Mapas getFeatureInfo",
              comuna: body.comuna,
              resolutionMethod,
              center,
              sampling: {
                total: samplePoints.length,
                coordinateSamples,
                boundsSamples,
                spans: spanSequence,
              },
              extractedRoles,
              textAttempts,
              nameSearchAttempts,
              matchedPoint,
              attempts,
              record,
            },
          },
        })
        .eq("id", kmz.id)

      if (updateError) {
        throw updateError
      }
    }

    return NextResponse.json({
      success: true,
      found: true,
      persisted: persist,
      kmz: {
        id: kmz.id,
        fileName: kmz.file_name,
        center,
      },
      sampling: {
        total: samplePoints.length,
        coordinateSamples,
        boundsSamples,
        spans: spanSequence,
      },
      resolutionMethod,
      extractedRoles,
      textAttempts,
      nameSearchAttempts,
      matchedPoint,
      attempts,
      providerErrors,
      roles,
      record,
      source: "SII Mapas getFeatureInfo",
    })
  } catch (error: any) {
    console.error("[KMZ point role resolve] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to resolve KMZ role by point",
      },
      { status: 500 },
    )
  }
}
