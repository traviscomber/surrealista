import { ExternalLink } from "lucide-react"
import { PropertyGallery } from "@/components/properties/property-gallery"
import { PropertyDetails } from "@/components/properties/property-details"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from("properties_external")
    .select(
      "id, title, location, address, city, commune, region, price, price_clp, price_uf, bedrooms, bathrooms, area, area_m2, property_type, operation, description, images, features, source, source_url, scraped_at, created_at, is_active",
    )
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error || !property) {
    notFound()
  }

  const normalizedProperty = {
    ...property,
    price: property.price_clp || property.price || 0,
    square_meters: property.area_m2 || property.area || null,
    location:
      property.location ||
      property.address ||
      [property.commune, property.city, property.region].filter(Boolean).join(", ") ||
      "Sur de Chile",
    condition: property.operation || undefined,
    features: property.features || [],
  }

  const images = (property.images || [])
    .filter((url: string | null) => Boolean(url))
    .map((url: string, index: number) => ({
      id: `${property.id}-${index}`,
      url,
      is_main: index === 0,
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl space-y-12">
          <PropertyGallery images={images} sourceUrl={property.source_url || undefined} />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PropertyDetails property={normalizedProperty} />
            </div>

            <aside className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fuente</p>
                <p className="mt-1 text-lg font-semibold capitalize">{property.source || "Fuente externa"}</p>
                {property.scraped_at && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Actualizado {new Date(property.scraped_at).toLocaleDateString("es-CL")}
                  </p>
                )}
              </div>

              {property.source_url ? (
                <Button asChild className="w-full gap-2">
                  <a href={property.source_url} target="_blank" rel="noopener noreferrer">
                    Ver publicación original
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">La fuente original no informó una URL pública.</p>
              )}

              <p className="text-xs leading-5 text-muted-foreground">
                Esta ficha refleja el inventario externo consolidado de Sur-Realista. Verifica condiciones y vigencia en la publicación original antes de una gestión comercial.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
