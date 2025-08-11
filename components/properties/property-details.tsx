import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Bed, Bath, Maximize, Home, Calendar, Tag, CheckCircle2 } from "lucide-react"

interface PropertyDetailsProps {
  property: any
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">{property.title}</h1>
          <p className="text-gray-600">{property.location || property.address}</p>
        </div>
        <div className="mt-2 md:mt-0">
          <p className="text-2xl font-bold text-primary">{formatCurrency(property.price)}</p>
        </div>
      </div>

      {/* Property stats */}
      <div className="grid grid-cols-4 gap-4 mb-6 border-y border-gray-200 py-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1">
            <Bed className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold">{property.bedrooms}</span>
          <span className="text-xs text-gray-500">Dormitorios</span>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1">
            <Bath className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold">{property.bathrooms}</span>
          <span className="text-xs text-gray-500">Baños</span>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1">
            <Maximize className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold">{property.square_meters} m²</span>
          <span className="text-xs text-gray-500">Superficie</span>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold capitalize">{property.property_type}</span>
          <span className="text-xs text-gray-500">Tipo</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Descripción</h2>
        <div className="text-gray-700 whitespace-pre-line">{property.description}</div>
      </div>

      {/* Characteristics section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Características</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
          {property.has_view && (
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
              <span>Vista al lago</span>
            </div>
          )}
          {property.has_terrace && (
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
              <span>Terraza</span>
            </div>
          )}
          {property.has_garden && (
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
              <span>Jardín</span>
            </div>
          )}
          {property.has_pool && (
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
              <span>Piscina</span>
            </div>
          )}
          {property.has_garage && (
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
              <span>Estacionamiento para {property.garage_spaces || 2} vehículos</span>
            </div>
          )}
          {property.features &&
            property.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                <span>{feature}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span className="capitalize">{property.condition || "Usado"}</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          <span className="capitalize">{property.property_type}</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Maximize className="h-3 w-3" />
          <span>{property.square_meters} m²</span>
        </Badge>
      </div>

      {property.created_at && (
        <p className="text-xs text-gray-500 mt-4">
          Publicado el{" "}
          {new Date(property.created_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  )
}
