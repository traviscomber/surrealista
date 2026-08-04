import type { SupabaseClient } from "@supabase/supabase-js"

export type KmzInventoryGeometryStatus =
  | "real_geometry"
  | "real_or_reference"
  | "direct_reference"
  | "metadata_reference"
  | "sii_reference"
  | "bounds_reference"
  | "missing"

export interface KmzInventoryRecord {
  id: string
  file_name: string
  region: string
  category: string | null
  bounds: Record<string, number> | null
  rol_numbers: string[] | null
  owner: string | null
  google_docs_link: string | null
  metadata: Record<string, unknown> | null
  placemarks_count: number
  geometry_status: KmzInventoryGeometryStatus
  geometry_label: string
  latitude: number
  longitude: number
  has_rol: boolean
  has_owner: boolean
  has_region: boolean
  has_bounds: boolean
  completeness_score: number
}

export interface KmzInventoryRegionSummary {
  region: string
  total_kmz: number
  sii_reference_count: number
  kmz_center_count: number
  layer_count: number
  with_rol_count: number
  with_owner_count: number
  missing_rol_count: number
  center_latitude: number
  center_longitude: number
  average_completeness: number
}

export interface KmzInventoryFilters {
  regions?: string[]
  ids?: string[]
  search?: string
}

export async function loadKmzInventory(
  supabase: SupabaseClient,
  filters: KmzInventoryFilters = {},
): Promise<KmzInventoryRecord[]> {
  let query = supabase
    .from("kmz_inventory_status")
    .select("*")
    .order("region", { ascending: true })
    .order("file_name", { ascending: true })

  if (filters.regions?.length) query = query.in("region", filters.regions)
  if (filters.ids?.length) query = query.in("id", filters.ids)
  if (filters.search?.trim()) query = query.ilike("file_name", `%${filters.search.trim()}%`)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as KmzInventoryRecord[]
}

export async function loadKmzInventoryRegionSummary(
  supabase: SupabaseClient,
): Promise<KmzInventoryRegionSummary[]> {
  const { data, error } = await supabase
    .from("kmz_inventory_region_summary")
    .select("*")
    .order("total_kmz", { ascending: false })
    .order("region", { ascending: true })

  if (error) throw error
  return (data || []) as KmzInventoryRegionSummary[]
}

export function filterInventoryByIds(
  records: KmzInventoryRecord[],
  ids: string[] | null | undefined,
): KmzInventoryRecord[] {
  if (ids === null || ids === undefined) return records
  if (ids.length === 0) return []
  const allowed = new Set(ids.map(String))
  return records.filter((record) => allowed.has(String(record.id)))
}

export function groupInventoryByRegion(records: KmzInventoryRecord[]) {
  const grouped = new Map<string, KmzInventoryRecord[]>()

  records.forEach((record) => {
    const region = record.region || "Sin Región"
    const current = grouped.get(region) || []
    current.push(record)
    grouped.set(region, current)
  })

  return Array.from(grouped.entries())
    .map(([region, items]) => ({
      region,
      items: items.sort((a, b) => a.file_name.localeCompare(b.file_name, "es")),
      summary: summarizeKmzInventory(items),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.region.localeCompare(b.region, "es"))
}

export function summarizeKmzInventory(records: KmzInventoryRecord[]) {
  return records.reduce(
    (summary, record) => {
      summary.total += 1
      summary.byGeometry[record.geometry_status] = (summary.byGeometry[record.geometry_status] || 0) + 1
      if (!record.has_rol) summary.withoutRol += 1
      if (!record.has_owner) summary.withoutOwner += 1
      summary.completenessTotal += Number(record.completeness_score || 0)
      return summary
    },
    {
      total: 0,
      withoutRol: 0,
      withoutOwner: 0,
      completenessTotal: 0,
      byGeometry: {} as Partial<Record<KmzInventoryGeometryStatus, number>>,
      get averageCompleteness() {
        return this.total > 0 ? Math.round((this.completenessTotal / this.total) * 10) / 10 : 0
      },
    },
  )
}
