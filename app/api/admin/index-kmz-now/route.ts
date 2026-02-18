import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Immediate indexing endpoint - indexes KMZ locations from ALL sources:
 * 1. kmz_collection table
 * 2. property_documents table (KMZ files uploaded in communications)
 * POST /api/admin/index-kmz-now to start indexing immediately
 */
export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] Starting immediate KMZ indexing from ALL sources...")

    const supabase = await createClient()
    let totalIndexed = 0
    let successCount = 0
    const results = []

    // ===== SOURCE 1: KMZ Collection =====
    console.log(requestId, "[v0] SOURCE 1: Indexing kmz_collection...")
    try {
      const { data: kmzFiles, error: fetchError } = await supabase
        .from("kmz_collection")
        .select("id, file_name, placemarks_count, coordinates, metadata, region")
        .eq("is_active", true)
        .gt("placemarks_count", 0)
        .order("created_at", { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError

      console.log(requestId, `[v0]   Found ${kmzFiles?.length || 0} KMZ files in collection`)

      for (let i = 0; i < (kmzFiles?.length || 0); i++) {
        const kmz = kmzFiles![i]
        console.log(requestId, `[v0]   [${i + 1}/${kmzFiles?.length}] ${kmz.file_name}`)

        // Check if already indexed
        const { count: existingCount } = await supabase
          .from("kmz_location_index")
          .select("id", { count: "exact", head: true })
          .eq("kmz_id", kmz.id)

        if (existingCount && existingCount > 0) {
          console.log(requestId, `[v0]     ✓ Already indexed (${existingCount} locations)`)
          results.push({
            source: "kmz_collection",
            file_name: kmz.file_name,
            status: "already_indexed",
            locations: existingCount,
          })
          totalIndexed += existingCount
          continue
        }

        // Extract coordinates
        const coordinates = kmz.coordinates || []
        const metadata = kmz.metadata || {}

        if (!Array.isArray(coordinates) || coordinates.length === 0) {
          console.log(requestId, `[v0]     ⚠ No coordinates`)
          results.push({
            source: "kmz_collection",
            file_name: kmz.file_name,
            status: "no_placemarks",
          })
          continue
        }

        // Create index records
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

        // Insert
        const { error: insertError, data: insertedData } = await supabase
          .from("kmz_location_index")
          .insert(locationsToInsert)
          .select()

        if (insertError) {
          console.log(requestId, `[v0]     ✗ Error: ${insertError.message}`)
          results.push({
            source: "kmz_collection",
            file_name: kmz.file_name,
            status: "error",
            error: insertError.message,
          })
          continue
        }

        const count = insertedData?.length || locationsToInsert.length
        console.log(requestId, `[v0]     ✓ Indexed ${count} locations`)
        results.push({
          source: "kmz_collection",
          file_name: kmz.file_name,
          status: "success",
          indexed: count,
        })
        totalIndexed += count
        successCount++
      }
    } catch (error: any) {
      console.error(requestId, "[v0]   KMZ Collection error:", error.message)
    }

    // ===== SOURCE 2: Property Documents KMZ =====
    console.log(requestId, "[v0] SOURCE 2: Indexing property_documents (KMZ category)...")
    try {
      const { data: docs, error: fetchError } = await supabase
        .from("property_documents")
        .select("id, title, file_name, file_url, category, metadata")
        .ilike("category", "%kmz%")
        .order("created_at", { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError

      console.log(requestId, `[v0]   Found ${docs?.length || 0} KMZ files in documents`)

      for (let i = 0; i < (docs?.length || 0); i++) {
        const doc = docs![i]
        const docId = `doc_${doc.id}`
        console.log(requestId, `[v0]   [${i + 1}/${docs?.length}] ${doc.title || doc.file_name}`)

        // Check if already indexed
        const { count: existingCount } = await supabase
          .from("kmz_location_index")
          .select("id", { count: "exact", head: true })
          .eq("kmz_id", docId)

        if (existingCount && existingCount > 0) {
          console.log(requestId, `[v0]     ✓ Already indexed (${existingCount} locations)`)
          results.push({
            source: "property_documents",
            file_name: doc.title || doc.file_name,
            status: "already_indexed",
            locations: existingCount,
          })
          totalIndexed += existingCount
          continue
        }

        // Extract metadata
        const metadata = doc.metadata || {}
        const coordinates = metadata.coordinates || []

        if (!Array.isArray(coordinates) || coordinates.length === 0) {
          console.log(requestId, `[v0]     ⚠ No coordinates`)
          results.push({
            source: "property_documents",
            file_name: doc.title || doc.file_name,
            status: "no_coordinates",
          })
          continue
        }

        // Create index records
        const locationsToInsert = coordinates.map((coord: any, index: number) => {
          const lng = Array.isArray(coord) ? coord[0] : coord.longitude || 0
          const lat = Array.isArray(coord) ? coord[1] : coord.latitude || 0
          const name = metadata.name || `Location ${index + 1}`

          return {
            kmz_id: docId,
            name: name,
            description: metadata.description || "",
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            type: "Point",
            searchable_text: `${name} ${metadata.description || ""} ${doc.title || doc.file_name}`.toLowerCase(),
            region: metadata.region || null,
            city: metadata.city || null,
            address: metadata.address || null,
            created_at: new Date().toISOString(),
          }
        })

        // Insert
        const { error: insertError, data: insertedData } = await supabase
          .from("kmz_location_index")
          .insert(locationsToInsert)
          .select()

        if (insertError) {
          console.log(requestId, `[v0]     ✗ Error: ${insertError.message}`)
          results.push({
            source: "property_documents",
            file_name: doc.title || doc.file_name,
            status: "error",
            error: insertError.message,
          })
          continue
        }

        const count = insertedData?.length || locationsToInsert.length
        console.log(requestId, `[v0]     ✓ Indexed ${count} locations`)
        results.push({
          source: "property_documents",
          file_name: doc.title || doc.file_name,
          status: "success",
          indexed: count,
        })
        totalIndexed += count
        successCount++
      }
    } catch (error: any) {
      console.error(requestId, "[v0]   Property documents error:", error.message)
    }

    console.log(requestId, "[v0] ============================================")
    console.log(requestId, `[v0] Indexing complete!`)
    console.log(requestId, `[v0] Successfully indexed: ${successCount} sources`)
    console.log(requestId, `[v0] Total locations indexed: ${totalIndexed}`)
    console.log(requestId, "[v0] ============================================")

    return NextResponse.json({
      success: true,
      message: "KMZ indexing completed from all sources",
      sourcesProcessed: results.filter((r) => r.status === "success").length,
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

