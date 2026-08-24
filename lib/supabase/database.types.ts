export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number | null
          location: string | null
          address: string | null
          city: string | null
          region: string | null
          bedrooms: number | null
          bathrooms: number | null
          area: number | null
          land_area: number | null
          property_type: string | null
          status: string
          featured: boolean
          created_at: string
          updated_at: string
          coordinates: unknown | null
          owner_id: string | null
          source_url: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price?: number | null
          location?: string | null
          address?: string | null
          city?: string | null
          region?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          area?: number | null
          land_area?: number | null
          property_type?: string | null
          status?: string
          featured?: boolean
          created_at?: string
          updated_at?: string
          coordinates?: unknown | null
          owner_id?: string | null
          source_url?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number | null
          location?: string | null
          address?: string | null
          city?: string | null
          region?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          area?: number | null
          land_area?: number | null
          property_type?: string | null
          status?: string
          featured?: boolean
          created_at?: string
          updated_at?: string
          coordinates?: unknown | null
          owner_id?: string | null
          source_url?: string | null
        }
      }
      property_images: {
        Row: {
          id: string
          property_id: string
          url: string
          is_main: boolean
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          url: string
          is_main?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          url?: string
          is_main?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          license_number: string | null
          experience_years: number | null
          social_media: Json | null
          website: string | null
          phone: string | null
          bio: string | null
          specialization: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          license_number?: string | null
          experience_years?: number | null
          social_media?: Json | null
          website?: string | null
          phone?: string | null
          bio?: string | null
          specialization?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          license_number?: string | null
          experience_years?: number | null
          social_media?: Json | null
          website?: string | null
          phone?: string | null
          bio?: string | null
          specialization?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          message: string | null
          property_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          message?: string | null
          property_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          message?: string | null
          property_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      quotations: {
        Row: {
          id: string
          property_id: string | null
          user_id: string | null
          requirements: string | null
          ai_response: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          user_id?: string | null
          requirements?: string | null
          ai_response?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          user_id?: string | null
          requirements?: string | null
          ai_response?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_property_recommendations: {
        Row: {
          id: string
          user_id: string
          property_id: string
          score: number
          recommendation_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          score: number
          recommendation_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          score?: number
          recommendation_reason?: string | null
          created_at?: string
        }
      }
      agent_interactions: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          role: string | null
          content: string | null
          timestamp: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          role?: string | null
          content?: string | null
          timestamp?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          role?: string | null
          content?: string | null
          timestamp?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Additional Supabase-specific types
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

// Specific table types for easier use
export type Property = Tables<"properties">
export type PropertyInsert = TablesInsert<"properties">
export type PropertyUpdate = TablesUpdate<"properties">

export type Lead = Tables<"leads">
export type LeadInsert = TablesInsert<"leads">
export type LeadUpdate = TablesUpdate<"leads">

export type Quotation = Tables<"quotations">
export type QuotationInsert = TablesInsert<"quotations">
export type QuotationUpdate = TablesUpdate<"quotations">

export type PropertyImage = Tables<"property_images">
export type PropertyImageInsert = TablesInsert<"property_images">
export type PropertyImageUpdate = TablesUpdate<"property_images">
