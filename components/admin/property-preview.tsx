"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bed, Bath, Square, MapPin, Home, Calendar, Car } from "lucide-react"
import Image from "next/image"

interface PropertyPreviewProps {
  property: any
}

export function PropertyPreview({ property }: PropertyPreviewProps) {
  const formatCurrency = (value: number, currency: string) => {
    if (!value) return "Precio no disponible"

    if (currency === "UF") {
      return `${value.toLocaleString("es-CL")} UF`
    }

    if (currency === "CLP") {
      return `$${value.toLocaleString("es-CL")}`
    }

    if (currency === "USD") {
      return `US$${value.toLocaleString("en-US")}`
    }

    if (currency === "EUR") {
      return `€${value.toLocaleString("de-DE")}`
    }

    return `${value.toLocaleString()} ${currency}`
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-64">
        {property.images && property.images.length > 0 ? (
          <Image
            src={property.images[0] || "/placeholder.svg"}
            alt={property.title || "Propiedad"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Home className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {property.status && (
          <Badge className="absolute top-4 right-4 capitalize">
            {property.status === "available"
              ? "Disponible"
              : property.status === "sold"
                ? "Vendido"
                : property.status === "reserved"
                  ? "Reservado"
                  : property.status === "pending"
                    ? "Pendiente"
                    : property.status}
          </Badge>
        )}
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            {property.price && property.price_currency && (
              <p className="text-2xl font-bold">{formatCurrency(Number(property.price), property.price_currency)}</p>
            )}
            <h3 className="text-xl font-semibold mt-1">{property.title || "Sin título"}</h3>

            <div className="flex items-center text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <p className="text-sm">
                {[property.address, property.city, property.region].filter(Boolean).join(", ") ||
                  "Ubicación no disponible"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {property.bedrooms && (
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                <span>{property.bedrooms} Dorm.</span>
              </div>
            )}

            {property.bathrooms && (
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                <span>{property.bathrooms} Baños</span>
              </div>
            )}

            {property.area && (
              <div className="flex items-center">
                <Square className="h-4 w-4 mr-1" />
                <span>{property.area} m²</span>
              </div>
            )}

            {property.year_built && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{property.year_built}</span>
              </div>
            )}

            {property.parking && (
              <div className="flex items-center">
                <Car className="h-4 w-4 mr-1" />
                <span>{property.parking} Est.</span>
              </div>
            )}
          </div>

          {property.description && <p className="text-muted-foreground line-clamp-3">{property.description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
