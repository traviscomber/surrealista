import { createBrowserClient } from "@/lib/supabase/client"

export interface LocationSearchResult {
  id: string
  name: string
  type: string
  coordinates: {
    lat: number
    lng: number
  }
  region: string
  kmzFileName: string
  description?: string
}

export class KmzLocationSearchService {
  private supabase = createBrowserClient()

  /**
   * Search for locations by name (case-insensitive, partial match)
   */
  async searchByName(query: string): Promise<LocationSearchResult[]> {
    console.log("[v0] Searching locations by name:", query)

    try {
      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("*")
        .ilike("name", `%${query}%`)
        .limit(50)

      if (error) {
        console.error("[v0] Location search error:", error.message)
        return []
      }

      console.log("[v0] Found locations:", data?.length || 0)
      return (data as LocationSearchResult[]) || []
    } catch (err) {
      console.error("[v0] Exception searching locations:", err)
      return []
    }
  }

  /**
   * Search for locations by region
   */
  async searchByRegion(region: string): Promise<LocationSearchResult[]> {
    console.log("[v0] Searching locations by region:", region)

    try {
      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("*")
        .ilike("region", `%${region}%`)
        .limit(100)

      if (error) {
        console.error("[v0] Region search error:", error.message)
        return []
      }

      console.log("[v0] Found locations in region:", data?.length || 0)
      return (data as LocationSearchResult[]) || []
    } catch (err) {
      console.error("[v0] Exception searching by region:", err)
      return []
    }
  }

  /**
   * Search for locations by type (Polygon, Point, LineString, etc.)
   */
  async searchByType(type: string): Promise<LocationSearchResult[]> {
    console.log("[v0] Searching locations by type:", type)

    try {
      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("*")
        .eq("type", type)
        .limit(100)

      if (error) {
        console.error("[v0] Type search error:", error.message)
        return []
      }

      console.log("[v0] Found locations of type:", type, "count:", data?.length || 0)
      return (data as LocationSearchResult[]) || []
    } catch (err) {
      console.error("[v0] Exception searching by type:", err)
      return []
    }
  }

  /**
   * Get all locations from a specific KMZ file
   */
  async getLocationsByKmzFile(kmzFileName: string): Promise<LocationSearchResult[]> {
    console.log("[v0] Fetching locations from KMZ file:", kmzFileName)

    try {
      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("*")
        .eq("kmz_file_name", kmzFileName)
        .order("name", { ascending: true })

      if (error) {
        console.error("[v0] KMZ file search error:", error.message)
        return []
      }

      console.log("[v0] Found locations in KMZ file:", data?.length || 0)
      return (data as LocationSearchResult[]) || []
    } catch (err) {
      console.error("[v0] Exception searching KMZ file:", err)
      return []
    }
  }

  /**
   * Search nearby locations (within radius in km)
   */
  async searchNearby(lat: number, lng: number, radiusKm: number = 10): Promise<LocationSearchResult[]> {
    console.log("[v0] Searching locations nearby:", { lat, lng, radiusKm })

    try {
      // Using PostGIS distance calculation
      const { data, error } = await this.supabase.rpc("search_kmz_locations_nearby", {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm,
      })

      if (error) {
        console.error("[v0] Nearby search error:", error.message)
        return []
      }

      console.log("[v0] Found nearby locations:", data?.length || 0)
      return (data as LocationSearchResult[]) || []
    } catch (err) {
      console.error("[v0] Exception searching nearby:", err)
      return []
    }
  }

  /**
   * Get statistics about indexed locations
   */
  async getLocationStats(): Promise<{
    totalLocations: number
    locationTypes: Record<string, number>
    totalKmzFiles: number
    regions: string[]
  }> {
    console.log("[v0] Fetching location statistics")

    try {
      const { data, error } = await this.supabase.from("kmz_location_index").select("type, region, kmz_file_name")

      if (error) {
        console.error("[v0] Stats fetch error:", error.message)
        return {
          totalLocations: 0,
          locationTypes: {},
          totalKmzFiles: 0,
          regions: [],
        }
      }

      const locations = data as Array<{ type: string; region: string; kmz_file_name: string }>

      // Calculate statistics
      const locationTypes: Record<string, number> = {}
      const regions = new Set<string>()
      const kmzFiles = new Set<string>()

      locations.forEach((loc) => {
        locationTypes[loc.type] = (locationTypes[loc.type] || 0) + 1
        regions.add(loc.region)
        kmzFiles.add(loc.kmz_file_name)
      })

      const stats = {
        totalLocations: locations.length,
        locationTypes,
        totalKmzFiles: kmzFiles.size,
        regions: Array.from(regions),
      }

      console.log("[v0] Location stats:", stats)
      return stats
    } catch (err) {
      console.error("[v0] Exception fetching stats:", err)
      return {
        totalLocations: 0,
        locationTypes: {},
        totalKmzFiles: 0,
        regions: [],
      }
    }
  }
}
