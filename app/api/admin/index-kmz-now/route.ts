import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Immediate indexing endpoint - indexes KMZ locations from already stored metadata
 * POST /api/admin/index-kmz-now to start indexing immediately
 */
export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] Starting immediate KMZ indexing...")

    const supabase = await createClient()

    // Get all active KMZ files from kmz_collection that haven't been indexed yet
    console.log(requestId, "[v0] Fetching unindexed KMZ files...")
    const { data: kmzFiles, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, placemarks_count, coordinates, metadata, region")
      .eq("is_active", true)
      .gt("placemarks_count", 0)
      .order("created_at", { ascending: false })
      .limit(50)

    if (fetchError) {
      console.error(requestId, "[v0] Fetch error:", fetchError)
      throw new Error(`Failed to fetch KMZ: ${fetchError.message}`)
    }

    console.log(requestId, `[v0] Found ${kmzFiles?.length || 0} KMZ files to index`)

    if (!kmzFiles || kmzFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No KMZ files to index",
        indexed: 0,
        totalLocationsIndexed: 0,
        filesSuccessful: 0,
      })
    }

    let totalIndexed = 0
    let successCount = 0
    const results = []

    // Process each KMZ file
    for (let i = 0; i < kmzFiles.length; i++) {
      const kmz = kmzFiles[i]
      console.log(requestId, `[v0] [${i + 1}/${kmzFiles.length}] Processing: ${kmz.file_name}`)

      try {
        // Check if already indexed
        const { data: existing, count: existingCount } = await supabase
          .from("kmz_location_index")
          .select("id", { count: "exact", head: true })
          .eq("kmz_id", kmz.id)

        if (existingCount && existingCount > 0) {
          console.log(requestId, `[v0]   Already indexed (${existingCount} locations)`)
          results.push({
            file_name: kmz.file_name,
            status: "skipped",
            reason: "Already indexed",
            locations: existingCount,
          })
          totalIndexed += existingCount
          continue
        }

        // Extract coordinates from metadata
        const coordinates = kmz.coordinates || []
        const metadata = kmz.metadata || {}

        if (!Array.isArray(coordinates) || coordinates.length === 0) {
          console.log(requestId, `[v0]   No coordinates found in metadata`)
          results.push({
            file_name: kmz.file_name,
            status: "no_placemarks",
            indexed: 0,
          })
          continue
        }

        // Create index records from stored placemark data
        const locationsToInsert = coordinates.map((coord: any, index: number) => {
          const lng = Array.isArray(coord) ? coord[0] : coord.longitude || 0
          const lat = Array.isArray(coord) ? coord[1] : coord.latitude || 0
          const name = metadata.name || `Location ${index + 1}`

          return {
            kmz_id: kmz.id,
            name: name,
            description: metadata.description || "",
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            type: "Point",
            searchable_text: `${name} ${metadata.description || ""} ${kmz.file_name}`.toLowerCase(),
            region: kmz.region || null,
            city: null,
            address: null,
            created_at: new Date().toISOString(),
          }
        })

        console.log(requestId, `[v0]   Inserting ${locationsToInsert.length} locations...`)

        // Insert into database
        const { error: insertError, data: insertedData } = await supabase
          .from("kmz_location_index")
          .insert(locationsToInsert)
          .select()

        if (insertError) {
          console.error(requestId, `[v0]   Insert error: ${insertError.message}`)
          results.push({
            file_name: kmz.file_name,
            status: "error",
            error: insertError.message,
          })
          continue
        }

        const insertedCount = insertedData?.length || locationsToInsert.length
        console.log(requestId, `[v0]   ✓ Indexed ${insertedCount} locations`)
        results.push({
          file_name: kmz.file_name,
          status: "success",
          indexed: insertedCount,
        })
        totalIndexed += insertedCount
        successCount++
      } catch (error: any) {
        console.error(requestId, `[v0]   Error processing ${kmz.file_name}:`, error.message)
        results.push({
          file_name: kmz.file_name,
          status: "error",
          error: error.message,
        })
      }
    }

    console.log(requestId, "[v0] ============================================")
    console.log(requestId, `[v0] Indexing complete!`)
    console.log(requestId, `[v0] Successfully indexed: ${successCount} files`)
    console.log(requestId, `[v0] Total locations indexed: ${totalIndexed}`)
    console.log(requestId, "[v0] ============================================")

    return NextResponse.json({
      success: true,
      message: "KMZ indexing completed",
      filesProcessed: kmzFiles.length,
      filesSuccessful: successCount,
      totalLocationsIndexed: totalIndexed,
      results,
    })
  } catch (error: any) {
    console.error(requestId, "[v0] Fatal error:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

