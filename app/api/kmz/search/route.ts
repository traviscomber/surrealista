import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")
    const type = searchParams.get("type") || "location"

    console.log(requestId, "[v0] KMZ search API called:", { q, type })

    if (!q || q.length < 2) {
      console.log(requestId, "[v0] Invalid search term length:", q?.length)
      return NextResponse.json(
        { error: "Search term must be at least 2 characters" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, check if table has any data
    const { data: allLocations, count: totalCount } = await supabase
      .from("kmz_location_index")
      .select("*", { count: "exact", head: true })
      .limit(1)

    console.log(requestId, "[v0] Total locations in index:", totalCount)

    let query = supabase.from("kmz_location_index").select("*")

    // Filter based on search type
    if (type === "location") {
      query = query.ilike("searchable_text", `%${q}%`)
    } else if (type === "region") {
      query = query.ilike("region", `%${q}%`)
    } else if (type === "file") {
      query = query.ilike("name", `%${q}%`)
    }

    const { data: locations, error } = await query.limit(500)

    if (error) {
      console.error(requestId, "[v0] Search error:", error)
      throw error
    }

    console.log(requestId, "[v0] Found", locations?.length || 0, "locations with query type:", type)

    // Get KMZ file info for the results
    if (locations && locations.length > 0) {
      const kmzIds = [...new Set(locations.map((l: any) => l.kmz_id))]

      const { data: kmzFiles } = await supabase
        .from("kmz_collection")
        .select("id, file_name, placemarks_count, region, category")
        .in("id", kmzIds)

      const kmzFileMap: Record<string, any> = {}
      kmzFiles?.forEach((kmz: any) => {
        kmzFileMap[kmz.id] = kmz
      })

      return NextResponse.json({
        success: true,
        locations,
        kmzFiles: kmzFileMap,
        count: locations.length,
      })
    }

    return NextResponse.json({
      success: true,
      locations: [],
      kmzFiles: {},
      count: 0,
    })
  } catch (error: any) {
    console.error(requestId, "[v0] Search error:", error?.message)
    return NextResponse.json(
      { error: "Error searching locations" },
      { status: 500 }
    )
  }
}
