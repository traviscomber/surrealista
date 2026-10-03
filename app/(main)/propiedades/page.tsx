import { Suspense } from "react"
import PropertiesClient from "./properties-client"
import { createClient } from "@/lib/supabase/server"

// Mark as dynamic to skip prerendering
export const dynamic = "force-dynamic"

async function getProperties() {
  const supabase = await createClient()

  try {
    const { data: externalProperties, error } = await supabase
      .from("properties_external")
      .select(
        "id, title, location, address, city, region, price, price_clp, bedrooms, bathrooms, area, area_m2, property_type, description, images, source, source_url, is_active, scraped_at",
      )
      .eq("is_active", true)
      .order("scraped_at", { ascending: false })

    if (error) {
      console.error("Database query error:", error)
      return []
    }

    return (externalProperties || []).map((property) => ({
      ...property,
      location: property.location || property.address || property.city || property.region || "Sur de Chile",
      price: property.price_clp || property.price || 0,
      area: property.area_m2 || property.area || 0,
      type: property.property_type || "propiedad",
      featured: false,
      status: "active",
      images: property.images || [],
    }))
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
