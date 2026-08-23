import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { discoverCirenNeighbors } from "@/lib/kmz/ciren-neighbors"
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

export async function GET(request: NextRequest) {
  try {
    const kmzId = request.nextUrl.searchParams.get("kmzId")
    const radiusM = Number(request.nextUrl.searchParams.get("radiusM") || 1200)
    if (!kmzId) return NextResponse.json({ error: "kmzId is required" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    if (!supabase) return NextResponse.json({ error: "Server data connection is not configured" }, { status: 503 })

    const [{ data: collection, error: collectionError }, { data: stored, error: placemarkError }] = await Promise.all([
      supabase.from("kmz_collection").select("id,file_name,region,rol_numbers,coordinates").eq("id", kmzId).single(),
      supabase.from("kmz_placemarks").select("coordinates,type").eq("kmz_id", kmzId).eq("type", "Polygon").limit(250),
    ])
    if (collectionError || !collection) return NextResponse.json({ error: "KMZ not found" }, { status: 404 })
    if (placemarkError) console.warn("[CIREN neighbors] placemark lookup failed", placemarkError.message)

    const polygons = (stored || []).flatMap((row: any) =>
      extractKmzGeometry(row.coordinates, { name: collection.file_name, declaredType: row.type })
        .filter((geometry) => geometry.type === "Polygon" && isRenderableKmzPolygon(geometry.coordinates)),
    )
    if (!polygons.length) {
      polygons.push(...extractKmzGeometry(collection.coordinates, { name: collection.file_name })
        .filter((geometry) => geometry.type === "Polygon" && isRenderableKmzPolygon(geometry.coordinates)))
    }
    if (!polygons.length) return NextResponse.json({ error: "KMZ has no polygon geometry", neighbors: [] }, { status: 422 })

    polygons.sort((a, b) => b.coordinates.length - a.coordinates.length)
    const result = await discoverCirenNeighbors({
      region: collection.region,
      geometry: polygonToGeoJson(polygons[0].coordinates),
      targetRoles: collection.rol_numbers || [],
      radiusM: Number.isFinite(radiusM) ? radiusM : 1200,
    })

    return NextResponse.json({
      kmzId,
      region: collection.region,
      source: "CIREN / IDE Minagri · Propiedades Rurales",
      sourceService: result.sourceService,
      sourceYear: result.sourceYear,
      layerId: result.layerId,
      layerName: result.layerName,
      catalogMode: result.catalogMode,
      unsupported: result.unsupported,
      counts: {
        total: result.neighbors.length,
        sameProperty: result.neighbors.filter((n) => n.relation === "same_property").length,
        adjacent: result.neighbors.filter((n) => n.relation === "adjacent").length,
        nearby: result.neighbors.filter((n) => n.relation === "nearby").length,
      },
      neighbors: result.neighbors,
    })
  } catch (error) {
    console.error("[CIREN neighbors] failed", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Neighbor discovery failed" }, { status: 500 })
  }
}
