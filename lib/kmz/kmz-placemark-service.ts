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
  properties?: Record<string, unknown>
  center_point?: unknown
  region?: string
  bounds?: { north: number; south: number; east: number; west: number }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function normalizeCoordinates(value: unknown): number[][] {
  if (!Array.isArray(value)) return []
  return value.flatMap((pair) => {
    if (!Array.isArray(pair) || pair.length < 2) return []
    const lng = Number(pair[0])
    const lat = Number(pair[1])
    return Number.isFinite(lng) && Number.isFinite(lat) ? [[lng, lat]] : []
  })
}

function normalizeBounds(value: unknown) {
  const row = asRecord(value)
  if (!row) return undefined
  const north = Number(row.north)
  const south = Number(row.south)
  const east = Number(row.east)
  const west = Number(row.west)
  return [north, south, east, west].every(Number.isFinite) ? { north, south, east, west } : undefined
}

function normalizeType(value: unknown): StoredPlacemark["type"] | null {
  return value === "Point" || value === "LineString" || value === "Polygon" ? value : null
}

export function normalizeStoredPlacemark(value: unknown): StoredPlacemark | null {
  const row = asRecord(value)
  if (!row) return null
  const id = stringValue(row.id)
  const kmzId = stringValue(row.kmz_id)
  const name = stringValue(row.name)
  const type = normalizeType(row.type)
  const coordinates = normalizeCoordinates(row.coordinates)
  if (!id || !kmzId || !name || !type || coordinates.length === 0) return null

  return {
    id,
    kmz_id: kmzId,
    name,
    description: stringValue(row.description) || undefined,
    coordinates,
    type,
    style_url: stringValue(row.style_url) || undefined,
    properties: asRecord(row.properties) || undefined,
    center_point: row.center_point,
    region: stringValue(row.region) || undefined,
    bounds: normalizeBounds(row.bounds),
  }
}

function normalizeRows(data: unknown): StoredPlacemark[] {
  return (Array.isArray(data) ? data : [])
    .map(normalizeStoredPlacemark)
    .filter((placemark): placemark is StoredPlacemark => placemark !== null)
}

class KMZPlacemarkService {
  async savePlacemarks(
    kmzId: string,
    placemarks: KMZPlacemark[],
  ): Promise<{ success: boolean; count: number; error?: unknown }> {
    try {
      if (!placemarks?.length) return { success: true, count: 0 }

      const placemarksToInsert = placemarks.flatMap((placemark) => {
        const coordinates = normalizeCoordinates(placemark.coordinates)
        if (!coordinates.length) return []
        const centerLng = coordinates[0][0]
        const centerLat = coordinates[0][1]
        const region = detectRegionFromCoordinateArray(coordinates)
        const bounds = { north: -90, south: 90, east: -180, west: 180 }

        coordinates.forEach(([lng, lat]) => {
          bounds.north = Math.max(bounds.north, lat)
          bounds.south = Math.min(bounds.south, lat)
          bounds.east = Math.max(bounds.east, lng)
          bounds.west = Math.min(bounds.west, lng)
        })

        return [{
          kmz_id: kmzId,
          name: placemark.name,
          description: placemark.description || null,
          coordinates,
          type: placemark.type,
          style_url: placemark.styleUrl || null,
          properties: placemark.properties || {},
          center_point: `SRID=4326;POINT(${centerLng} ${centerLat})`,
          region,
          bounds,
        }]
      })

      if (!placemarksToInsert.length) return { success: true, count: 0 }
      const { error } = await supabase.from("kmz_placemarks").insert(placemarksToInsert)
      if (error) throw error
      return { success: true, count: placemarksToInsert.length }
    } catch (error) {
      console.error("[v0] Error saving placemarks:", error)
      return { success: false, count: 0, error }
    }
  }

  async loadPlacemarksByRegion(region: string): Promise<StoredPlacemark[]> {
    try {
      const { data, error } = await supabase.from("kmz_placemarks").select("*").eq("region", region).limit(5000)
      if (error) throw error
      return normalizeRows(data)
    } catch (error) {
      console.error("[v0] Error loading placemarks by region:", error)
      return []
    }
  }

  async searchPlacemarks(searchTerm: string): Promise<StoredPlacemark[]> {
    try {
      const { data, error } = await supabase
        .from("kmz_placemarks")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .limit(100)
      if (error) throw error
      return normalizeRows(data)
    } catch (error) {
      console.error("[v0] Error searching placemarks:", error)
      return []
    }
  }

  async loadPlacemarksForKmz(kmzId: string): Promise<StoredPlacemark[]> {
    try {
      const { data, error } = await supabase.from("kmz_placemarks").select("*").eq("kmz_id", kmzId)
      if (error) throw error
      return normalizeRows(data)
    } catch (error) {
      console.error("[v0] Error loading placemarks for KMZ:", error)
      return []
    }
  }

  async getStats(): Promise<{ total: number; byRegion: Record<string, number>; byType: Record<string, number> }> {
    try {
      const { data, error } = await supabase.from("kmz_placemarks").select("*")
      if (error) throw error
      const placemarks = normalizeRows(data)
      const byRegion: Record<string, number> = {}
      const byType: Record<string, number> = {}

      placemarks.forEach((placemark) => {
        const region = placemark.region || "Sin región"
        byRegion[region] = (byRegion[region] || 0) + 1
        byType[placemark.type] = (byType[placemark.type] || 0) + 1
      })

      return { total: placemarks.length, byRegion, byType }
    } catch (error) {
      console.error("[v0] Error getting stats:", error)
      return { total: 0, byRegion: {}, byType: {} }
    }
  }

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
