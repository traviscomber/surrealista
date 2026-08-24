import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, MapPin, Bed, Bath, Square } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface Property {
  id: number
  title: string
  description: string | null
  price: number
  location: string | null
  city: string
  region: string
  bedrooms: number | null
  bathrooms: number | null
  square_meters: number | null
  property_type: string
  status: string
  featured: boolean
  images: string[] | null
  created_at: string | null
  updated_at: string | null
}

function normalizeProperty(value: unknown): Property | null {
  if (!value || typeof value !== "object") return null

  const row = value as Record<string, unknown>
  if (
    typeof row.id !== "number" ||
    typeof row.title !== "string" ||
    typeof row.price !== "number" ||
    typeof row.city !== "string" ||
    typeof row.region !== "string" ||
    typeof row.property_type !== "string" ||
    typeof row.status !== "string" ||
    typeof row.featured !== "boolean"
  ) {
    return null
  }

  return {
    id: row.id,
    title: row.title,
    description: typeof row.description === "string" ? row.description : null,
    price: row.price,
    location: typeof row.location === "string" ? row.location : null,
    city: row.city,
    region: row.region,
    bedrooms: typeof row.bedrooms === "number" ? row.bedrooms : null,
    bathrooms: typeof row.bathrooms === "number" ? row.bathrooms : null,
    square_meters: typeof row.square_meters === "number" ? row.square_meters : null,
    property_type: row.property_type,
    status: row.status,
    featured: row.featured,
    images: Array.isArray(row.images) ? row.images.filter((image): image is string => typeof image === "string") : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  }
}

function getPropertyImage(property: Property): string {
  return property.images?.find((image) => image.trim().length > 0) || "/placeholder.svg"
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "activa":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activa</Badge>
    case "sold":
    case "vendida":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Vendida</Badge>
    case "pending":
    case "pendiente":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendiente</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(price)
}

async function getProperties(): Promise<Property[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("properties")
      .select(
        "id, title, description, price, location, city, region, bedrooms, bathrooms, square_meters, property_type, status, featured, images, created_at, updated_at",
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching properties:", error)
      return []
    }

    return (Array.isArray(data) ? data : [])
      .map(normalizeProperty)
      .filter((property): property is Property => property !== null)
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
          <p className="text-gray-600 mt-2">Gestiona todas las propiedades del sistema ({properties.length} total)</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin/propiedades/nueva">Agregar Propiedad</Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg mb-4">No hay propiedades registradas</p>
            <Button asChild>
              <Link href="/admin/propiedades/nueva">Crear Primera Propiedad</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <Image src={getPropertyImage(property)} alt={property.title} fill className="object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  {property.featured && <Badge className="bg-yellow-500 text-white">Destacada</Badge>}
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
                  {property.description || "Sin descripción disponible"}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</span>
                  <span className="text-sm text-gray-500">{property.property_type}</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    {property.bedrooms ?? "—"}
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    {property.bathrooms ?? "—"}
                  </div>
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    {property.square_meters != null ? `${property.square_meters}m²` : "—"}
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
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar no disponible desde esta vista</span>
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
