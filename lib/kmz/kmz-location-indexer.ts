import { createClient } from "@/lib/supabase/server"
import { detectRegionFromCoordinateArray } from "@/lib/utils/region-detector"
import type { KMZPlacemark } from "@/lib/kmz/kmz-reader"

export interface KMZLocationIndex {
  id: string
  kmz_id: string
  name: string
  type: "region" | "city" | "property" | "landmark"
  latitude: number
  longitude: number
  region: string
  city?: string
  address?: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  placemark_count: number
  placemarks: KMZPlacemark[]
  created_at: string
}

export class KMZLocationIndexer {
  private supabase: any

  constructor() {}

  async initialize() {
    this.supabase = await createClient()
  }

  /**
   * Extract and index all locations from KMZ placemarks
   * This is called when a KMZ file is uploaded to create a searchable location index
   */
  async indexKMZLocations(
    kmzId: string,
    kmzFileName: string,
    placemarks: KMZPlacemark[],
    region?: string,
  ): Promise<{ success: boolean; indexCount: number; error?: any }> {
    try {
      if (!this.supabase) await this.initialize()

      if (!placemarks || placemarks.length === 0) {
        console.log("[v0] No placemarks to index for KMZ:", kmzId)
        return { success: true, indexCount: 0 }
      }

      console.log(`[v0] Indexing ${placemarks.length} placemarks for KMZ: ${kmzFileName}`)

      // Group placemarks by region and extract unique locations
      const locationsByRegion = new Map<string, KMZPlacemark[]>()

      for (const placemark of placemarks) {
        const detectedRegion = region || detectRegionFromCoordinateArray(placemark.coordinates)
        if (!locationsByRegion.has(detectedRegion)) {
          locationsByRegion.set(detectedRegion, [])
        }
        locationsByRegion.get(detectedRegion)!.push(placemark)
      }

      // Create location indexes for each region
      const indexRecords: any[] = []

      for (const [detectedRegion, regionPlacemarks] of locationsByRegion.entries()) {
        // Calculate bounds for all placemarks in this region
        let bounds = { north: -90, south: 90, east: -180, west: 180 }

        for (const placemark of regionPlacemarks) {
          placemark.coordinates.forEach(([lng, lat]) => {
            bounds.north = Math.max(bounds.north, lat)
            bounds.south = Math.min(bounds.south, lat)
            bounds.east = Math.max(bounds.east, lng)
            bounds.west = Math.min(bounds.west, lng)
          })
        }

        // Get center point for the region
        const centerLat = (bounds.north + bounds.south) / 2
        const centerLng = (bounds.east + bounds.west) / 2

        // Create index record
        indexRecords.push({
          kmz_id: kmzId,
          region: detectedRegion,
          name: `${detectedRegion} - ${kmzFileName}`,
          type: "region",
          latitude: centerLat,
          longitude: centerLng,
          bounds: bounds,
          placemark_count: regionPlacemarks.length,
          location_data: {
            region: detectedRegion,
            placemark_names: regionPlacemarks.map((p) => p.name).slice(0, 10), // Store first 10 placemark names
            total_placemarks: regionPlacemarks.length,
            bounds: bounds,
          },
          searchable_text: `${detectedRegion} ${kmzFileName} ${regionPlacemarks.map((p) => p.name).join(" ")}`.toLowerCase(),
        })

        // Also create individual location indexes for important placemarks (Points)
        const pointPlacemarks = regionPlacemarks.filter((p) => p.type === "Point")
        for (const placemark of pointPlacemarks.slice(0, 20)) {
          // Limit to top 20 points per region
          const centerLng = placemark.coordinates[0]?.[0] ?? 0
          const centerLat = placemark.coordinates[0]?.[1] ?? 0

          indexRecords.push({
            kmz_id: kmzId,
            region: detectedRegion,
            name: placemark.name,
            type: "landmark",
            latitude: centerLat,
            longitude: centerLng,
            bounds: { north: centerLat, south: centerLat, east: centerLng, west: centerLng },
            placemark_count: 1,
            location_data: {
              region: detectedRegion,
              placemark_name: placemark.name,
              description: placemark.description,
              properties: placemark.properties,
            },
            searchable_text: `${placemark.name} ${detectedRegion} ${placemark.description || ""}`.toLowerCase(),
          })
        }
      }

      // Insert location indexes into the database
      if (indexRecords.length > 0) {
        const { error } = await this.supabase.from("kmz_location_index").insert(indexRecords)

        if (error) {
          console.error("[v0] Error inserting location index records:", error)
          // Don't throw - this is non-critical for KMZ processing
        } else {
          console.log(`[v0] Successfully indexed ${indexRecords.length} location records for KMZ: ${kmzId}`)
        }
      }

      // Update kmz_collection with location metadata
      const bounds = { north: -90, south: 90, east: -180, west: 180 }
      for (const placemark of placemarks) {
        placemark.coordinates.forEach(([lng, lat]) => {
          bounds.north = Math.max(bounds.north, lat)
          bounds.south = Math.min(bounds.south, lat)
          bounds.east = Math.max(bounds.east, lng)
          bounds.west = Math.min(bounds.west, lng)
        })
      }

      const centerLat = (bounds.north + bounds.south) / 2
      const centerLng = (bounds.east + bounds.west) / 2

      const { error: updateError } = await this.supabase
        .from("kmz_collection")
        .update({
          coordinates: {
            latitude: centerLat,
            longitude: centerLng,
            bounds: bounds,
          },
          placemarks_count: placemarks.length,
          bounds: bounds,
        })
        .eq("id", kmzId)

      if (updateError) {
        console.error("[v0] Error updating KMZ collection:", updateError)
      }

      return { success: true, indexCount: indexRecords.length }
    } catch (error) {
      console.error("[v0] Error indexing KMZ locations:", error)
      return { success: false, indexCount: 0, error }
    }
  }

