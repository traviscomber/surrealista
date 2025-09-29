"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Maximize2, Minimize2, Layers } from "lucide-react"

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
  filters: any
}

export default function InteractivePropertyMap({
  properties,
  selectedProperty,
  onPropertySelect,
  filters,
}: InteractivePropertyMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: -41.4693, lng: -72.9424 }) // Puerto Varas center
  const [zoom, setZoom] = useState(10)
  const [showLayers, setShowLayers] = useState(false)
  const [activeLayer, setActiveLayer] = useState("satellite")
  const mapRef = useRef<HTMLDivElement>(null)

  // Filter properties with valid coordinates
  const mappableProperties = properties.filter((p) => p.latitude && p.longitude)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPropertyTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "agricola":
      case "agricultural":
        return "bg-agricultural text-agricultural-foreground"
      case "rural":
      case "campo":
        return "bg-rural text-rural-foreground"
      case "forestal":
        return "bg-forest text-forest-foreground"
      case "acuicultura":
        return "bg-water text-water-foreground"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  const getPropertyIcon = (property: Property) => {
    if (property.water_rights) return "💧"
    if (property.property_type?.toLowerCase().includes("agricola")) return "🌾"
    if (property.property_type?.toLowerCase().includes("forestal")) return "🌲"
    if (property.lot_size && property.lot_size > 10000) return "🏞️"
    return "🏠"
  }

  return (
    <Card className={`relative overflow-hidden ${isFullscreen ? "fixed inset-0 z-50" : "h-96"}`}>
      {/* Map Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
            {mappableProperties.length} propiedades en el mapa
          </Badge>
          {selectedProperty && <Badge className="bg-primary/90 backdrop-blur-sm">{selectedProperty.title}</Badge>}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLayers(!showLayers)}
            className="bg-white/90 backdrop-blur-sm"
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-white/90 backdrop-blur-sm"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Layer Controls */}
      {showLayers && (
        <div className="absolute top-16 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="space-y-2">
            <Button
              variant={activeLayer === "satellite" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveLayer("satellite")}
              className="w-full justify-start"
            >
              Satélite
            </Button>
            <Button
              variant={activeLayer === "terrain" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveLayer("terrain")}
              className="w-full justify-start"
            >
              Terreno
            </Button>
            <Button
              variant={activeLayer === "cadastral" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveLayer("cadastral")}
              className="w-full justify-start"
            >
              Catastral
            </Button>
          </div>
        </div>
      )}

      {/* Simulated Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden"
        style={{
          backgroundImage: `url('/placeholder.svg?height=600&width=800')`,
        }}
      >
        {/* Property Markers */}
        {mappableProperties.map((property, index) => {
          const x = 20 + (index % 5) * 15 + Math.random() * 10
          const y = 20 + Math.floor(index / 5) * 15 + Math.random() * 10
          const isSelected = selectedProperty?.id === property.id

          return (
            <div
              key={property.id}
              className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                isSelected ? "scale-125 z-20" : "hover:scale-110 z-10"
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onPropertySelect(property)}
            >
              {/* Marker */}
              <div className={`relative ${isSelected ? "map-marker-pulse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm ${
                    isSelected ? "bg-primary" : getPropertyTypeColor(property.property_type)
                  }`}
                >
                  {getPropertyIcon(property)}
                </div>

                {/* Property Info Popup */}
                {isSelected && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl p-3 border animate-fade-in-up">
                    <div className="flex gap-3">
                      <img
                        src={
                          property.images[0] ||
                          `/placeholder.svg?height=60&width=80&query=${property.property_type} property`
                        }
                        alt={property.title}
                        className="w-20 h-15 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{property.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{property.location}</p>
                        <p className="font-bold text-primary text-sm">{formatPrice(property.price)}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {property.square_meters}m²
                          </Badge>
                          {property.water_rights && (
                            <Badge variant="outline" className="text-xs bg-water/10">
                              Derechos de agua
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h4 className="font-semibold text-sm mb-2">Leyenda</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-agricultural"></div>
              <span>Agrícola</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-rural"></div>
              <span>Rural</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-forest"></div>
              <span>Forestal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-water"></div>
              <span>Acuicultura</span>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
            className="bg-white/90 backdrop-blur-sm w-8 h-8 p-0"
          >
            +
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoom(Math.max(zoom - 1, 1))}
            className="bg-white/90 backdrop-blur-sm w-8 h-8 p-0"
          >
            -
          </Button>
        </div>
      </div>
    </Card>
  )
}
