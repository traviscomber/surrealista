// Real Estate Opportunities Portal Types

export type UserRole = 'admin' | 'analyst' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  preferences: {
    filters?: OpportunityFilters
    notifications_enabled?: boolean
    map_view_default?: boolean
  }
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  title: string
  description: string
  location: {
    address: string
    city: string
    state: string
    zipcode: string
    latitude: number
    longitude: number
  }
  property_details: {
    property_type: 'residential' | 'commercial' | 'land' | 'mixed'
    size_sqft: number
    lot_size_sqft: number
    year_built: number
    bedrooms?: number
    bathrooms?: number
    parking_spaces?: number
  }
  financial: {
    asking_price: number
    estimated_value: number
    cash_on_cash_return?: number
    cap_rate?: number
    monthly_rent?: number
  }
  status: 'draft' | 'active' | 'under_review' | 'pending' | 'closed' | 'passed'
  stage: 'lead' | 'prospect' | 'negotiation' | 'contract' | 'closing'
  priority: 'low' | 'medium' | 'high' | 'critical'
  owner_name?: string
  owner_email?: string
  owner_phone?: string
  contact_agent?: string
  listing_url?: string
  source: string
  tags: string[]
  created_by: string
  created_at: string
  updated_at: string
  updated_by: string
  saved_count: number
  view_count: number
}

export interface OpportunityNote {
  id: string
  opportunity_id: string
  content: string
  note_type: 'general' | 'analysis' | 'meeting' | 'inspection' | 'offer'
  created_by: string
  created_at: string
  updated_at: string
}

export interface OpportunityImage {
  id: string
  opportunity_id: string
  image_url: string
  image_type: 'exterior' | 'interior' | 'land' | 'document' | 'other'
  caption?: string
  uploaded_by: string
  uploaded_at: string
  file_size: number
}

export interface OpportunityActivity {
  id: string
  opportunity_id: string
  action: string
  details?: Record<string, any>
  created_by: string
  created_at: string
}

export interface SavedOpportunity {
  id: string
  opportunity_id: string
  user_id: string
  saved_at: string
  list_name: string
}

export interface OpportunityFilters {
  status?: string[]
  stage?: string[]
  priority?: string[]
  property_type?: string[]
  price_min?: number
  price_max?: number
  location?: string
  tags?: string[]
  date_from?: string
  date_to?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
