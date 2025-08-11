"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { SimpleImage } from "@/components/ui/simple-image"

interface PropertyAIRecommendationsProps {
  propertyId: string
}

// Sample property data for recommendations
const samplePropertyData = [
  {
    id: "sample-1",
    title: "Casa con vista al lago en Puerto Varas",
    price: 320000000,
    city: "Puerto Varas",
    mainImage: "/images/property-sample-1.png",
  },
  {
    id: "sample-2",
    title: "Cabaña moderna en Pucón",
    price: 245000000,
    city: "Pucón",
    mainImage: "/images/property-sample-2.png",
  },
  {
    id: "sample-3",
    title: "Casa tradicional en Chiloé",
    price: 180000000,
    city: "Castro",
    mainImage: "/images/property-sample-3.png",
  },
  {
    id: "sample-4",
    title: "Departamento de lujo en Puerto Varas",
    price: 280000000,
    city: "Puerto Varas",
    mainImage: "/images/property-sample-4.png",
  },
  {
    id: "sample-5",
    title: "Casa de campo en Frutillar",
    price: 210000000,
    city: "Frutillar",
    mainImage: "/images/property-sample-5.png",
  },
  {
    id: "sample-6",
    title: "Casa moderna en Valdivia",
    price: 380000000,
    city: "Valdivia",
    mainImage: "/images/property-sample-6.png",
  },
  {
    id: "sam",
    title: "Espectacular Casa en Orilla del Lago Villarrica",
    price: 850000000,
    city: "Villarrica",
    mainImage: "/images/sam/exterior-1.png",
  },
]

export function PropertyAIRecommendations({ propertyId }: PropertyAIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Check if this is a sample property
        if (propertyId.startsWith("sample-") || propertyId === "sam") {
          // Get recommendations from sample data
          const currentSampleNumber = propertyId === "sam" ? "sam" : propertyId.split("-")[1]

          // Filter out the current property and get 3 random ones
          const filteredSamples = samplePropertyData
            .filter((p) => p.id !== propertyId)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)

          // Format the recommendations to match the expected structure
          const mockRecommendations = filteredSamples.map((property) => ({
            id: property.id,
            title: property.title,
            price: property.price,
            city: property.city,
            property_images: [
              {
                url: property.mainImage,
                is_main: true,
              },
            ],
          }))

          setRecommendations(mockRecommendations)
        } else {
          // For real properties, fetch from database
          const { data, error } = await supabase
            .from("properties")
            .select(`
              id,
              title,
              price,
              city,
              property_images(url, is_main)
            `)
            .neq("id", propertyId)
            .limit(3)

          if (error) throw error

          setRecommendations(data || [])
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [propertyId])

  if (isLoading) {
    return (
      <Card className="border border-gray-200 mt-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <CardTitle className="text-lg">Propiedades Similares</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0 divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex p-4">
                <div className="rounded-md bg-gray-200 h-16 w-16 mr-3"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 mt-6">
      <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <CardTitle className="text-lg">Propiedades Similares</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {recommendations.length > 0 ? (
            recommendations.map((property) => {
              // Find main image or use first one
              const mainImage = property.property_images?.find((img: any) => img.is_main) ||
                property.property_images?.[0] || { url: "/placeholder.svg?key=uymu1" }

              return (
                <Link
                  key={property.id}
                  href={`/propiedades/${property.id}`}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 mr-3 border border-gray-200">
                    <SimpleImage
                      src={mainImage.url || "/placeholder.svg"}
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-1 text-sm">{property.title}</h4>
                    <p className="text-xs text-gray-500">{property.city}</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(property.price)}</p>
                  </div>
                </Link>
              )
            })
          ) : (
            <p className="text-center text-gray-500 py-4">No hay recomendaciones disponibles</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
