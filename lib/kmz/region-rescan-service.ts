import { createBrowserClient } from "@/lib/supabase/client"
import { detectRegionFromBounds, detectRegionFromCoordinateArray } from "@/lib/utils/region-detector"

export interface RescanProgress {
  total: number
  processed: number
  updated: number
  failed: number
  currentFile: string
}

class RegionRescanService {
  private supabase = createBrowserClient()

  /**
   * Rescan all KMZ files in "Sin Región" and reassign them to correct regions
   */
  async rescanAndUpdateRegions(
    onProgress?: (progress: RescanProgress) => void
  ): Promise<{ success: boolean; totalUpdated: number; errors: string[] }> {
    try {
      // Fetch all KMZ files with Sin Región or null region
      const { data: kmzFiles, error } = await this.supabase
        .from("kmz_collection")
        .select("id, file_name, bounds, coordinates, region")
        .or("region.eq.Sin Región,region.is.null")
        .eq("is_active", true)

      if (error) throw error

      const total = kmzFiles?.length || 0
      let processed = 0
      let updated = 0
      let failed = 0
      const errors: string[] = []

      console.log(`[v0] Starting region rescan for ${total} KMZ files...`)

      // Process each file
      for (const kmz of kmzFiles || []) {
        try {
          let detectedRegion = "Sin Región"

          // Try to detect region from bounds first
          if (kmz.bounds) {
            detectedRegion = detectRegionFromBounds(kmz.bounds)
          }
          // If bounds detection failed, try coordinates array
          else if (kmz.coordinates && Array.isArray(kmz.coordinates)) {
            detectedRegion = detectRegionFromCoordinateArray(kmz.coordinates)
          }

          // Only update if we found a valid region
          if (detectedRegion !== "Sin Región" && detectedRegion !== kmz.region) {
            const { error: updateError } = await this.supabase
              .from("kmz_collection")
              .update({ region: detectedRegion })
              .eq("id", kmz.id)

            if (updateError) {
              console.error(`[v0] Error updating ${kmz.file_name}:`, updateError)
              errors.push(`${kmz.file_name}: ${updateError.message}`)
              failed++
            } else {
              console.log(`[v0] Updated ${kmz.file_name} to ${detectedRegion}`)
              updated++
            }
          }

          processed++

          // Report progress
          if (onProgress) {
            onProgress({
              total,
              processed,
              updated,
              failed,
              currentFile: kmz.file_name,
            })
          }
        } catch (error: any) {
          console.error(`[v0] Error processing ${kmz.file_name}:`, error)
          errors.push(`${kmz.file_name}: ${error.message}`)
          failed++
          processed++
        }
      }

      console.log(`[v0] Region rescan complete. Updated: ${updated}, Failed: ${failed}`)

      return {
        success: true,
        totalUpdated: updated,
        errors,
      }
    } catch (error: any) {
      console.error("[v0] Error during region rescan:", error)
      return {
        success: false,
        totalUpdated: 0,
        errors: [error.message],
      }
    }
  }
}

export const regionRescanService = new RegionRescanService()
