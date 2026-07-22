"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, MapPin, Navigation } from "lucide-react"

interface Property {
  id: string
  title: string
  location: string
  price: number
  latitude?: number
  longitude?: number
  property_type: string
  square_meters?: number
  lot_size?: number
  images: string[]
  featured: boolean
  water_rights?: boolean
  avaluo_total?: number
}

interface InteractivePropertyMapProps {
  properties: Property[]
  selectedProperty?: Property | null
  onPropertySelect: (property: Property) => void
  filters: unknown
}

function hasValidCoordinates(property: Property) {
  return (
    typeof property.latitude === "number" &&
    Number.isFinite(property.latitude) &&
    property.latitude >= -90 &&
    property.latitude <= 90 &&
    typeof property.longitude === "number" &&
    Number.isFinite(property.longitude) &&
    property.longitude >= -180 &&
    property.longitude <= 180
  )
}

function formatCoordinate(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "No disponible"
}

export default function InteractivePropertyMap({
  properties,
  selectedProperty,
  onPropertySelect,
}: InteractivePropertyMapProps) {
  const safeProperties = Array.isArray(properties) ? properties : []
  const mappableProperties = safeProperties.filter(hasValidCoordinates)
  const missingCoordinates = safeProperties.length - mappableProperties.length

  return (
    <Card className="border-border/70">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Cobertura geográfica
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl leading-5">
              Esta vista muestra únicamente propiedades que cuentan con coordenadas válidas. No representa un mapa cartográfico ni infiere ubicaciones faltantes.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{mappableProperties.length} con coordenadas</Badge>
            {missingCoordinates > 0 ? <Badge variant="outline">{missingCoordinates} sin coordenadas</Badge> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {mappableProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-12 text-center">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No hay coordenadas disponibles</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Las propiedades actuales no pueden ubicarse de forma verificable. Agrega latitud y longitud desde una fuente confiable antes de habilitar una visualización cartográfica.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mappableProperties.map((property) => {
              const isSelected = selectedProperty?.id === property.id

              return (
                <button
                  key={property.id}
                  type="button"
                  onClick={() => onPropertySelect(property)}
                  className={`w-full rounded-md border p-4 text-left transition-colors hover:bg-muted/50 ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{property.title || "Propiedad sin título"}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {property.location || "Ubicación textual no informada"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md border bg-muted/30 px-2 py-1">
                        Lat. {formatCoordinate(property.latitude)}
                      </span>
                      <span className="rounded-md border bg-muted/30 px-2 py-1">
                        Long. {formatCoordinate(property.longitude)}
                      </span>
                      {isSelected ? <Badge>Seleccionada</Badge> : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-5 flex gap-3 rounded-md border bg-muted/30 p-4 text-sm leading-6">
          <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Para recuperar un mapa real se debe integrar un proveedor cartográfico, transformar las coordenadas a una proyección válida y representar cada punto en su posición geográfica exacta.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
