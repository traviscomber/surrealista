import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export async function getParcels(filters?: {
  kmzId?: string
  city?: string
  search?: string
  limit?: number
  offset?: number
}) {
  let query = supabase.from('parcels').select('*')

  if (filters?.kmzId) {
    query = query.eq('kmz_id', filters.kmzId)
  }
  if (filters?.city) {
    query = query.eq('city', filters.city)
  }
  if (filters?.search) {
    query = query.or(`address.ilike.%${filters.search}%,parcel_number.ilike.%${filters.search}%`)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.offset(filters.offset)
  }

  const { data, error } = await query

  if (error) {
    console.error('[v0] Error fetching parcels:', error)
    return []
  }

  return (data as Parcel[]) || []
}

export async function getParcelById(id: string) {
  const { data, error } = await supabase.from('parcels').select('*').eq('id', id).single()

  if (error) {
    console.error('[v0] Error fetching parcel:', error)
    return null
  }

  return data as Parcel
}

export async function getParcelsByKmzId(kmzId: string) {
  return getParcels({ kmzId })
}

export async function createParcel(parcel: Omit<Parcel, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('parcels')
    .insert([parcel])
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating parcel:', error)
    return null
  }

  return data as Parcel
}

export async function updateParcel(id: string, updates: Partial<Parcel>) {
  const { data, error } = await supabase
    .from('parcels')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating parcel:', error)
    return null
  }

  return data as Parcel
}
