import { supabase } from "@/lib/supabase/client"
import type { StoredKMZ, KMZForMap } from "./kmz-storage-service"
import type { AdvancedFiltersState } from "@/components/campos/advanced-filters"

/**
 * Extended KMZ with filter metadata
 */
export interface FilteredKMZ extends KMZForMap {
  price?: number
  area_m2?: number
  zone?: string
  propertyType?: string
  metadata?: any
}

/**
 * Service para filtrar KMZ basado en filtros avanzados
 */
class KMZAdvancedFilterService {
  private supabase = supabase

  /**
   * Carga KMZ de múltiples regiones y aplica filtros avanzados
   */
  async loadFilteredKMZ(
    regions: string[],
    filters: AdvancedFiltersState
  ): Promise<FilteredKMZ[]> {
    try {
      if (!regions || regions.length === 0) {
        return []
      }

      // Cargar KMZ de todas las regiones
      const { data, error } = await this.supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .in("category", regions)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Mapear y filtrar resultados
      const filtered = (data as StoredKMZ[])
        .map((kmz) => this.mapToFilteredKMZ(kmz))
        .filter((kmz) => this.passesFilters(kmz, filters))

      return filtered
    } catch (error) {
      console.error("[v0] Error loading filtered KMZ:", error)
      return []
    }
  }

  /**
   * Mapea StoredKMZ a FilteredKMZ con metadata de filtros
   */
  private mapToFilteredKMZ(kmz: StoredKMZ): FilteredKMZ {
    const metadata = kmz.metadata || {}

    return {
      id: kmz.id,
      fileName: kmz.file_name,
      coordinates: kmz.coordinates || [],
      bounds: kmz.bounds,
      placemarks: kmz.placemarks_count,
      rolNumbers: kmz.rol_numbers || [],
      category: kmz.category,
      // Filtro metadata
      price: metadata.price || metadata.estimated_price || 0,
      area_m2: metadata.area_m2 || 0,
      zone: metadata.zone || metadata.zone_type || "Desconocida",
      propertyType: metadata.property_type || "Agrícola",
      metadata,
    }
  }

  /**
   * Verifica si un KMZ pasa todos los filtros
   */
  private passesFilters(kmz: FilteredKMZ, filters: AdvancedFiltersState): boolean {
    // Filtro de Precio
    if (filters.priceMin > 0 || filters.priceMax < 10000000) {
      const price = kmz.price || 0
      if (price < filters.priceMin || price > filters.priceMax) {
        return false
      }
    }

    // Filtro de Área
    if (filters.areaMin > 0 || filters.areaMax < 50000) {
      const area = kmz.area_m2 || 0
      if (area < filters.areaMin || area > filters.areaMax) {
        return false
      }
    }

    // Filtro de Zona
    if (filters.zones.length > 0) {
      if (!filters.zones.includes(kmz.zone || "Desconocida")) {
        return false
      }
    }

    // Filtro de Tipo de Propiedad
    if (filters.propertyTypes.length > 0) {
      if (!filters.propertyTypes.includes(kmz.propertyType || "Agrícola")) {
        return false
      }
    }

    return true
  }

  /**
   * Obtiene estadísticas de filtros aplicados
   */
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
        .select("metadata, category")
        .eq("is_active", true)
        .in("category", regions)

      if (error) throw error

      const kmzItems = (data as any[]) || []

      const prices = kmzItems
        .map((k) => k.metadata?.price || k.metadata?.estimated_price || 0)
        .filter((p) => p > 0)
      const areas = kmzItems
        .map((k) => k.metadata?.area_m2 || 0)
        .filter((a) => a > 0)

      const zonesMap = new Map<string, number>()
      const typesMap = new Map<string, number>()

      kmzItems.forEach((k) => {
        const zone = k.metadata?.zone || "Desconocida"
        zonesMap.set(zone, (zonesMap.get(zone) || 0) + 1)

        const type = k.metadata?.property_type || "Agrícola"
        typesMap.set(type, (typesMap.get(type) || 0) + 1)
      })

      return {
        totalKMZ: kmzItems.length,
        priceRange: {
          min: Math.min(...prices, 0),
          max: Math.max(...prices, 10000000),
        },
        areaRange: {
          min: Math.min(...areas, 0),
          max: Math.max(...areas, 50000),
        },
        zones: Array.from(zonesMap).map(([name, count]) => ({ name, count })),
        propertyTypes: Array.from(typesMap).map(([name, count]) => ({ name, count })),
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
