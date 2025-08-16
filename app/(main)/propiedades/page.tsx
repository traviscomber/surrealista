import { Suspense } from "react"
import PropertiesClient from "./properties-client"
import { createClient } from "@/lib/supabase/server"

async function getProperties() {
  const supabase = createClient()

  try {
    const { data: properties, error } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching properties:", error)
      return []
    }

    return properties || []
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
