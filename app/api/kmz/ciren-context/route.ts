import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { discoverCirenNeighbors, discoverCirenSoils } from "@/lib/kmz/ciren-neighbors"
import { extractKmzGeometry, isRenderableKmzPolygon } from "@/lib/kmz/kmz-geometry-compat"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

function polygonToGeoJson(coordinates: number[][]) {
  return { type: "Polygon" as const, coordinates: [coordinates] }
}

function safeSnapshotPayload(dataset: "properties" | "soils", value: any) {
  if (dataset === "properties") {
    return {
      sourceYear: value?.sourceYear ?? null,
      layerId: value?.layerId ?? null,
      layerName: value?.layerName ?? null,
      catalogMode: value?.catalogMode ?? null,
      unsupported: Boolean(value?.unsupported),
      neighbors: Array.isArray(value?.neighbors) ? value.neighbors.map((neighbor: any) => ({
        sourceObjectId: String(neighbor.sourceObjectId || ""),
        rol: neighbor.rol || null,
        comuna: neighbor.comuna || null,
        relation: neighbor.relation,
        distanceM: Number(neighbor.distanceM || 0),
        geometry: neighbor.geometry,
        properties: { rol: neighbor.rol || null, comuna: neighbor.comuna || null },
      })) : [],
    }
  }

  return {
    sourceYear: value?.sourceYear ?? null,
    layerId: value?.layerId ?? null,
    layerName: value?.layerName ?? null,
    catalogMode: value?.catalogMode ?? null,
    unsupported: Boolean(value?.unsupported),
    classes: Array.isArray(value?.classes) ? value.classes.map(String).slice(0, 20) : [],
    featureCount: Number(value?.featureCount || 0),
  }
}

async function readSnapshot(supabase: any, kmzId: string, dataset: "properties" | "soils") {
  const { data } = await supabase
    .from("kmz_ciren_snapshots")
    .select("source_service,source_layer_id,source_year,payload,fetched_at")
    .eq("kmz_id", kmzId)
    .eq("dataset", dataset)
    .maybeSingle()
  if (!data) return null
  return {
    ...(data.payload || {}),
    sourceService: data.source_service,
    sourceYear: data.source_year ?? data.payload?.sourceYear ?? null,
    layerId: data.source_layer_id ?? data.payload?.layerId ?? null,
    fetchedAt: data.fetched_at,
    cached: true,
  }
}

async function saveSnapshot(supabase: any, kmzId: string, dataset: "properties" | "soils", value: any) {
  if (!value?.sourceService) return
  const payload = safeSnapshotPayload(dataset, value)
  const { error } = await supabase.from("kmz_ciren_snapshots").upsert({
    kmz_id: kmzId,
    dataset,
    source_service: value.sourceService,
    source_layer_id: value.layerId,
    source_year: value.sourceYear,
    payload,
    fetched_at: new Date().toISOString(),
  }, { onConflict: "kmz_id,dataset" })
  if (error) console.warn(`[CIREN context] ${dataset} snapshot skipped`, error.message)
}

