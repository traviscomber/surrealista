import { supabase } from "@/lib/supabase/client"
import { detectRegionFromBounds } from "@/lib/utils/region-detector"

export interface StoredKMZ {
  id: string
  file_name: string
  file_path: string
  drive_file_id: string | null
  description: string | null
  metadata: any
  placemarks_count: number
  rol_numbers: string[]
  bounds: any
  coordinates: any
  tags: string[]
  category: string | null
  region: string | null // Added region field
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface KMZForMap {
  id: string
  fileName: string
  coordinates: Array<[number, number]>
  bounds: any
  placemarks: number
  rolNumbers: string[]
  category: string | null
}

class KMZStorageService {
  private supabase = supabase

  /**
   * Load all active KMZ files from database
   */
  async loadAllKMZ(): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data as StoredKMZ[]).map((kmz) => ({
        id: kmz.id,
        fileName: kmz.file_name,
        coordinates: kmz.coordinates || [],
        bounds: kmz.bounds,
        placemarks: kmz.placemarks_count,
        rolNumbers: kmz.rol_numbers || [],
        category: kmz.category,
      }))
    } catch (error) {
      console.error("[v0] Error loading KMZ from database:", error)
      return []
    }
  }

  /**
   * Load KMZ files by category
   */
  async loadKMZByCategory(category: string): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("category", category)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data as StoredKMZ[]).map((kmz) => ({
        id: kmz.id,
        fileName: kmz.file_name,
        coordinates: kmz.coordinates || [],
        bounds: kmz.bounds,
        placemarks: kmz.placemarks_count,
        rolNumbers: kmz.rol_numbers || [],
        category: kmz.category,
      }))
    } catch (error) {
      console.error("[v0] Error loading KMZ by category:", error)
      return []
    }
  }

  /**
   * Load specific KMZ files by IDs
   */
  async loadKMZByIds(ids: string[]): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase.from("kmz_collection").select("*").in("id", ids).eq("is_active", true)

      if (error) throw error

      return (data as StoredKMZ[]).map((kmz) => ({
        id: kmz.id,
        fileName: kmz.file_name,
        coordinates: kmz.coordinates || [],
        bounds: kmz.bounds,
        placemarks: kmz.placemarks_count,
        rolNumbers: kmz.rol_numbers || [],
        category: kmz.category,
      }))
    } catch (error) {
      console.error("[v0] Error loading KMZ by IDs:", error)
      return []
    }
  }

  /**
   * Search KMZ files by rol number
   */
  async searchByRol(rolNumber: string): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .contains("rol_numbers", [rolNumber])
        .eq("is_active", true)

      if (error) throw error

      return (data as StoredKMZ[]).map((kmz) => ({
        id: kmz.id,
        fileName: kmz.file_name,
        coordinates: kmz.coordinates || [],
        bounds: kmz.bounds,
        placemarks: kmz.placemarks_count,
        rolNumbers: kmz.rol_numbers || [],
        category: kmz.category,
      }))
    } catch (error) {
      console.error("[v0] Error searching KMZ by rol:", error)
      return []
    }
  }

  /**
   * Load KMZ files by region
   */
  async loadKMZByRegion(region: string): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("region", region)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data as StoredKMZ[]).map((kmz) => ({
        id: kmz.id,
        fileName: kmz.file_name,
        coordinates: kmz.coordinates || [],
        bounds: kmz.bounds,
        placemarks: kmz.placemarks_count,
        rolNumbers: kmz.rol_numbers || [],
        category: kmz.category,
      }))
    } catch (error) {
      console.error("[v0] Error loading KMZ by region:", error)
      return []
    }
  }

  /**
   * Get statistics about stored KMZ files
   */
  async getStats() {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("placemarks_count, rol_numbers, is_active")

      if (error) throw error

      const total = data.length
      const active = data.filter((kmz) => kmz.is_active).length
      const totalPlacemarks = data.reduce((sum, kmz) => sum + (kmz.placemarks_count || 0), 0)
      const allRoles = new Set(data.flatMap((kmz) => kmz.rol_numbers || []))

      return {
        total,
        active,
        totalPlacemarks,
        totalRoles: allRoles.size,
      }
    } catch (error) {
      console.error("[v0] Error getting KMZ stats:", error)
      return {
        total: 0,
        active: 0,
        totalPlacemarks: 0,
        totalRoles: 0,
      }
    }
  }

  /**
   * Save a new KMZ file to the database
   */
  async saveKMZ(kmzData: {
    file_name: string
    file_path: string
    drive_file_id?: string
    description?: string
    metadata?: any
    placemarks_count: number
    rol_numbers?: string[]
    bounds?: any
    coordinates: any
    tags?: string[]
    category?: string
    created_by?: string
    file_size?: number // Added file_size parameter
  }): Promise<{ success: boolean; id?: string; error?: any }> {
    try {
      const MAX_SIZE = 10 * 1024 * 1024 // 10MB
      if (kmzData.file_size && kmzData.file_size > MAX_SIZE) {
        console.warn(
          `[v0] Skipping save for large file: ${kmzData.file_name} (${(kmzData.file_size / (1024 * 1024)).toFixed(2)}MB exceeds 10MB limit)`,
        )
        return {
          success: false,
          error: `File too large: ${(kmzData.file_size / (1024 * 1024)).toFixed(2)}MB. Maximum size is 10MB.`,
        }
      }

      if (kmzData.drive_file_id) {
        const { data: existing } = await this.supabase
          .from("kmz_collection")
          .select("id")
          .eq("drive_file_id", kmzData.drive_file_id)
          .single()

        if (existing) {
          console.log("[v0] KMZ already exists in database:", kmzData.file_name)
          return { success: true, id: existing.id }
        }
      }

      const region = kmzData.bounds ? detectRegionFromBounds(kmzData.bounds) : "Sin Región"

      const { data, error } = await this.supabase
        .from("kmz_collection")
        .insert({
          file_name: kmzData.file_name,
          file_path: kmzData.file_path,
          drive_file_id: kmzData.drive_file_id || null,
          description: kmzData.description || null,
          metadata: kmzData.metadata || {},
          placemarks_count: kmzData.placemarks_count,
          rol_numbers: kmzData.rol_numbers || [],
          bounds: kmzData.bounds || null,
          coordinates: kmzData.coordinates,
          tags: kmzData.tags || [],
          category: kmzData.category || "general",
          region: region, // Save detected region
          is_active: true,
          created_by: kmzData.created_by || null,
        })
        .select()
        .single()

      if (error) throw error

      console.log("[v0] KMZ saved to database:", kmzData.file_name, "Region:", region)
      return { success: true, id: data.id }
    } catch (error) {
      console.error("[v0] Error saving KMZ to database:", error)
      return { success: false, error }
    }
  }
}

export const kmzStorageService = new KMZStorageService()