  /**
   * Search for KMZ locations globally
   * Used as a common search point across the platform
   */
  async searchLocations(
    searchTerm: string,
    options?: { region?: string; type?: string; limit?: number },
  ): Promise<KMZLocationIndex[]> {
    try {
      if (!this.supabase) await this.initialize()

      const limit = options?.limit || 50

      let query = this.supabase
        .from("kmz_location_index")
        .select("*")
        .ilike("searchable_text", `%${searchTerm}%`)

      if (options?.region) {
        query = query.eq("region", options.region)
      }

      if (options?.type) {
        query = query.eq("type", options.type)
      }

      const { data, error } = await query.limit(limit)

      if (error) {
        console.error("[v0] Error searching locations:", error)
        return []
      }

      return (data || []) as KMZLocationIndex[]
    } catch (error) {
      console.error("[v0] Error in searchLocations:", error)
      return []
    }
  }

  /**
   * Get locations by region for quick access
   */
  async getLocationsByRegion(region: string, limit: number = 100): Promise<KMZLocationIndex[]> {
    try {
      if (!this.supabase) await this.initialize()

      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("*")
        .eq("region", region)
        .eq("type", "region")
        .limit(limit)

      if (error) {
        console.error("[v0] Error fetching locations by region:", error)
        return []
      }

      return (data || []) as KMZLocationIndex[]
    } catch (error) {
      console.error("[v0] Error in getLocationsByRegion:", error)
      return []
    }
  }

  /**
   * Get nearby locations based on coordinates
   */
  async getNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ): Promise<KMZLocationIndex[]> {
    try {
      if (!this.supabase) await this.initialize()

      // Simple bounding box search (more accurate would use PostGIS)
      const latOffset = radiusKm / 111 // 1 degree lat ≈ 111 km
      const lngOffset = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("*")
        .gte("latitude", latitude - latOffset)
        .lte("latitude", latitude + latOffset)
        .gte("longitude", longitude - lngOffset)
        .lte("longitude", longitude + lngOffset)
        .limit(100)

      if (error) {
        console.error("[v0] Error fetching nearby locations:", error)
        return []
      }

      return (data || []) as KMZLocationIndex[]
    } catch (error) {
      console.error("[v0] Error in getNearbyLocations:", error)
      return []
    }
  }

  /**
   * Delete location indexes when KMZ is deleted
   */
  async deleteLocationIndexes(kmzId: string): Promise<{ success: boolean; deletedCount: number }> {
    try {
      if (!this.supabase) await this.initialize()

      const { error, count } = await this.supabase.from("kmz_location_index").delete().eq("kmz_id", kmzId)

      if (error) {
        console.error("[v0] Error deleting location indexes:", error)
        return { success: false, deletedCount: 0 }
      }

      console.log(`[v0] Deleted ${count} location indexes for KMZ: ${kmzId}`)
      return { success: true, deletedCount: count || 0 }
    } catch (error) {
      console.error("[v0] Error in deleteLocationIndexes:", error)
      return { success: false, deletedCount: 0 }
    }
  }
}

// Export singleton instance
export const kmzLocationIndexer = new KMZLocationIndexer()
