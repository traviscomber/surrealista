import { createClient } from "@/lib/supabase/server"
import { KMZReader } from "@/lib/kmz/kmz-reader"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Simple indexing endpoint
 * POST /api/admin/index-kmz-now to start indexing immediately
 */
export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] Starting immediate KMZ indexing...")

    const supabase = await createClient()

    // Get all active KMZ files from kmz_collection
    console.log(requestId, "[v0] Fetching KMZ collection...")
    const { data: kmzFiles, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, url, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50)

    if (fetchError) {
      console.error(requestId, "[v0] Fetch error:", fetchError)
      throw new Error(`Failed to fetch KMZ: ${fetchError.message}`)
    }

    console.log(requestId, `[v0] Found ${kmzFiles?.length || 0} KMZ files`)

    if (!kmzFiles || kmzFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No KMZ files to index",
        indexed: 0,
      })
    }

    const kmzReader = new KMZReader()
    let totalIndexed = 0
    let successCount = 0
    const results = []

    // Process each KMZ file
    for (let i = 0; i < kmzFiles.length; i++) {
      const kmz = kmzFiles[i]
      console.log(requestId, `[v0] [${i + 1}/${kmzFiles.length}] Processing: ${kmz.file_name}`)

      try {
        // Check if already indexed
        const { data: existing } = await supabase
          .from("kmz_location_index")
          .select("id", { count: "exact", head: true })
          .eq("kmz_id", kmz.id)

        if (existing && existing.length > 0) {
          console.log(requestId, `[v0]   Already indexed (${existing.length} locations)`)
          results.push({
            file_name: kmz.file_name,
            status: "skipped",
            reason: "Already indexed",
          })
          totalIndexed += existing.length
          continue
        }

        // Extract placemarks from KMZ
        console.log(requestId, `[v0]   Reading KMZ file: ${kmz.url}`)
        const placemarks = await kmzReader.extractPlacemarks(kmz.url)
        console.log(requestId, `[v0]   Found ${placemarks.length} placemarks`)

        if (placemarks.length === 0) {
          results.push({
            file_name: kmz.file_name,
            status: "no_placemarks",
            indexed: 0,
          })
          continue
        }

        // Create index records
        const locationsToInsert = placemarks.map((p: any) => ({
          kmz_id: kmz.id,
          kmz_file_url: kmz.url,
          name: p.name || "Unnamed Location",
          description: p.description || "",
          latitude: p.latitude || 0,
          longitude: p.longitude || 0,
          type: p.type || "Point",
          searchable_text: `${p.name} ${p.description} ${kmz.file_name}`.toLowerCase(),
          region: null,
          city: null,
          address: null,
          created_at: new Date().toISOString(),
        }))

        // Insert into database
        const { error: insertError } = await supabase.from("kmz_location_index").insert(locationsToInsert)

        if (insertError) {
          console.error(requestId, `[v0]   Insert error: ${insertError.message}`)
          results.push({
            file_name: kmz.file_name,
            status: "error",
            error: insertError.message,
          })
          continue
        }

        console.log(requestId, `[v0]   ✓ Indexed ${placemarks.length} locations`)
        results.push({
          file_name: kmz.file_name,
          status: "success",
          indexed: placemarks.length,
        })
        totalIndexed += placemarks.length
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
