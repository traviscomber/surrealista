"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Bed, Bath, Square, Eye } from "lucide-react"
import Link from "next/link"

interface Property {
  id: string
  title: string
  location: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  type: string
  description: string
  featured: boolean
  status: string
  images: string[]
}

interface PropertyListViewProps {
  properties?: Property[]
  viewMode: "grid" | "list"
}

export default function PropertyListView({ properties = [], viewMode }: PropertyListViewProps) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const safeProperties = Array.isArray(properties) ? properties : []

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const toggleFavorite = (propertyId: string) => {
    setFavorites((prev) => (prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]))
  }

  const getPropertyImage = (property: Property) => {
    if (imageErrors[property.id]) {
      // Fallback based on property type
      if (property.type === "casa") {
        return "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=center"
      } else if (property.type === "departamento") {
        return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&crop=center"
      } else if (property.type === "terreno") {
        return "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center"
      }
      return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center"
    }

    if (property.images && property.images.length > 0) {
      return property.images[0]
    }

    const title = (property.title && typeof property.title === "string" ? property.title : "").toLowerCase()
    const location = (property.location && typeof property.location === "string" ? property.location : "").toLowerCase()

    if (title.includes("lago") || location.includes("puerto varas") || location.includes("frutillar")) {
      return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center"
    }
    if (title.includes("cabaña") || location.includes("pucón")) {
      return "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=center"
    }
    if (title.includes("patrimonial") || location.includes("valdivia")) {
      return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center"
    }
    if (property.type === "terreno" || title.includes("parcela")) {
      return "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center"
    }
    if (property.type === "departamento") {
      return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&crop=center"
    }

    return "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=center"
  }

  const handleImageError = (propertyId: string) => {
    setImageErrors((prev) => ({ ...prev, [propertyId]: true }))
  }

  if (safeProperties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron propiedades</h3>
          <p className="text-gray-600 mb-6">Intenta ajustar tus filtros de búsqueda para encontrar más opciones.</p>
          <Button variant="outline">Limpiar Filtros</Button>
        </div>
      </div>
    )
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        {safeProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 relative">
                <img
                  src={getPropertyImage(property) || "/placeholder.svg"}
                  alt={property.title}
                  className="w-full h-48 md:h-full object-cover"
                  onError={() => handleImageError(property.id)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={() => toggleFavorite(property.id)}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favorites.includes(property.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                    }`}
                  />
                </Button>
                {property.featured && (
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500">
                    Destacada
                  </Badge>
                )}
              </div>
              <CardContent className="md:w-2/3 p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">{property.title || "Sin título"}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{property.location || "Ubicación no disponible"}</span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.description}</p>

                <div className="flex items-center gap-4 mb-4">
                  {property.bedrooms > 0 && (
                    <div className="flex items-center text-gray-600">
                      <Bed className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex items-center text-gray-600">
                      <Bath className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.bathrooms}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Square className="h-4 w-4 mr-1" />
                    <span className="text-sm">{property.area}m²</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="capitalize">
                    {property.type}
                  </Badge>
                  <Link href={`/propiedades/${property.id}`}>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {safeProperties.map((property) => (
        <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
          <div className="relative">
            <img
              src={getPropertyImage(property) || "/placeholder.svg"}
              alt={property.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => handleImageError(property.id)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={() => toggleFavorite(property.id)}
            >
              <Heart
                className={`h-4 w-4 ${favorites.includes(property.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
              />
            </Button>
            {property.featured && (
              <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500">Destacada</Badge>
            )}
          </div>
          <CardContent className="p-4">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
                {property.title || "Sin título"}
              </h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{property.location || "Ubicación no disponible"}</span>
              </div>
            </div>

            <div className="text-xl font-bold text-blue-600 mb-3">{formatPrice(property.price)}</div>

            <div className="flex items-center gap-4 mb-4">
              {property.bedrooms > 0 && (
                <div className="flex items-center text-gray-600">
                  <Bed className="h-4 w-4 mr-1" />
                  <span className="text-sm">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center text-gray-600">
                  <Bath className="h-4 w-4 mr-1" />
                  <span className="text-sm">{property.bathrooms}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Square className="h-4 w-4 mr-1" />
                <span className="text-sm">{property.area}m²</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Badge variant="outline" className="capitalize">
                {property.type}
              </Badge>
              <Link href={`/propiedades/${property.id}`}>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
