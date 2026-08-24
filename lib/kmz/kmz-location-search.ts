import { createBrowserClient } from "@/lib/supabase/client"

export interface LocationSearchResult {
  id: string
  name: string
  type: string
  coordinates: { lat: number; lng: number }
  region: string
  kmzFileName: string
  description?: string
}

type LocationIndexRow = LocationSearchResult & { kmzId: string }

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function normalizeLocation(value: unknown): LocationIndexRow | null {
  const row = asRecord(value)
  if (!row) return null
  const id = stringValue(row.id)
  const kmzId = stringValue(row.kmz_id)
  const name = stringValue(row.name)
  const type = stringValue(row.type)
  const region = stringValue(row.region)
  const lat = Number(row.latitude)
  const lng = Number(row.longitude)
  if (!id || !kmzId || !name || !type || !Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return {
    id,
    kmzId,
    name,
    type,
    coordinates: { lat, lng },
    region,
    kmzFileName: kmzId,
    description: stringValue(row.address) || stringValue(row.city) || undefined,
  }
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const haversine = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine))
}

export class KmzLocationSearchService {
  private supabase = createBrowserClient()

  private async hydrateFileNames(rows: LocationIndexRow[]): Promise<LocationSearchResult[]> {
    if (rows.length === 0) return []
    const kmzIds = Array.from(new Set(rows.map((row) => row.kmzId)))
    const { data, error } = await this.supabase.from("kmz_collection").select("id,file_name").in("id", kmzIds)
    if (error) {
      console.warn("[v0] Could not hydrate KMZ filenames:", error.message)
      return rows.map(({ kmzId: _kmzId, ...row }) => row)
    }

    const fileNames = new Map<string, string>()
    for (const value of Array.isArray(data) ? data : []) {
      const row = asRecord(value)
      const id = stringValue(row?.id)
      const fileName = stringValue(row?.file_name)
      if (id && fileName) fileNames.set(id, fileName)
    }

    return rows.map(({ kmzId, ...row }) => ({ ...row, kmzFileName: fileNames.get(kmzId) || kmzId }))
  }

  private async normalizeAndHydrate(data: unknown): Promise<LocationSearchResult[]> {
    const rows = (Array.isArray(data) ? data : [])
      .map(normalizeLocation)
      .filter((row): row is LocationIndexRow => row !== null)
    return this.hydrateFileNames(rows)
  }

  async searchByName(query: string): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("id,kmz_id,name,type,latitude,longitude,region,address,city")
        .ilike("name", `%${query}%`)
        .limit(50)
      if (error) throw error
      return this.normalizeAndHydrate(data)
    } catch (error) {
      console.error("[v0] Exception searching locations:", error)
      return []
    }
  }

  async searchByRegion(region: string): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("id,kmz_id,name,type,latitude,longitude,region,address,city")
        .ilike("region", `%${region}%`)
        .limit(100)
      if (error) throw error
      return this.normalizeAndHydrate(data)
    } catch (error) {
      console.error("[v0] Exception searching by region:", error)
      return []
    }
  }

  async searchByType(type: string): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("id,kmz_id,name,type,latitude,longitude,region,address,city")
        .eq("type", type)
        .limit(100)
      if (error) throw error
      return this.normalizeAndHydrate(data)
    } catch (error) {
      console.error("[v0] Exception searching by type:", error)
      return []
    }
  }

  async searchByKMZFile(kmzFileName: string): Promise<LocationSearchResult[]> {
    return this.getLocationsByKmzFile(kmzFileName)
  }

  async getLocationsByKmzFile(kmzFileName: string): Promise<LocationSearchResult[]> {
    try {
      const { data: collectionData, error: collectionError } = await this.supabase
        .from("kmz_collection")
        .select("id,file_name")
        .eq("file_name", kmzFileName)
        .limit(20)
      if (collectionError) throw collectionError

      const ids = (Array.isArray(collectionData) ? collectionData : []).flatMap((value) => {
        const id = stringValue(asRecord(value)?.id)
        return id ? [id] : []
      })
      if (ids.length === 0) return []

      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("id,kmz_id,name,type,latitude,longitude,region,address,city")
        .in("kmz_id", ids)
        .order("name", { ascending: true })
      if (error) throw error
      return this.normalizeAndHydrate(data)
    } catch (error) {
      console.error("[v0] Exception searching KMZ file:", error)
      return []
    }
  }

  async searchNearby(lat: number, lng: number, radiusKm = 10): Promise<LocationSearchResult[]> {
    try {
      const safeRadius = Math.max(0.1, Math.min(radiusKm, 250))
      const latDelta = safeRadius / 111.32
      const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.01)
      const lngDelta = safeRadius / (111.32 * cosLat)

      const { data, error } = await this.supabase
        .from("kmz_location_index")
        .select("id,kmz_id,name,type,latitude,longitude,region,address,city")
        .gte("latitude", lat - latDelta)
        .lte("latitude", lat + latDelta)
        .gte("longitude", lng - lngDelta)
        .lte("longitude", lng + lngDelta)
        .limit(1000)
      if (error) throw error

      const rows = (Array.isArray(data) ? data : [])
        .map(normalizeLocation)
        .filter((row): row is LocationIndexRow => row !== null)
        .map((row) => ({ row, distance: distanceKm(lat, lng, row.coordinates.lat, row.coordinates.lng) }))
        .filter(({ distance }) => distance <= safeRadius)
        .sort((left, right) => left.distance - right.distance)
        .slice(0, 100)
        .map(({ row }) => row)

      return this.hydrateFileNames(rows)
    } catch (error) {
      console.error("[v0] Exception searching nearby:", error)
      return []
    }
  }

  async getLocationStats(): Promise<{
    totalLocations: number
    locationTypes: Record<string, number>
    totalKmzFiles: number
    regions: string[]
  }> {
    try {
      const { data, error } = await this.supabase.from("kmz_location_index").select("id,kmz_id,name,type,latitude,longitude,region,address,city")
      if (error) throw error

      const locations = (Array.isArray(data) ? data : [])
        .map(normalizeLocation)
        .filter((row): row is LocationIndexRow => row !== null)
      const locationTypes: Record<string, number> = {}
      const regions = new Set<string>()
      const kmzFiles = new Set<string>()

      for (const location of locations) {
        locationTypes[location.type] = (locationTypes[location.type] || 0) + 1
        if (location.region) regions.add(location.region)
        kmzFiles.add(location.kmzId)
      }

      return {
        totalLocations: locations.length,
        locationTypes,
        totalKmzFiles: kmzFiles.size,
        regions: Array.from(regions),
      }
    } catch (error) {
      console.error("[v0] Exception fetching stats:", error)
      return { totalLocations: 0, locationTypes: {}, totalKmzFiles: 0, regions: [] }
    }
  }
}

export const KMZLocationSearch = new KmzLocationSearchService()
