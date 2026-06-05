import { createClient } from "@/lib/supabase/server"
import { KMZReader } from "@/lib/kmz/kmz-reader"

export async function indexAllKMZLocations() {
  const requestId = `[${new Date().toISOString()}]`
  const supabase = await createClient()

  try {
    console.log(requestId, "[v0] Starting mass KMZ location indexing...")

    // Get all active KMZ files from kmz_collection
    const { data: kmzFiles, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (fetchError) {
      throw new Error(`Failed to fetch KMZ files: ${fetchError.message}`)
    }

    console.log(requestId, "[v0] Found", kmzFiles?.length || 0, "KMZ files to index")

    if (!kmzFiles || kmzFiles.length === 0) {
      return { success: true, message: "No KMZ files to index", indexed: 0 }
    }

    const kmzReader = new KMZReader()
    let totalIndexed = 0
    let successCount = 0
    let failureCount = 0
    const results: any[] = []

    // Process each KMZ file
    for (let i = 0; i < kmzFiles.length; i++) {
      const kmz = kmzFiles[i]

      try {
        console.log(
          requestId,
          `[v0] Processing KMZ ${i + 1}/${kmzFiles.length}: ${kmz.file_name}`
        )

        // First, delete any existing index entries for this KMZ to re-index
        const { error: deleteError } = await supabase
          .from("kmz_location_index")
          .delete()
          .eq("kmz_id", kmz.id)

        if (deleteError) {
          console.warn(requestId, `[v0] Warning: Could not delete old index: ${deleteError.message}`)
        }

        // Get placemarks for this KMZ from kmz_placemarks table
        const { data: placemarks, error: placemarksError } = await supabase
          .from("kmz_placemarks")
          .select("*")
          .eq("kmz_id", kmz.id)

        if (placemarksError) {
          throw placemarksError
        }

        // If no placemarks, skip
        if (!placemarks || placemarks.length === 0) {
          console.warn(requestId, `[v0] No placemarks found for: ${kmz.file_name}`)
          results.push({ file: kmz.file_name, status: "skipped", reason: "No placemarks" })
          continue
        }

        // Create location index entries from placemarks
        const locationEntries = (placemarks || []).map((placemark: any) => ({
          kmz_id: kmz.id,
          name: placemark.name,
          type: placemark.type,
          latitude: placemark.center_lat,
          longitude: placemark.center_lng,
          address: placemark.description || "",
          region: placemark.region || kmz.region || "Unknown",
          city: placemark.city || "",
          bounds: placemark.bounds,
          placemark_count: 1,
          searchable_text: `${placemark.name} ${placemark.description || ""} ${kmz.file_name}`.toLowerCase(),
          location_data: placemark.properties || {},
        }))

        if (locationEntries.length > 0) {
          // Insert in batches to avoid size limits
          const batchSize = 100
          for (let j = 0; j < locationEntries.length; j += batchSize) {
            const batch = locationEntries.slice(j, j + batchSize)
            const { error: insertError } = await supabase
              .from("kmz_location_index")
              .insert(batch)

            if (insertError) {
              console.error(requestId, "[v0] Error inserting batch:", insertError)
              throw insertError
            }
          }

          console.log(
            requestId,
            `[v0] Indexed ${locationEntries.length} locations from ${kmz.file_name}`
          )
          totalIndexed += locationEntries.length
          successCount++
          results.push({
            file: kmz.file_name,
            status: "success",
            locations: locationEntries.length,
          })
        } else {
          console.warn(requestId, `[v0] No placemarks found for: ${kmz.file_name}`)
          results.push({ file: kmz.file_name, status: "warning", reason: "No placemarks" })
        }
      } catch (error: any) {
        failureCount++
        console.error(requestId, "[v0] Error processing KMZ:", error?.message)
        results.push({
          file: kmz.file_name,
          status: "error",
          error: error?.message,
        })
      }
    }

    console.log(requestId, "[v0] Mass indexing complete:", {
      total: kmzFiles.length,
      success: successCount,
      failed: failureCount,
      totalLocations: totalIndexed,
    })

    return {
      success: true,
      message: "Mass KMZ indexing completed",
      total: kmzFiles.length,
      success: successCount,
      failed: failureCount,
      totalLocations: totalIndexed,
      results,
    }
  } catch (error: any) {
    console.error(requestId, "[v0] Mass indexing error:", error?.message)
    throw error
  }
}
