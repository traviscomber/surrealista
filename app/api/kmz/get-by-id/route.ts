import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * API endpoint to get all locations for a specific KMZ file
 */
export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    const { searchParams } = new URL(request.url)
    const kmzId = searchParams.get("kmzId")

    if (!kmzId) {
      console.error(requestId, "[v0] Missing kmzId parameter")
      return NextResponse.json(
        { error: "Missing kmzId parameter" },
        { status: 400 }
      )
    }

    console.log(requestId, "[v0] Fetching locations for KMZ:", kmzId)

    const supabase = await createClient()

    // First, get the KMZ info to verify it exists
    const { data: kmzInfo, error: kmzError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, placemarks_count, bounds")
      .eq("id", kmzId)
      .single()

    if (kmzError || !kmzInfo) {
      console.error(requestId, "[v0] KMZ not found:", kmzId)
      return NextResponse.json(
        { error: "KMZ file not found" },
        { status: 404 }
      )
    }

    // Get all locations for this KMZ
    const { data: locations, error: locError } = await supabase
      .from("kmz_location_index")
      .select("id, name, latitude, longitude, region, city, type, address, location_data")
      .eq("kmz_id", kmzId)
      .order("name", { ascending: true })

    if (locError) {
      console.error(requestId, "[v0] Error fetching locations:", locError)
      return NextResponse.json(
        { error: "Error fetching locations" },
        { status: 500 }
      )
    }

    console.log(requestId, "[v0] Found", locations?.length || 0, "locations for KMZ:", kmzInfo.file_name)

    return NextResponse.json({
      success: true,
      kmz: {
        id: kmzInfo.id,
        name: kmzInfo.file_name,
        placemarks_count: kmzInfo.placemarks_count,
        bounds: kmzInfo.bounds,
      },
      locations: locations || [],
      count: locations?.length || 0,
    })
  } catch (error: any) {
    console.error(requestId, "[v0] Unexpected error:", error.message)
    return NextResponse.json(
      { error: "Unexpected error fetching KMZ locations" },
      { status: 500 }
    )
  }
}
