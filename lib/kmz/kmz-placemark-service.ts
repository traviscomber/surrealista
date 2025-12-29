import { supabase } from "@/lib/supabase/client"
import { detectRegionFromCoordinateArray } from "@/lib/utils/region-detector"
import type { KMZPlacemark } from "@/lib/kmz/kmz-reader"

export interface StoredPlacemark {
  id: string
  kmz_id: string
  name: string
  description?: string
  coordinates: number[][]
  type: "Point" | "LineString" | "Polygon"
  style_url?: string
  properties?: Record<string, any>
  center_point?: { type: string; coordinates: number[] }
  region?: string
  bounds?: { north: number; south: number; east: number; west: number }
}

class KMZPlacemarkService {
  /**
   * Save all placemarks from a KMZ file to database
   * New method for batch inserting placemarks during KMZ processing
   */
  async savePlacemarks(
    kmzId: string,
    placemarks: KMZPlacemark[],
  ): Promise<{ success: boolean; count: number; error?: any }> {
    try {
      if (!placemarks || placemarks.length === 0) {
        return { success: true, count: 0 }
      }

      // Prepare placemarks for bulk insert
      const placemarksToInsert = placemarks.map((placemark) => {
        const centerLng = placemark.coordinates[0]?.[0] ?? 0
        const centerLat = placemark.coordinates[0]?.[1] ?? 0
        const region = detectRegionFromCoordinateArray(placemark.coordinates)

        // Calculate bounds for the placemark
        const bounds = { north: -90, south: 90, east: -180, west: 180 }
        placemark.coordinates.forEach(([lng, lat]) => {
          bounds.north = Math.max(bounds.north, lat)
          bounds.south = Math.min(bounds.south, lat)
          bounds.east = Math.max(bounds.east, lng)
          bounds.west = Math.min(bounds.west, lng)
        })

        return {
          kmz_id: kmzId,
          name: placemark.name,
          description: placemark.description || null,
          coordinates: placemark.coordinates,
          type: placemark.type,
          style_url: placemark.styleUrl || null,
          properties: placemark.properties || {},
          center_point: `SRID=4326;POINT(${centerLng} ${centerLat})`, // PostGIS format
          region,
          bounds,
        }
      })

      // Batch insert (Supabase can handle bulk inserts)
      const { error } = await supabase.from("kmz_placemarks").insert(placemarksToInsert)

      if (error) throw error

      console.log(`[v0] Saved ${placemarksToInsert.length} placemarks for KMZ ${kmzId}`)
      return { success: true, count: placemarksToInsert.length }
    } catch (error) {
      console.error("[v0] Error saving placemarks:", error)
      return { success: false, count: 0, error }
    }
  }

  /**
   * Load placemarks by region
   * Query database instead of parsing KMZ files each time
   */
  async loadPlacemarksByRegion(region: string): Promise<StoredPlacemark[]> {
    try {
      const { data, error } = await supabase.from("kmz_placemarks").select("*").eq("region", region).limit(1000) // Limit for initial load

      if (error) throw error
      return (data || []) as StoredPlacemark[]
    } catch (error) {
      console.error("[v0] Error loading placemarks by region:", error)
      return []
    }
  }

  /**
   * Search placemarks by name
   */
  async searchPlacemarks(searchTerm: string): Promise<StoredPlacemark[]> {
    try {
      const { data, error } = await supabase
        .from("kmz_placemarks")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .limit(100)

      if (error) throw error
      return (data || []) as StoredPlacemark[]
    } catch (error) {
      console.error("[v0] Error searching placemarks:", error)
      return []
    }
  }

  /**
   * Load placemarks by KMZ ID
   */
  async loadPlacemarksForKmz(kmzId: string): Promise<StoredPlacemark[]> {
    try {
      const { data, error } = await supabase.from("kmz_placemarks").select("*").eq("kmz_id", kmzId)

      if (error) throw error
      return (data || []) as StoredPlacemark[]
    } catch (error) {
      console.error("[v0] Error loading placemarks for KMZ:", error)
      return []
    }
  }

  /**
   * Get statistics about stored placemarks
   */
  async getStats(): Promise<{ total: number; byRegion: Record<string, number>; byType: Record<string, number> }> {
    try {
      const { data, error } = await supabase.from("kmz_placemarks").select("region, type")

      if (error) throw error

      const byRegion: Record<string, number> = {}
      const byType: Record<string, number> = {}

      data?.forEach((placemark) => {
        byRegion[placemark.region] = (byRegion[placemark.region] || 0) + 1
        byType[placemark.type] = (byType[placemark.type] || 0) + 1
      })

      return {
        total: data?.length || 0,
        byRegion,
        byType,
      }
    } catch (error) {
      console.error("[v0] Error getting stats:", error)
      return { total: 0, byRegion: {}, byType: {} }
    }
  }

  /**
   * Delete placemarks for a KMZ (cascade delete handled by FK)
   */
  async deletePlacemarksForKmz(kmzId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("kmz_placemarks").delete().eq("kmz_id", kmzId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("[v0] Error deleting placemarks:", error)
      return false
    }
  }
}

export const kmzPlacemarkService = new KMZPlacemarkService()
