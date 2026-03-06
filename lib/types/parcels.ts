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

export type ParcelFilters = {
  kmzId?: string
  city?: string
  search?: string
  zoning?: string
  minPrice?: number
  maxPrice?: number
}
