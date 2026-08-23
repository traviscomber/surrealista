import { PropertyGallery } from "@/components/properties/property-gallery"
import { PropertyDetails } from "@/components/properties/property-details"
import { PropertyContactForm } from "@/components/properties/property-contact-form"
import { PropertyAIRecommendations } from "@/components/properties/property-ai-recommendations"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from("properties")
    .select("*, property_images(id, url, is_main)")
    .eq("id", id)
    .eq("status", "active")
    .single()

  if (error || !property) {
    notFound()
  }

  const images = (property.property_images || [])
    .filter((image) => Boolean(image?.url))
    .map((image) => ({
      id: String(image.id),
      url: image.url as string,
      is_main: Boolean(image.is_main),
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl space-y-12">
          <PropertyGallery images={images} sourceUrl={property.source_url || undefined} />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PropertyDetails property={property} />
            </div>
            <div className="space-y-8">
              <PropertyContactForm propertyId={id} />
              <PropertyAIRecommendations propertyId={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
