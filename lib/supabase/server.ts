import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are required. Please check your environment variables.")
  }

  const cookieStore = await cookies()
  const internalToken = cookieStore.get(INTERNAL_ACCESS_COOKIE)?.value
  const hasInternalAccess = await verifyInternalAccessToken(internalToken)

  if (hasInternalAccess) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for internal access")
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot always mutate cookies; middleware refreshes auth when needed.
        }
      },
    },
  })
}

export { createServerClient } from "@supabase/ssr"

export async function getFeaturedProperties() {
  try {
    const supabase = await createClient()
    const { data: featuredData, error: featuredError } = await supabase
      .from("properties")
      .select("*")
      .eq("featured", true)
      .eq("status", "active")
      .limit(6)

    if (!featuredError) return featuredData || []

    console.error("Error fetching featured properties:", featuredError)
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
  } catch (error) {
    console.error("Error in getFeaturedProperties:", error)
    return []
  }
}

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

    return { properties: data || [], total: count || 0 }
  } catch (error) {
    console.error("Error in getProperties:", error)
    return { properties: [], total: 0 }
  }
}

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
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error("Error in createLead:", error)
    return { success: false, error: "Unknown error occurred" }
  }
}

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
      .insert([{ ...messageData, priority: messageData.priority || "normal" }])
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error("Error in createMessage:", error)
    return { success: false, error: "Unknown error occurred" }
  }
}

export default createClient
export const supabase = createClient