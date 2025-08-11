import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bed, Bath, Home, MapPin, ExternalLink, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { BasicImage } from "@/components/ui/basic-image"

interface PropertyCardProps {
  property: any
}

export function PropertyCard({ property }: PropertyCardProps) {
  if (!property) {
    return null
  }

  // Simple image selection using existing images in the project
  const getPropertyImage = () => {
    // Find the main image or use the first one
    const mainImage = property.property_images?.find((img: any) => img.is_main) || property.property_images?.[0]

    if (mainImage?.url) {
      return mainImage.url
    }

    // Check for specific properties first
    const title = property.title?.toLowerCase() || ""
    const location = property.city?.toLowerCase() || property.location?.toLowerCase() || ""

    // Specific image for Lago Rinihue property
    if (title.includes("lago rinihue") || location.includes("lago rinihue")) {
      return "/images/casa-lago-rinihue.png"
    }

    // Use existing sample images that we know exist
    const existingImages = [
      "/images/property-sample-1.png",
      "/images/property-sample-2.png",
      "/images/property-sample-3.png",
      "/images/property-sample-4.png",
      "/images/property-sample-5.png",
      "/images/property-sample-6.png",
    ]

    // Use property ID to consistently assign the same image to the same property
    const propertyId = property.id || 1
    const imageIndex = (typeof propertyId === "string" ? propertyId.charCodeAt(0) : propertyId) % existingImages.length

    return existingImages[imageIndex]
  }

  const imageUrl = getPropertyImage()

  // Check if the property has a source URL
  const hasSourceUrl =
    property.source_url && typeof property.source_url === "string" && property.source_url.trim() !== ""

  return (
    <Card className="group overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
      <Link
        href={hasSourceUrl ? property.source_url : `/propiedades/${property.id}`}
        target={hasSourceUrl ? "_blank" : "_self"}
        className="block"
      >
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
          <BasicImage
            src={imageUrl}
            alt={property.title || "Propiedad en el Sur de Chile"}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {property.status === "sold" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <Badge className="text-lg bg-red-500 hover:bg-red-600 transition-colors duration-300 px-4 py-2">
                Vendido
              </Badge>
            </div>
          )}

          {property.featured && (
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white transition-all duration-300 group-hover:from-amber-600 group-hover:to-orange-600 px-3 py-1">
              ⭐ Destacada
            </Badge>
          )}

          {hasSourceUrl && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center gap-1 transition-all duration-300 group-hover:from-blue-600 group-hover:to-indigo-600 px-3 py-1">
              <ExternalLink className="h-3 w-3" />
              Sitio Original
            </Badge>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <span className="font-bold text-lg text-slate-800">{formatCurrency(property.price || 0)}</span>
          </div>
        </div>
      </Link>

      <CardContent className="flex-grow p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="font-bold text-xl line-clamp-2 text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
            {property.title || "Propiedad Sin Título"}
          </h3>

          <div className="flex items-center text-slate-500 text-sm">
            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
            <span className="line-clamp-1 font-medium">
              {property.address || property.location || property.city || "Sur de Chile"}
            </span>
          </div>
        </div>

        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
          {property.description ||
            "Hermosa propiedad ubicada en el sur de Chile, ideal para quienes buscan tranquilidad y conexión con la naturaleza."}
        </p>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="flex items-center justify-center bg-slate-50 rounded-lg py-2 transition-all duration-300 group-hover:bg-blue-50">
            <Bed className="h-4 w-4 mr-2 text-slate-500 group-hover:text-blue-500 transition-colors duration-300" />
            <span className="text-sm font-medium text-slate-700">{property.bedrooms || 0}</span>
          </div>
          <div className="flex items-center justify-center bg-slate-50 rounded-lg py-2 transition-all duration-300 group-hover:bg-blue-50">
            <Bath className="h-4 w-4 mr-2 text-slate-500 group-hover:text-blue-500 transition-colors duration-300" />
            <span className="text-sm font-medium text-slate-700">{property.bathrooms || 0}</span>
          </div>
          <div className="flex items-center justify-center bg-slate-50 rounded-lg py-2 transition-all duration-300 group-hover:bg-blue-50">
            <Home className="h-4 w-4 mr-2 text-slate-500 group-hover:text-blue-500 transition-colors duration-300" />
            <span className="text-sm font-medium text-slate-700">{property.square_meters || property.area || 0}m²</span>
          </div>
        </div>

        {/* Property features */}
        {(property.has_pool || property.has_garden || property.has_view || property.has_garage) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {property.has_pool && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                🏊‍♂️ Piscina
              </Badge>
            )}
            {property.has_garden && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-200">
                🌿 Jardín
              </Badge>
            )}
            {property.has_view && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200">
                🏔️ Vista
              </Badge>
            )}
            {property.has_garage && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                🚗 Garage
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 border-t border-slate-100">
        <Link
          href={hasSourceUrl ? property.source_url : `/propiedades/${property.id}`}
          target={hasSourceUrl ? "_blank" : "_self"}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 text-center group-hover:shadow-lg flex items-center justify-center space-x-2"
        >
          {hasSourceUrl ? (
            <>
              <span>Ver en Sitio Original</span>
              <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          ) : (
            <>
              <span>Ver Detalles</span>
              <ArrowRight className="h-4 w-4 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
            </>
          )}
        </Link>
      </CardFooter>
    </Card>
  )
}
