import { supabase } from "@/lib/supabase/client"
import { detectRegionFromBounds } from "@/lib/utils/region-detector"
import { kmzPlacemarkService } from "./kmz-placemark-service"

export interface StoredKMZ {
  id: string
  file_name: string
  file_path: string
  drive_file_id: string | null
  description: string | null
  metadata: Record<string, unknown>
  placemarks_count: number
  rol_numbers: string[]
  bounds: unknown
  coordinates: unknown
  tags: string[]
  category: string | null
  region: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface KMZForMap {
  id: string
  fileName: string
  coordinates: Array<[number, number]>
  bounds: unknown
  placemarks: number
  rolNumbers: string[]
  category: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function objectValue(value: unknown): Record<string, unknown> {
  return asRecord(value) || {}
}

export function normalizeStoredKMZ(value: unknown): StoredKMZ | null {
  const row = asRecord(value)
  if (!row) return null
  const id = stringValue(row.id)
  const fileName = stringValue(row.file_name)
  if (!id || !fileName) return null

  return {
    id,
    file_name: fileName,
    file_path: stringValue(row.file_path),
    drive_file_id: nullableString(row.drive_file_id),
    description: nullableString(row.description),
    metadata: objectValue(row.metadata),
    placemarks_count: numberValue(row.placemarks_count),
    rol_numbers: stringArray(row.rol_numbers),
    bounds: row.bounds ?? null,
    coordinates: row.coordinates ?? null,
    tags: stringArray(row.tags),
    category: nullableString(row.category),
    region: nullableString(row.region),
    is_active: row.is_active !== false,
    created_at: stringValue(row.created_at),
    updated_at: stringValue(row.updated_at),
  }
}

function toCoordinatePairs(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) return []
  return value.flatMap((pair) => {
    if (!Array.isArray(pair) || pair.length < 2) return []
    const first = Number(pair[0])
    const second = Number(pair[1])
    return Number.isFinite(first) && Number.isFinite(second) ? [[first, second] as [number, number]] : []
  })
}

function toMapKMZ(kmz: StoredKMZ): KMZForMap {
  return {
    id: kmz.id,
    fileName: kmz.file_name,
    coordinates: toCoordinatePairs(kmz.coordinates),
    bounds: kmz.bounds,
    placemarks: kmz.placemarks_count,
    rolNumbers: kmz.rol_numbers,
    category: kmz.category,
  }
}

function normalizeRows(data: unknown): StoredKMZ[] {
  return Array.isArray(data)
    ? data.map(normalizeStoredKMZ).filter((kmz): kmz is StoredKMZ => kmz !== null)
    : []
}

export class KMZStorageService {
  private supabase = supabase

  async loadAllKMZ(): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      if (error) throw error
      return normalizeRows(data).map(toMapKMZ)
    } catch (error) {
      console.error("[v0] Error loading KMZ from database:", error)
      return []
    }
  }

  async loadKMZByCategory(category: string): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("category", category)
        .order("created_at", { ascending: false })
      if (error) throw error
      return normalizeRows(data).map(toMapKMZ)
    } catch (error) {
      console.error("[v0] Error loading KMZ by category:", error)
      return []
    }
  }

  async loadKMZByIds(ids: string[]): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .in("id", ids)
        .eq("is_active", true)
      if (error) throw error
      return normalizeRows(data).map(toMapKMZ)
    } catch (error) {
      console.error("[v0] Error loading KMZ by IDs:", error)
      return []
    }
  }

  async searchByRol(rolNumber: string): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .contains("rol_numbers", [rolNumber])
        .eq("is_active", true)
      if (error) throw error
      return normalizeRows(data).map(toMapKMZ)
    } catch (error) {
      console.error("[v0] Error searching KMZ by rol:", error)
      return []
    }
  }

  async loadKMZByRegion(region: string): Promise<KMZForMap[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("region", region)
        .order("created_at", { ascending: false })
      if (error) throw error
      return normalizeRows(data).map(toMapKMZ)
    } catch (error) {
      console.error("[v0] Error loading KMZ by region:", error)
      return []
    }
  }

  async getStats() {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("id,file_name,file_path,drive_file_id,description,metadata,placemarks_count,rol_numbers,bounds,coordinates,tags,category,region,is_active,created_at,updated_at")
      if (error) throw error

      const rows = normalizeRows(data)
      const allRoles = new Set(rows.flatMap((kmz) => kmz.rol_numbers))
      return {
        total: rows.length,
        active: rows.filter((kmz) => kmz.is_active).length,
        totalPlacemarks: rows.reduce((sum, kmz) => sum + kmz.placemarks_count, 0),
        totalRoles: allRoles.size,
      }
    } catch (error) {
      console.error("[v0] Error getting KMZ stats:", error)
      return { total: 0, active: 0, totalPlacemarks: 0, totalRoles: 0 }
    }
  }

  async saveKMZ(kmzData: {
    file_name: string
    file_path: string
    drive_file_id?: string
    description?: string
    metadata?: Record<string, unknown>
    placemarks_count: number
    rol_numbers?: string[]
    bounds?: unknown
    coordinates: unknown
    tags?: string[]
    category?: string
    created_by?: string
    file_size?: number
    placemarks?: unknown[]
  }): Promise<{ success: boolean; id?: string; error?: unknown }> {
    try {
      const MAX_SIZE = 10 * 1024 * 1024
      if (kmzData.file_size && kmzData.file_size > MAX_SIZE) {
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
        const existingId = stringValue(asRecord(existing)?.id)
        if (existingId) return { success: true, id: existingId }
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
          region,
          is_active: true,
          created_by: kmzData.created_by || null,
        })
        .select("id")
        .single()

      if (error) throw error
      const id = stringValue(asRecord(data)?.id)
      if (!id) throw new Error("KMZ insert succeeded without a valid id")

      if (kmzData.placemarks?.length) {
        await kmzPlacemarkService.savePlacemarks(id, kmzData.placemarks)
      }
      return { success: true, id }
    } catch (error) {
      console.error("[v0] Error saving KMZ to database:", error)
      return { success: false, error }
    }
  }
}

export const kmzStorageService = new KMZStorageService()