export async function GET(request: NextRequest) {
  const kmzId = request.nextUrl.searchParams.get("kmzId")
  const radiusM = Number(request.nextUrl.searchParams.get("radiusM") || 1200)
  if (!kmzId) return NextResponse.json({ error: "kmzId is required" }, { status: 400 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: "Server data connection is not configured" }, { status: 503 })

  try {
    const [{ data: collection, error: collectionError }, { data: stored, error: placemarkError }] = await Promise.all([
      supabase.from("kmz_collection").select("id,file_name,region,rol_numbers,coordinates").eq("id", kmzId).single(),
      supabase.from("kmz_placemarks").select("coordinates,type,name").eq("kmz_id", kmzId).eq("type", "Polygon").limit(250),
    ])

    if (collectionError || !collection) return NextResponse.json({ error: "KMZ not found" }, { status: 404 })
    if (placemarkError) console.warn("[CIREN context] placemark lookup failed; using legacy geometry", placemarkError.message)

    const polygons = (stored || []).flatMap((row: any) =>
      extractKmzGeometry(row.coordinates, {
        name: row.name || collection.file_name,
        declaredType: row.type,
      }).filter((geometry) => geometry.type === "Polygon" && isRenderableKmzPolygon(geometry.coordinates)),
    )

    if (!polygons.length) {
      polygons.push(...extractKmzGeometry(collection.coordinates, { name: collection.file_name })
        .filter((geometry) => geometry.type === "Polygon" && isRenderableKmzPolygon(geometry.coordinates)))
    }

    if (!polygons.length) {
      return NextResponse.json({
        kmzId,
        region: collection.region,
        error: "KMZ has no polygon geometry",
        properties: null,
        soils: null,
      }, { status: 422 })
    }

    polygons.sort((a, b) => b.coordinates.length - a.coordinates.length)
    const targetGeometry = polygonToGeoJson(polygons[0].coordinates)
    const safeRadius = Number.isFinite(radiusM) ? Math.min(3000, Math.max(250, radiusM)) : 1200

    const [propertiesAttempt, soilsAttempt] = await Promise.allSettled([
      discoverCirenNeighbors({
        region: collection.region,
        geometry: targetGeometry,
        targetRoles: collection.rol_numbers || [],
        radiusM: safeRadius,
      }),
      discoverCirenSoils({ region: collection.region, geometry: targetGeometry }),
    ])

    let properties: any = null
    let soils: any = null

    if (propertiesAttempt.status === "fulfilled") {
      properties = { ...propertiesAttempt.value, cached: false, fetchedAt: new Date().toISOString() }
      await saveSnapshot(supabase, kmzId, "properties", propertiesAttempt.value)

      if (propertiesAttempt.value.layerId != null) {
        await supabase.from("kmz_neighbor_parcels")
          .delete()
          .eq("kmz_id", kmzId)
          .eq("source_service", propertiesAttempt.value.sourceService)

        if (propertiesAttempt.value.neighbors.length) {
          const rows = propertiesAttempt.value.neighbors.map((neighbor) => ({
            kmz_id: kmzId,
            source_service: propertiesAttempt.value.sourceService,
            source_layer_id: propertiesAttempt.value.layerId,
            source_year: propertiesAttempt.value.sourceYear,
            source_object_id: neighbor.sourceObjectId,
            rol: neighbor.rol,
            comuna: neighbor.comuna,
            relation: neighbor.relation,
            distance_m: neighbor.distanceM,
            geometry: neighbor.geometry,
            properties: neighbor.properties,
            fetched_at: new Date().toISOString(),
          }))
          const { error: cacheError } = await supabase.from("kmz_neighbor_parcels").upsert(rows, {
            onConflict: "kmz_id,source_service,source_layer_id,source_object_id",
          })
          if (cacheError) console.warn("[CIREN context] neighbor cache skipped", cacheError.message)
        }
      }
    } else {
      console.warn("[CIREN context] properties lookup failed", propertiesAttempt.reason)
      properties = await readSnapshot(supabase, kmzId, "properties")
      if (properties) properties.upstreamUnavailable = true
    }

    if (soilsAttempt.status === "fulfilled") {
      soils = { ...soilsAttempt.value, cached: false, fetchedAt: new Date().toISOString() }
      await saveSnapshot(supabase, kmzId, "soils", soilsAttempt.value)
    } else {
      console.warn("[CIREN context] soils lookup failed", soilsAttempt.reason)
      soils = await readSnapshot(supabase, kmzId, "soils")
      if (soils) soils.upstreamUnavailable = true
    }

    return NextResponse.json({
      kmzId,
      region: collection.region,
      geometryScope: polygons.length > 1 ? "largest_polygon" : "single_polygon",
      polygonCount: polygons.length,
      source: "CIREN / IDE Minagri",
      properties,
      soils,
    })
  } catch (error) {
    console.error("[CIREN context] failed", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "CIREN context failed" }, { status: 500 })
  }
}
