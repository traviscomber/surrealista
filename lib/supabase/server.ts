import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are required. Please check your environment variables.")
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Export createServerClient for compatibility
export { createServerClient } from "@supabase/ssr"

// Helper function to get featured properties with fallback
export async function getFeaturedProperties() {
  try {
    const supabase = await createClient()

    // First try to get featured properties
    const { data: featuredData, error: featuredError } = await supabase
      .from("properties")
      .select("*")
      .eq("featured", true)
      .eq("status", "active")
      .limit(6)

    if (featuredError) {
      console.error("Error fetching featured properties:", featuredError)

      // Fallback: get latest properties if featured query fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6)

      if (fallbackError) {
        console.error("Error fetching fallback properties:", fallbackError)
        return []
      }

      return fallbackData || []
    }

    return featuredData || []
  } catch (error) {
    console.error("Error in getFeaturedProperties:", error)
    return []
  }
}

// Helper function to get all properties with pagination
export async function getProperties(page = 1, limit = 12) {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  try {
    const { data, error, count } = await supabase
      .from("properties")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching properties:", error)
      return { properties: [], total: 0 }
    }

    return {
      properties: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error("Error in getProperties:", error)
    return { properties: [], total: 0 }
  }
}

// Helper function to get a single property by ID
export async function getPropertyById(id: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from("properties").select("*").eq("id", id).eq("status", "active").single()

    if (error) {
      console.error("Error fetching property:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getPropertyById:", error)
    return null
  }
}

// Helper function to create a lead
export async function createLead(leadData: {
  name: string
  email: string
  phone?: string
  message?: string
  property_id?: string
  property_title?: string
  contact_preference?: string
  source?: string
}) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from("leads").insert([leadData]).select().single()

    if (error) {
      console.error("Error creating lead:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in createLead:", error)
    return { success: false, error: "Unknown error occurred" }
  }
}

// Helper function to create a message
export async function createMessage(messageData: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  priority?: string
}) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          ...messageData,
          priority: messageData.priority || "normal",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in createMessage:", error)
    return { success: false, error: "Unknown error occurred" }
  }
}

// Export the createClient function as default for compatibility
export default createClient

// Export supabase as a named export for compatibility
export const supabase = createClient
