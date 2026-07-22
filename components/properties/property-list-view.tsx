"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Bed, Bath, Square, Eye, ImageOff } from "lucide-react"
import Link from "next/link"
import { SimpleImage } from "@/components/ui/simple-image"

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
  const safeProperties = Array.isArray(properties) ? properties : []

  const formatPrice = (price: number) => {
    if (!price || price <= 0) return "Precio no informado"

    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPropertyImage = (property: Property) => {
    return property.images?.find((image) => typeof image === "string" && image.trim().length > 0) || null
  }

  if (safeProperties.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-serif text-xl font-semibold">No hay propiedades disponibles</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            No se encontraron registros para los criterios actuales. Revisa los filtros o el estado de la fuente de datos.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {safeProperties.map((property) => {
          const image = getPropertyImage(property)

          return (
            <Card key={property.id} className="overflow-hidden border-border/70">
              <div className="flex flex-col md:flex-row">
                <div className="relative h-52 bg-muted md:h-auto md:w-1/3">
                  <SimpleImage
                    src={image}
                    alt={property.title || "Propiedad"}
                    fill
                    className="h-full w-full object-cover"
                  />
                  {property.featured ? (
                    <Badge variant="secondary" className="absolute left-3 top-3">Destacada</Badge>
                  ) : null}
                </div>

                <CardContent className="space-y-4 p-5 md:w-2/3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-semibold">{property.title || "Propiedad sin título"}</h3>
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-4 w-4" />
                        {property.location || "Ubicación no informada"}
                      </div>
                    </div>
                    <p className="font-semibold">{formatPrice(property.price)}</p>
                  </div>

                  {property.description ? (
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{property.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Descripción no informada.</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {property.bedrooms > 0 ? <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms}</span> : null}
                    {property.bathrooms > 0 ? <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms}</span> : null}
                    {property.area > 0 ? <span className="flex items-center gap-1"><Square className="h-4 w-4" />{property.area.toLocaleString("es-CL")} m²</span> : <span>Superficie no informada</span>}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline" className="capitalize">{property.type || "Tipo no informado"}</Badge>
                    <Button asChild size="sm">
                      <Link href={`/propiedades/${property.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {safeProperties.map((property) => {
        const image = getPropertyImage(property)

        return (
          <Card key={property.id} className="overflow-hidden border-border/70">
            <div className="relative h-48 bg-muted">
              {image ? (
                <SimpleImage src={image} alt={property.title || "Propiedad"} fill className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="h-6 w-6" />
                  <span className="text-xs">Imagen no disponible</span>
                </div>
              )}
              {property.featured ? (
                <Badge variant="secondary" className="absolute left-3 top-3">Destacada</Badge>
              ) : null}
            </div>

            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="line-clamp-1 font-serif text-lg font-semibold">{property.title || "Propiedad sin título"}</h3>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span className="line-clamp-1">{property.location || "Ubicación no informada"}</span>
                </div>
              </div>

              <p className="font-semibold">{formatPrice(property.price)}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {property.bedrooms > 0 ? <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms}</span> : null}
                {property.bathrooms > 0 ? <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms}</span> : null}
                {property.area > 0 ? <span className="flex items-center gap-1"><Square className="h-4 w-4" />{property.area.toLocaleString("es-CL")} m²</span> : null}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="capitalize">{property.type || "Tipo no informado"}</Badge>
                <Button asChild size="sm">
                  <Link href={`/propiedades/${property.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalle
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
