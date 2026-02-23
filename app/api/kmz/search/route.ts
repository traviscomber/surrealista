import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")

    console.log(requestId, "[v0] KMZ search API called:", { q })

    if (!q || q.length < 2) {
      console.log(requestId, "[v0] Invalid search term length:", q?.length)
      return NextResponse.json(
        { error: "Search term must be at least 2 characters" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    console.log(requestId, "[v0] Searching across all KMZ sources with term:", q)

    // Search 1: KMZ Location Index (locations within KMZ files from kmz_collection)
    const { data: locations, error: locError } = await supabase
      .from("kmz_location_index")
      .select("id, name, latitude, longitude, region, city, type, address, kmz_id, created_at")
      .or(`searchable_text.ilike.%${q}%,name.ilike.%${q}%,region.ilike.%${q}%,city.ilike.%${q}%`)
      .limit(500)

    if (locError) {
      console.error(requestId, "[v0] Location search error:", locError)
    }

    console.log(requestId, "[v0] Found", locations?.length || 0, "locations in kmz_location_index")

    // Search 2: KMZ Collection (from kmz_collection table)
    const { data: kmzCollectionResults, error: collError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region, category, created_at, is_active")
      .or(`file_name.ilike.%${q}%,region.ilike.%${q}%,category.ilike.%${q}%`)
      .eq("is_active", true)
      .limit(100)

    if (collError) {
      console.error(requestId, "[v0] KMZ collection search error:", collError)
    }

    console.log(requestId, "[v0] Found", kmzCollectionResults?.length || 0, "KMZ in kmz_collection")

    // Search 3: Property Documents (KMZ files uploaded in communications/documentation)
    const { data: propertyDocs, error: docError } = await supabase
      .from("property_documents")
      .select("id, title, file_url, file_type, category, created_at")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
      .in("document_type", ["KMZ", "kmz", "kml"])
      .limit(100)

    if (docError) {
      console.error(requestId, "[v0] Property documents search error:", docError)
    }

    console.log(requestId, "[v0] Found", propertyDocs?.length || 0, "KMZ in property_documents")

    // Get KMZ file details for locations
    let kmzFileMap: Record<string, any> = {}
    if (locations && locations.length > 0) {
      const kmzIds = [...new Set(locations.map((l: any) => l.kmz_id))]
      const { data: kmzFiles } = await supabase
        .from("kmz_collection")
        .select("id, file_name, placemarks_count, region, category")
        .in("id", kmzIds)

      kmzFiles?.forEach((kmz: any) => {
        kmzFileMap[kmz.id] = kmz
      })
    }

    // Combine and structure results
    const results = {
      success: true,
      searchTerm: q,
      results: {
        locations: locations?.map((loc: any) => ({
          ...loc,
          kmz_file: kmzFileMap[loc.kmz_id] || null,
          source: "kmz_location_index",
        })) || [],
        kmzCollection: kmzCollectionResults || [],
        propertyDocuments: propertyDocs || [],
      },
      summary: {
        locationsFound: locations?.length || 0,
        kmzCollectionFound: kmzCollectionResults?.length || 0,
        propertyDocsFound: propertyDocs?.length || 0,
        totalKmzFiles: (kmzCollectionResults?.length || 0) + (propertyDocs?.length || 0),
      },
    }

    console.log(requestId, "[v0] Search complete:", results.summary)
    return NextResponse.json(results)
  } catch (error: any) {
    console.error(requestId, "[v0] Search error:", error?.message)
    return NextResponse.json(
      { error: "Error searching KMZ locations" },
      { status: 500 }
    )
  }
}

