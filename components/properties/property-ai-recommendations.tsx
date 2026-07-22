"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { SimpleImage } from "@/components/ui/simple-image"

interface PropertyAIRecommendationsProps {
  propertyId: string
}

interface RelatedProperty {
  id: string
  title: string
  price: number | null
  city: string | null
  property_images?: Array<{ url: string | null; is_main: boolean | null }>
}

export function PropertyAIRecommendations({ propertyId }: PropertyAIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RelatedProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let active = true

    const fetchRecommendations = async () => {
      setIsLoading(true)
      setHasError(false)

      try {
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
        if (active) setRecommendations((data as RelatedProperty[]) || [])
      } catch (error) {
        console.error("No se pudieron cargar propiedades relacionadas:", error)
        if (active) {
          setRecommendations([])
          setHasError(true)
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    fetchRecommendations()
    return () => {
      active = false
    }
  }, [propertyId])

  return (
    <Card className="mt-6 border-border/70">
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <CardTitle className="text-lg">Propiedades relacionadas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="divide-y">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex animate-pulse p-4">
                <div className="mr-3 h-16 w-16 rounded-md bg-muted" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No fue posible consultar propiedades relacionadas en este momento.
          </p>
        ) : recommendations.length > 0 ? (
          <div className="divide-y">
            {recommendations.map((property) => {
              const mainImage =
                property.property_images?.find((image) => image.is_main)?.url ||
                property.property_images?.find((image) => image.url)?.url ||
                null

              return (
                <Link
                  key={property.id}
                  href={`/propiedades/${property.id}`}
                  className="flex items-center p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mr-3 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                    <SimpleImage src={mainImage} alt={property.title || "Propiedad relacionada"} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-1 text-sm font-medium">{property.title || "Propiedad sin título"}</h4>
                    <p className="text-xs text-muted-foreground">{property.city || "Ubicación no informada"}</p>
                    <p className="text-sm font-semibold text-primary">
                      {property.price ? formatCurrency(property.price) : "Precio no informado"}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No hay propiedades relacionadas disponibles en la fuente actual.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
