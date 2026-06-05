import { Suspense } from "react"
import PropertiesClient from "./properties-client"
import { createClient } from "@/lib/supabase/server"

// Mark as dynamic to skip prerendering
export const dynamic = "force-dynamic"

async function getProperties() {
  const supabase = await createClient()

  try {
    const { data: enhancedProperties, error } = await supabase
      .from("properties_enhanced")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database query error:", error)
      return []
    }

    console.log("[v0] Found", enhancedProperties?.length || 0, "scraped properties")
    return enhancedProperties || []
  } catch (error) {
    console.error("Database connection error:", error)
    return []
  }
}

export default async function PropertiesPage() {
  const properties = await getProperties()

  return (
    <Suspense fallback={<div>Cargando propiedades...</div>}>
      <PropertiesClient initialProperties={properties} />
    </Suspense>
  )
}
