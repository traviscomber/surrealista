import { createClient } from "@/lib/supabase/server"
import { KMZReader } from "@/lib/kmz/kmz-reader"

/**
 * Manual script to index all KMZ locations
 * Run: npx ts-node scripts/manual-index-kmz.ts
 */
async function indexAllKMZ() {
  console.log("[v0] Starting manual KMZ indexing...")

  try {
    const supabase = await createClient()

    // Get all active KMZ files
    console.log("[v0] Fetching KMZ collection...")
    const { data: kmzFiles, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, url, placemarks_count, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (fetchError) {
      throw new Error(`Failed to fetch KMZ: ${fetchError.message}`)
    }

    console.log(`[v0] Found ${kmzFiles?.length || 0} active KMZ files`)

    if (!kmzFiles || kmzFiles.length === 0) {
      console.log("[v0] No KMZ files to index")
      return
    }

    const kmzReader = new KMZReader()
    let totalLocations = 0
    let successCount = 0

    // Process each KMZ
    for (let i = 0; i < kmzFiles.length; i++) {
      const kmz = kmzFiles[i]
      console.log(`[v0] [${i + 1}/${kmzFiles.length}] Indexing: ${kmz.file_name}`)

      try {
        // Check if already indexed
        const { data: existing } = await supabase
          .from("kmz_location_index")
          .select("id", { count: "exact", head: true })
          .eq("kmz_id", kmz.id)

        if (existing && existing.length > 0) {
          console.log(`[v0]   ✓ Already indexed (${existing.length} locations)`)
          totalLocations += existing.length
          continue
        }

        // Read KMZ file
        const placemarks = await kmzReader.extractPlacemarks(kmz.url)
        console.log(`[v0]   • Found ${placemarks.length} locations`)

        if (placemarks.length === 0) {
          continue
        }

        // Insert locations into index
        const locationsToInsert = placemarks.map((p: any) => ({
          kmz_id: kmz.id,
          kmz_file_url: kmz.url,
          name: p.name || "Unnamed",
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

        const { error: insertError } = await supabase
          .from("kmz_location_index")
          .insert(locationsToInsert)

        if (insertError) {
          console.error(`[v0]   ✗ Error inserting: ${insertError.message}`)
          continue
        }

        console.log(`[v0]   ✓ Indexed ${placemarks.length} locations`)
        totalLocations += placemarks.length
        successCount++
      } catch (error: any) {
        console.error(`[v0]   ✗ Error: ${error.message}`)
      }
    }

    console.log("[v0] ==========================================")
    console.log(`[v0] Indexing complete!`)
    console.log(`[v0] Successfully indexed: ${successCount} files`)
    console.log(`[v0] Total locations: ${totalLocations}`)
    console.log("[v0] ==========================================")
  } catch (error: any) {
    console.error("[v0] Fatal error:", error.message)
    process.exit(1)
  }
}

// Run the script
indexAllKMZ().then(() => {
  console.log("[v0] Done!")
  process.exit(0)
})
