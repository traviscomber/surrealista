import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")
    const region = searchParams.get("region")
    const category = searchParams.get("category")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    console.log(requestId, "[v0] Advanced search called with:", { q, region, category, dateFrom, dateTo })

    const supabase = await createClient()

    // Build location search query
    let locationQuery = supabase
      .from("kmz_location_index")
      .select("*")
      .eq("is_active", true)

    if (q) {
      locationQuery = locationQuery.or(`searchable_text.ilike.%${q}%,name.ilike.%${q}%`)
    }
    if (region) {
      locationQuery = locationQuery.eq("region", region)
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

    if (q) {
      kmzQuery = kmzQuery.or(`file_name.ilike.%${q}%,description.ilike.%${q}%`)
    }
    if (region) {
      kmzQuery = kmzQuery.eq("region", region)
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

    console.log(requestId, "[v0] Search complete:", {
      locationsFound: locations?.length || 0,
      kmzFound: kmzFiles?.length || 0,
    })

    return NextResponse.json({
      success: true,
      results: {
        locations: locations || [],
        kmzFiles: kmzFiles || [],
      },
    })
  } catch (error: any) {
    console.error(requestId, "[v0] Search error:", error.message)
    return NextResponse.json(
      { error: "Error en búsqueda avanzada" },
      { status: 500 }
    )
  }
}
