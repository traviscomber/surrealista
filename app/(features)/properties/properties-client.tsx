"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Bed, Bath, Square } from "lucide-react"

interface Property {
  id: string
  title: string
  price: number
  location: string
  bedrooms: number
  bathrooms: number
  area: number
  type: string
  image: string
}

export function PropertiesClient() {
  const [properties, setProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading properties
    setTimeout(() => {
      setProperties([
        {
          id: "1",
          title: "Casa Moderna en Las Condes",
          price: 450000000,
          location: "Las Condes, Santiago",
          bedrooms: 4,
          bathrooms: 3,
          area: 180,
          type: "Casa",
          image: "/placeholder.svg?height=200&width=300",
        },
        {
          id: "2",
          title: "Departamento Vista al Mar",
          price: 320000000,
          location: "Viña del Mar, Valparaíso",
          bedrooms: 2,
          bathrooms: 2,
          area: 95,
          type: "Departamento",
          image: "/placeholder.svg?height=200&width=300",
        },
        {
          id: "3",
          title: "Casa Familiar en Providencia",
          price: 380000000,
          location: "Providencia, Santiago",
          bedrooms: 3,
          bathrooms: 2,
          area: 150,
          type: "Casa",
          image: "/placeholder.svg?height=200&width=300",
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Propiedades</h1>
        <p className="text-gray-600">Encuentra tu propiedad ideal</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar propiedades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Filtros</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={property.image || "/placeholder.svg"}
                alt={property.title}
                className="w-full h-48 object-cover"
              />
              <Badge className="absolute top-2 left-2">{property.type}</Badge>
            </div>

            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2">{property.title}</CardTitle>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{property.location}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Bed className="w-4 h-4 mr-1" />
                  {property.bedrooms}
                </div>
                <div className="flex items-center">
                  <Bath className="w-4 h-4 mr-1" />
                  {property.bathrooms}
                </div>
                <div className="flex items-center">
                  <Square className="w-4 h-4 mr-1" />
                  {property.area}m²
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</span>
                <Button size="sm">Ver Detalles</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron propiedades que coincidan con tu búsqueda.</p>
        </div>
      )}
    </div>
  )
}
