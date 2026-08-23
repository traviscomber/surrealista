import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { discoverCirenNeighbors } from "@/lib/kmz/ciren-neighbors"
import { extractKmzGeometry } from "@/lib/kmz/kmz-geometry-compat"

export const dynamic = "force-dynamic"

function polygonToGeoJson(coordinates: number[][]) {
  return { type: "Polygon" as const, coordinates: [coordinates] }
}

export async function GET(request: NextRequest) {
  try {
    const kmzId = request.nextUrl.searchParams.get("kmzId")
    const radiusM = Number(request.nextUrl.searchParams.get("radiusM") || 1200)
    if (!kmzId) return NextResponse.json({ error: "kmzId is required" }, { status: 400 })

    const supabase = await createClient()
    const [{ data: collection, error: collectionError }, { data: stored, error: placemarkError }] = await Promise.all([
      supabase.from("kmz_collection").select("id,file_name,region,rol_numbers,coordinates").eq("id", kmzId).single(),
      supabase.from("kmz_placemarks").select("coordinates,type").eq("kmz_id", kmzId).eq("type", "Polygon").limit(100),
    ])
    if (collectionError || !collection) return NextResponse.json({ error: "KMZ not found" }, { status: 404 })
    if (placemarkError) console.warn("[CIREN neighbors] placemark lookup failed", placemarkError)

    const polygons = (stored || []).flatMap((row: any) =>
      extractKmzGeometry(row.coordinates, { name: collection.file_name, declaredType: row.type })
        .filter((geometry) => geometry.type === "Polygon"),
    )
    if (!polygons.length) {
      polygons.push(...extractKmzGeometry(collection.coordinates, { name: collection.file_name })
        .filter((geometry) => geometry.type === "Polygon"))
    }
    if (!polygons.length) return NextResponse.json({ error: "KMZ has no polygon geometry", neighbors: [] }, { status: 422 })

    const result = await discoverCirenNeighbors({
      region: collection.region,
      geometry: polygonToGeoJson(polygons[0].coordinates),
      targetRoles: collection.rol_numbers || [],
      radiusM: Number.isFinite(radiusM) ? radiusM : 1200,
    })

    // Cache is best-effort. RLS intentionally keeps this table server-only for ordinary clients.
    if (result.layerId != null && result.neighbors.length) {
      const rows = result.neighbors.map((neighbor) => ({
        kmz_id: kmzId,
        source_service: result.sourceService,
        source_layer_id: result.layerId,
        source_year: result.sourceYear,
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
      if (cacheError) console.warn("[CIREN neighbors] cache skipped", cacheError.message)
    }

    return NextResponse.json({
      kmzId,
      region: collection.region,
      source: "CIREN / IDE Minagri · Propiedades Rurales",
      sourceService: result.sourceService,
      sourceYear: result.sourceYear,
      layerId: result.layerId,
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
