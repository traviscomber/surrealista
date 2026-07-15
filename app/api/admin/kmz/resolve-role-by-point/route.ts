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

  const center = {
    lat: (north + south) / 2,
    lng: (east + west) / 2,
    label: "center",
    source: "bounds" as const,
  }

  const lat25 = south + (north - south) * 0.25
  const lat75 = south + (north - south) * 0.75
  const lng25 = west + (east - west) * 0.25
  const lng75 = west + (east - west) * 0.75

  const candidates = [
    center,
    { lat: lat75, lng: lng25, label: "north-west", source: "bounds" as const },
    { lat: lat75, lng: lng75, label: "north-east", source: "bounds" as const },
    { lat: lat25, lng: lng25, label: "south-west", source: "bounds" as const },
    { lat: lat25, lng: lng75, label: "south-east", source: "bounds" as const },
    { lat: lat75, lng: center.lng, label: "north", source: "bounds" as const },
    { lat: lat25, lng: center.lng, label: "south", source: "bounds" as const },
    { lat: center.lat, lng: lng25, label: "west", source: "bounds" as const },
    { lat: center.lat, lng: lng75, label: "east", source: "bounds" as const },
  ]

  return dedupeSamplePoints(candidates).slice(0, Math.min(Math.max(maxSamples, 1), candidates.length))
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
    const attempts: Array<{ label: string; source: "coordinates" | "bounds"; lat: number; lng: number; found: boolean }> = []
    const textAttempts: TextResolutionAttempt[] = []
    let matchedPoint: SamplePoint | null = null
    let record = null
    let resolutionMethod: "text" | "point" | null = null

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

      const candidate = await provider.getByRol(parsed)
      textAttempts.push({ rol: extractedRole, normalizedRol, found: Boolean(candidate) })

      if (candidate) {
        record = candidate
        resolutionMethod = "text"
        break
      }
    }

    if (!record) {
      for (const point of samplePoints) {
        const candidate = await provider.getByPoint({ comuna: body.comuna, lat: point.lat, lng: point.lng })
        attempts.push({ ...point, found: Boolean(candidate) })

        if (candidate) {
          matchedPoint = point
          record = candidate
          resolutionMethod = "point"
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
        },
        extractedRoles,
        textAttempts,
        attempts,
        source: "SII Mapas getFeatureInfo",
      })
    }

    const roles = Array.from(new Set([...(kmz.rol_numbers || []), record.rol].filter(Boolean)))

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
              },
              extractedRoles,
              textAttempts,
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
      },
      resolutionMethod,
      extractedRoles,
      textAttempts,
      matchedPoint,
      attempts,
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
