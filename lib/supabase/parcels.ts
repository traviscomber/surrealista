import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export type Parcel = {
  id: string
  kmz_id: string
  parcel_number?: string
  legal_description?: string
  address: string
  city?: string
  state?: string
  zip_code?: string
  coordinates?: { lat: number; lng: number }
  area_sqft?: number
  lot_size?: number
  zoning?: string
  current_use?: string
  tax_assessed_value?: number
  market_value?: number
  ownership?: string
  years_owned?: number
  days_on_market?: number
  price_per_sqft?: number
  created_at?: string
  updated_at?: string
  metadata?: Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeCoordinates(value: unknown): { lat: number; lng: number } | undefined {
  const row = asRecord(value)
  if (!row) return undefined
  const lat = Number(row.lat)
  const lng = Number(row.lng)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined
}

function normalizeParcel(value: unknown): Parcel | null {
  const row = asRecord(value)
  if (!row) return null
  const id = stringValue(row.id)
  const kmzId = stringValue(row.kmz_id)
  const address = stringValue(row.address)
  if (!id || !kmzId || !address) return null

  return {
    id,
    kmz_id: kmzId,
    parcel_number: stringValue(row.parcel_number),
    legal_description: stringValue(row.legal_description),
    address,
    city: stringValue(row.city),
    state: stringValue(row.state),
    zip_code: stringValue(row.zip_code),
    coordinates: normalizeCoordinates(row.coordinates),
    area_sqft: numberValue(row.area_sqft),
    lot_size: numberValue(row.lot_size),
    zoning: stringValue(row.zoning),
    current_use: stringValue(row.current_use),
    tax_assessed_value: numberValue(row.tax_assessed_value),
    market_value: numberValue(row.market_value),
    ownership: stringValue(row.ownership),
    years_owned: numberValue(row.years_owned),
    days_on_market: numberValue(row.days_on_market),
    price_per_sqft: numberValue(row.price_per_sqft),
    created_at: stringValue(row.created_at),
    updated_at: stringValue(row.updated_at),
    metadata: asRecord(row.metadata) || undefined,
  }
}

export async function getParcels(filters?: {
  kmzId?: string
  city?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<Parcel[]> {
  let query = supabase.from("parcels").select("*")

  if (filters?.kmzId) query = query.eq("kmz_id", filters.kmzId)
  if (filters?.city) query = query.eq("city", filters.city)
  if (filters?.search) {
    const search = filters.search.replace(/[(),]/g, " ").trim()
    if (search) query = query.or(`address.ilike.%${search}%,parcel_number.ilike.%${search}%`)
  }

  const offset = Math.max(0, Math.trunc(filters?.offset || 0))
  const limit = filters?.limit ? Math.max(1, Math.min(Math.trunc(filters.limit), 1000)) : undefined
  if (limit !== undefined) query = query.range(offset, offset + limit - 1)
  else if (offset > 0) query = query.range(offset, offset + 999)

  const { data, error } = await query
  if (error) {
    console.error("[v0] Error fetching parcels:", error)
    return []
  }

  return (Array.isArray(data) ? data : []).map(normalizeParcel).filter((parcel): parcel is Parcel => parcel !== null)
}

export async function getParcelById(id: string): Promise<Parcel | null> {
  const { data, error } = await supabase.from("parcels").select("*").eq("id", id).single()
  if (error) {
    console.error("[v0] Error fetching parcel:", error)
    return null
  }
  return normalizeParcel(data)
}

export async function getParcelsByKmzId(kmzId: string) {
  return getParcels({ kmzId })
}

export async function createParcel(parcel: Omit<Parcel, "id" | "created_at" | "updated_at">): Promise<Parcel | null> {
  const { data, error } = await supabase.from("parcels").insert([parcel]).select("*").single()
  if (error) {
    console.error("[v0] Error creating parcel:", error)
    return null
  }
  return normalizeParcel(data)
}

export async function updateParcel(id: string, updates: Partial<Parcel>): Promise<Parcel | null> {
  const { id: _ignoredId, created_at: _ignoredCreatedAt, ...safeUpdates } = updates
  const { data, error } = await supabase
    .from("parcels")
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    console.error("[v0] Error updating parcel:", error)
    return null
  }
  return normalizeParcel(data)
}
