import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import HeroSection from "@/components/home/hero-section"
import AnimatedFeaturedProperties from "@/components/home/animated-featured-properties"
import FeaturesSection from "@/components/home/features-section"
import AIAssistantSection from "@/components/home/ai-assistant-section"
import TestimonialsSection from "@/components/home/testimonials-section"

interface Property {
  id: string
  title: string
  description: string
  price: number
  location: string
  city: string
  region: string
  bedrooms: number
  bathrooms: number
  square_meters: number
  property_type: string
  status: string
  featured: boolean
  created_at: string
  updated_at: string
}

async function getFeaturedProperties(): Promise<Property[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("properties").select("*").eq("status", "active").limit(6)

    if (error) {
      console.error("Error fetching properties:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Database connection error:", error)
    return []
  }
}

function ErrorFallback() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Propiedades Destacadas</h2>
        <p className="text-gray-600 mb-8">Estamos cargando las mejores propiedades del sur de Chile...</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedPropertiesSection({ properties }: { properties: Property[] }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Propiedades Destacadas</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre las mejores propiedades en ubicaciones exclusivas del sur de Chile
          </p>
        </div>

        <AnimatedFeaturedProperties properties={properties} />
      </div>
    </section>
  )
}

export default async function HomePage() {
  try {
    const featuredProperties = await getFeaturedProperties()

    return (
      <main className="min-h-screen">
        {/* Hero Section */}
        <HeroSection />

        {/* Featured Properties */}
        <Suspense fallback={<ErrorFallback />}>
          <FeaturedPropertiesSection properties={featuredProperties} />
        </Suspense>

        {/* Features Section */}
        <FeaturesSection />

        {/* AI Assistant Section */}
        <AIAssistantSection />

        {/* Testimonials Section */}
        <TestimonialsSection />
      </main>
    )
  } catch (error) {
    console.error("Page rendering error:", error)

    return (
      <main className="min-h-screen">
        <HeroSection />
        <ErrorFallback />
        <FeaturesSection />
      </main>
    )
  }
}
