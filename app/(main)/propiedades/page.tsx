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

async function PropertiesInventory() {
  const properties = await getProperties()
  return <PropertiesClient initialProperties={properties} />
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto space-y-3 px-4 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inventario comercial</p>
          <h2 className="text-2xl font-semibold tracking-tight">Propiedades disponibles</h2>
          <p className="text-sm text-muted-foreground">Cargando inventario conectado…</p>
        </div>
      }
    >
      <PropertiesInventory />
    </Suspense>
  )
}
