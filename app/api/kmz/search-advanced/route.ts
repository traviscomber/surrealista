import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("searchTerm")
    const region = searchParams.get("region")
    const category = searchParams.get("category")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    console.log(requestId, "[v0] Advanced search called with:", { searchTerm, region, category, dateFrom, dateTo })

    const supabase = await createClient()

    // Build location search query
    let locationQuery = supabase
      .from("kmz_location_index")
      .select("id, name, description, latitude, longitude, region, city, created_at")

    if (searchTerm) {
      locationQuery = locationQuery.or(`searchable_text.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
    }
    if (region) {
      locationQuery = locationQuery.ilike("region", `%${region}%`)
    }
    if (dateFrom) {
      locationQuery = locationQuery.gte("created_at", new Date(dateFrom).toISOString())
    }
    if (dateTo) {
      locationQuery = locationQuery.lte("created_at", new Date(dateTo).toISOString())
    }

    const { data: locations, error: locError } = await locationQuery.limit(500)

    if (locError) {
      console.error(requestId, "[v0] Location search error:", locError)
    }

    // Build KMZ collection search query
    let kmzQuery = supabase
      .from("kmz_collection")
      .select("id, file_name, placemarks_count, region, category, created_at")
      .eq("is_active", true)

    if (searchTerm) {
      kmzQuery = kmzQuery.or(`file_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }
    if (region) {
      kmzQuery = kmzQuery.ilike("region", `%${region}%`)
    }
    if (category) {
      kmzQuery = kmzQuery.eq("category", category)
    }
    if (dateFrom) {
      kmzQuery = kmzQuery.gte("created_at", new Date(dateFrom).toISOString())
    }
    if (dateTo) {
      kmzQuery = kmzQuery.lte("created_at", new Date(dateTo).toISOString())
    }

    const { data: kmzFiles, error: kmzError } = await kmzQuery.limit(100)

    if (kmzError) {
      console.error(requestId, "[v0] KMZ search error:", kmzError)
    }

    // Format results into a flat array
    const formattedResults = [
      ...(locations || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name || "Ubicación sin nombre",
        type: "location" as const,
        description: loc.description,
        region: loc.region,
        city: loc.city,
        createdAt: loc.created_at,
      })),
      ...(kmzFiles || []).map((kmz: any) => ({
        id: kmz.id,
        name: kmz.file_name,
        type: "kmz" as const,
        region: kmz.region,
        createdAt: kmz.created_at,
        locationsCount: kmz.placemarks_count,
      })),
    ]

    console.log(requestId, "[v0] Search complete:", {
      locationsFound: locations?.length || 0,
      kmzFound: kmzFiles?.length || 0,
      totalResults: formattedResults.length,
    })

    return NextResponse.json({
      success: true,
      results: formattedResults,
      stats: {
        total: formattedResults.length,
        locations: (locations || []).length,
        kmzFiles: (kmzFiles || []).length,
      },
    })
  } catch (error: any) {
    console.error(requestId, "[v0] Search error:", error.message)
    return NextResponse.json(
      { success: false, error: "Error en búsqueda avanzada", results: [], stats: { total: 0, locations: 0, kmzFiles: 0 } },
      { status: 500 }
    )
  }
}
