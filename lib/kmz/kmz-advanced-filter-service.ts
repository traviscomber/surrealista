import { supabase } from "@/lib/supabase/client"
import { normalizeStoredKMZ, type StoredKMZ, type KMZForMap } from "./kmz-storage-service"
import type { AdvancedFiltersState } from "@/components/campos/advanced-filters"

export interface FilteredKMZ extends KMZForMap {
  price?: number
  area_m2?: number
  zone?: string
  propertyType?: string
  metadata?: Record<string, unknown>
}

function numericMetadata(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}

function stringMetadata(metadata: Record<string, unknown>, fallback: string, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) return value
  }
  return fallback
}

class KMZAdvancedFilterService {
  private supabase = supabase

  async loadFilteredKMZ(regions: string[], filters: AdvancedFiltersState): Promise<FilteredKMZ[]> {
    try {
      if (!regions?.length) return []

      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .in("category", regions)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (Array.isArray(data) ? data : [])
        .map(normalizeStoredKMZ)
        .filter((kmz): kmz is StoredKMZ => kmz !== null)
        .map((kmz) => this.mapToFilteredKMZ(kmz))
        .filter((kmz) => this.passesFilters(kmz, filters))
    } catch (error) {
      console.error("[v0] Error loading filtered KMZ:", error)
      return []
    }
  }

  private mapToFilteredKMZ(kmz: StoredKMZ): FilteredKMZ {
    const metadata = kmz.metadata
    const coordinates = Array.isArray(kmz.coordinates)
      ? kmz.coordinates.flatMap((pair) => {
          if (!Array.isArray(pair) || pair.length < 2) return []
          const first = Number(pair[0])
          const second = Number(pair[1])
          return Number.isFinite(first) && Number.isFinite(second) ? [[first, second] as [number, number]] : []
        })
      : []

    return {
      id: kmz.id,
      fileName: kmz.file_name,
      coordinates,
      bounds: kmz.bounds,
      placemarks: kmz.placemarks_count,
      rolNumbers: kmz.rol_numbers,
      category: kmz.category,
      price: numericMetadata(metadata, "price", "estimated_price"),
      area_m2: numericMetadata(metadata, "area_m2"),
      zone: stringMetadata(metadata, "Desconocida", "zone", "zone_type"),
      propertyType: stringMetadata(metadata, "Agrícola", "property_type"),
      metadata,
    }
  }

  private passesFilters(kmz: FilteredKMZ, filters: AdvancedFiltersState): boolean {
    if (filters.priceMin > 0 || filters.priceMax < 10000000) {
      const price = kmz.price || 0
      if (price < filters.priceMin || price > filters.priceMax) return false
    }

    if (filters.areaMin > 0 || filters.areaMax < 50000) {
      const area = kmz.area_m2 || 0
      if (area < filters.areaMin || area > filters.areaMax) return false
    }

    if (filters.zones.length > 0 && !filters.zones.includes(kmz.zone || "Desconocida")) return false
    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(kmz.propertyType || "Agrícola")) return false
    return true
  }

  async getFilterStats(regions: string[]): Promise<{
    totalKMZ: number
    priceRange: { min: number; max: number }
    areaRange: { min: number; max: number }
    zones: { name: string; count: number }[]
    propertyTypes: { name: string; count: number }[]
  }> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .in("category", regions)

      if (error) throw error

      const kmzItems = (Array.isArray(data) ? data : [])
        .map(normalizeStoredKMZ)
        .filter((kmz): kmz is StoredKMZ => kmz !== null)

      const prices = kmzItems.map((kmz) => numericMetadata(kmz.metadata, "price", "estimated_price")).filter((price) => price > 0)
      const areas = kmzItems.map((kmz) => numericMetadata(kmz.metadata, "area_m2")).filter((area) => area > 0)
      const zonesMap = new Map<string, number>()
      const typesMap = new Map<string, number>()

      kmzItems.forEach((kmz) => {
        const zone = stringMetadata(kmz.metadata, "Desconocida", "zone", "zone_type")
        const type = stringMetadata(kmz.metadata, "Agrícola", "property_type")
        zonesMap.set(zone, (zonesMap.get(zone) || 0) + 1)
        typesMap.set(type, (typesMap.get(type) || 0) + 1)
      })

      return {
        totalKMZ: kmzItems.length,
        priceRange: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 10000000 },
        areaRange: { min: areas.length ? Math.min(...areas) : 0, max: areas.length ? Math.max(...areas) : 50000 },
        zones: Array.from(zonesMap, ([name, count]) => ({ name, count })),
        propertyTypes: Array.from(typesMap, ([name, count]) => ({ name, count })),
      }
    } catch (error) {
      console.error("[v0] Error getting filter stats:", error)
      return {
        totalKMZ: 0,
        priceRange: { min: 0, max: 10000000 },
        areaRange: { min: 0, max: 50000 },
        zones: [],
        propertyTypes: [],
      }
    }
  }
}

export const kmzAdvancedFilterService = new KMZAdvancedFilterService()
