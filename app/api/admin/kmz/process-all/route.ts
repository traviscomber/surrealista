import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { parseKMZFile } from "@/lib/kmz/kmz-reader"
import { kmzLocationIndexer } from "@/lib/kmz/kmz-location-indexer"

export const maxDuration = 300 // 5 minutes timeout

export async function POST(request: NextRequest) {
  const requestId = `[${Date.now()}]`
  console.log(requestId, "[v0] Starting process all KMZ")

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all active KMZ files
    const { data: kmzFiles, error: listError } = await supabase
      .from("kmz_collection")
      .select("*")
      .eq("is_active", true)
      .limit(338)

    if (listError) {
      throw listError
    }

    console.log(requestId, "[v0] Found", kmzFiles?.length, "KMZ files to process")

    let processed = 0
    let indexed = 0
    const errors: any[] = []

    for (const kmz of kmzFiles || []) {
      try {
        // Try to download from Google Drive if available
        let kmzData = null

        if (kmz.drive_file_id) {
          console.log(requestId, `[v0] Downloading from Google Drive: ${kmz.file_name}`)
          // Download from Google Drive using the drive service
          // This would require Google Drive authentication
          // For now, skip Google Drive files
        }

        if (!kmzData && kmz.file_path === "offline-upload") {
          console.warn(requestId, `[v0] Offline file without accessible content: ${kmz.file_name}`)
          continue
        }

        if (!kmzData) {
          continue
        }

        // Extract and index placemarks
        if (kmzData.placemarks && kmzData.placemarks.length > 0) {
          await kmzLocationIndexer.initialize()
          const result = await kmzLocationIndexer.indexKMZLocations(
            kmz.id,
            kmz.file_name,
            kmzData.placemarks,
            kmz.region
          )
          indexed += result.indexCount
          console.log(requestId, `[v0] ✓ Indexed ${result.indexCount} from ${kmz.file_name}`)
        }

        processed++
      } catch (error: any) {
        console.error(requestId, `[v0] Error processing ${kmz.file_name}:`, error?.message)
        errors.push({
          file: kmz.file_name,
          error: error?.message,
        })
      }
    }

    console.log(requestId, "[v0] Processing complete:", {
      processed,
      indexed,
      errors: errors.length,
    })

    return NextResponse.json({
      success: true,
      processed,
      indexed,
      errors,
      message: `Processed ${processed} KMZ files, indexed ${indexed} locations`,
    })
  } catch (error: any) {
    console.error(requestId, "[v0] Error:", error?.message)
    return NextResponse.json(
      { error: error?.message || "Processing failed" },
      { status: 500 }
    )
  }
}
