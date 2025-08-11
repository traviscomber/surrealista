import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, MapPin, Bed, Bath, Square } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

// Function to get appropriate image based on property details
function getPropertyImage(property: Property): string {
  const baseUrl = "https://images.unsplash.com"
  
  // Map based on location and type
  if (property.city?.toLowerCase().includes('pucon') || property.location?.toLowerCase().includes('lago')) {
    return `${baseUrl}/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center`
  }
  
  if (property.city?.toLowerCase().includes('puerto varas') || property.property_type?.toLowerCase().includes('cabaña')) {
    return `${baseUrl}/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center`
  }
  
  if (property.property_type?.toLowerCase().includes('casa')) {
    return `${baseUrl}/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&crop=center`
  }
  
  if (property.property_type?.toLowerCase().includes('parcela') || property.property_type?.toLowerCase().includes('terreno')) {
    return `${baseUrl}/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center`
  }
  
  // Default modern house
  return `${baseUrl}/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop&crop=center`
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'activa':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activa</Badge>
    case 'sold':
    case 'vendida':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Vendida</Badge>
    case 'pending':
    case 'pendiente':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendiente</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`
  }
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`
  }
  return `$${price.toLocaleString()}`
}

async function getProperties(): Promise<Property[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching properties:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getProperties:", error)
    return []
  }
}

export default async function PropertiesListPage() {
  const properties = await getProperties()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lista de Propiedades</h1>
          <p className="text-gray-600 mt-2">
            Gestiona todas las propiedades del sistema ({properties.length} total)
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin/propiedades/nueva">
            Agregar Propiedad
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg mb-4">No hay propiedades registradas</p>
            <Button asChild>
              <Link href="/admin/propiedades/nueva">
                Crear Primera Propiedad
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <Image
                  src={getPropertyImage(property) || "/placeholder.svg"}
                  alt={property.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop&crop=center"
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {property.featured && (
                    <Badge className="bg-yellow-500 text-white">Destacada</Badge>
                  )}
                  {getStatusBadge(property.status)}
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.city}, {property.region}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {property.description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(property.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {property.property_type}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    {property.bedrooms}
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    {property.bathrooms}
                  </div>
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    {property.square_meters}m²
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/propiedades/${property.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/admin/propiedades/editar/${property.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
