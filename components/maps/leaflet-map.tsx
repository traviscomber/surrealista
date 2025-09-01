"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Layers, Heart } from "lucide-react"

interface Property {
  id: string
  title: string
  type: "casa" | "departamento" | "terreno" | "comercial"
  price: number
  location: {
    city: string
    region: string
    coordinates: [number, number]
  }
  features: {
    bedrooms?: number
    bathrooms?: number
    area: number
  }
  description: string
  image: string
  featured: boolean
}

interface KMZData {
  fileName: string
  coordinates: Array<[number, number]>
  rolNumbers: string[]
  properties: any[]
}

interface LeafletMapProps {
  properties: Property[]
  kmzData: KMZData[]
  showKmzOverlay: boolean
  onToggleKmzOverlay: () => void
  onPropertySelect: (property: Property | null) => void
  selectedProperty: Property | null
}

export default function LeafletMap({
  properties,
  kmzData,
  showKmzOverlay,
  onToggleKmzOverlay,
  onPropertySelect,
  selectedProperty,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      try {
        console.log("[v0] Starting Leaflet initialization...")
        setIsLoading(true)
        setError(null)

        if ((window as any).L) {
          console.log("[v0] Leaflet already loaded")
          setLeafletLoaded(true)
          return
        }

        const existingLinks = document.querySelectorAll('link[href*="leaflet"]')
        const existingScripts = document.querySelectorAll('script[src*="leaflet"]')
        existingLinks.forEach((link) => link.remove())
        existingScripts.forEach((script) => script.remove())

        console.log("[v0] Loading Leaflet CSS...")
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        cssLink.crossOrigin = ""

        const cssPromise = new Promise((resolve, reject) => {
          cssLink.onload = () => {
            console.log("[v0] Leaflet CSS loaded successfully")
            resolve(true)
          }
          cssLink.onerror = () => {
            console.error("[v0] Failed to load Leaflet CSS")
            reject(new Error("Failed to load Leaflet CSS"))
          }
        })

        document.head.appendChild(cssLink)
        await cssPromise

        await new Promise((resolve) => setTimeout(resolve, 200))

        console.log("[v0] Loading Leaflet JavaScript...")
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""

        const jsPromise = new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("[v0] Leaflet JavaScript loaded successfully")
            if ((window as any).L) {
              resolve(true)
            } else {
              reject(new Error("Leaflet object not available after loading"))
            }
          }
          script.onerror = () => {
            console.error("[v0] Failed to load Leaflet JavaScript")
            reject(new Error("Failed to load Leaflet JavaScript"))
          }
        })

        document.head.appendChild(script)
        await jsPromise

        if (!mounted) return

        setLeafletLoaded(true)
        console.log("[v0] Leaflet loaded successfully")
      } catch (err) {
        console.error("[v0] Error loading Leaflet:", err)
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load Leaflet")
          setIsLoading(false)
        }
      }
    }

    loadLeaflet()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstance) return

    let mounted = true

    const initializeMap = async () => {
      try {
        console.log("[v0] Initializing map...")

        const L = (window as any).L
        if (!L) {
          throw new Error("Leaflet not available")
        }

        if (mapRef.current) {
          mapRef.current.innerHTML = ""
        }

        await new Promise((resolve) => setTimeout(resolve, 100))

        if (!mounted || !mapRef.current) return

        const map = L.map(mapRef.current, {
          center: [-41.0, -72.5],
          zoom: 8,
          zoomControl: true,
          attributionControl: true,
          preferCanvas: false,
          renderer: L.svg(),
        })

        console.log("[v0] Map instance created")

        const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 3,
          errorTileUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        })

        let tilesLoaded = false
        const tileLoadTimeout = setTimeout(() => {
          if (!tilesLoaded && mounted) {
            console.log("[v0] Tiles loaded (timeout)")
            setIsLoading(false)
          }
        }, 5000)

        tileLayer.on("load", () => {
          tilesLoaded = true
          clearTimeout(tileLoadTimeout)
          console.log("[v0] Map tiles loaded successfully")
          if (mounted) {
            setIsLoading(false)
          }
        })

        tileLayer.on("tileerror", (e: any) => {
          console.warn("[v0] Tile loading error:", e)
        })

        tileLayer.addTo(map)

        setTimeout(() => {
          if (mounted && map) {
            map.invalidateSize()
            console.log("[v0] Map size invalidated")
          }
        }, 500)

        if (mounted) {
          setMapInstance(map)
          console.log("[v0] Map initialized successfully")
        }
      } catch (err) {
        console.error("[v0] Error initializing map:", err)
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize map")
          setIsLoading(false)
        }
      }
    }

    initializeMap()

    return () => {
      mounted = false
    }
  }, [leafletLoaded, mapInstance])

  useEffect(() => {
    if (!mapInstance || !properties.length) return

    const addMarkers = () => {
      try {
        const L = (window as any).L
        if (!L) return

        console.log("[v0] Adding property markers...")

        mapInstance.eachLayer((layer: any) => {
          if (layer instanceof L.Marker && !layer.options.isKmz) {
            mapInstance.removeLayer(layer)
          }
        })

        const createCustomIcon = (type: string, featured: boolean) => {
          const color = featured
            ? "#ef4444"
            : type === "casa"
              ? "#3b82f6"
              : type === "departamento"
                ? "#10b981"
                : type === "terreno"
                  ? "#f59e0b"
                  : "#8b5cf6"

          return L.divIcon({
            html: `
              <div style="
                background-color: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
              ">
                ${type === "casa" ? "🏠" : type === "departamento" ? "🏢" : type === "terreno" ? "🌲" : "🏪"}
              </div>
            `,
            className: "custom-div-icon",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })
        }

        properties.forEach((property) => {
          const [lat, lng] = property.location.coordinates
          if (isNaN(lat) || isNaN(lng)) return

          const icon = createCustomIcon(property.type, property.featured)

          const marker = L.marker([lat, lng], { icon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${property.title}</h3>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${property.location.city}, ${property.location.region}</p>
                <p style="margin: 0 0 8px 0; font-size: 12px;">${property.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 16px; font-weight: bold; color: #10b981;">
                    $${formatPrice(property.price)}
                  </span>
                  <span style="font-size: 12px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">
                    ${property.features.area}m²
                  </span>
                </div>
              </div>
            `)

          marker.on("click", () => {
            onPropertySelect(property)
          })
        })

        console.log("[v0] Property markers added successfully")
      } catch (err) {
        console.error("[v0] Error adding markers:", err)
      }
    }

    addMarkers()
  }, [mapInstance, properties, onPropertySelect])

  useEffect(() => {
    if (!mapInstance || !kmzData.length) return

    const addKmzData = () => {
      try {
        const L = (window as any).L
        if (!L) return

        console.log("[v0] Adding KMZ data...")

        mapInstance.eachLayer((layer: any) => {
          if (layer.options && layer.options.isKmz) {
            mapInstance.removeLayer(layer)
          }
        })

        if (!showKmzOverlay) return

        kmzData.forEach((data, dataIndex) => {
          data.coordinates.forEach((coord, coordIndex) => {
            const [lat, lng] = coord
            if (isNaN(lat) || isNaN(lng)) return

            const kmzIcon = L.divIcon({
              html: `
                <div style="
                  background-color: #8b5cf6;
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                "></div>
              `,
              className: "kmz-point-icon",
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })

            L.marker([lat, lng], {
              icon: kmzIcon,
              isKmz: true,
            })
              .addTo(mapInstance)
              .bindPopup(`
                <div>
                  <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold;">KMZ: ${data.fileName}</h4>
                  <p style="margin: 0; font-size: 11px;">Coordenada ${coordIndex + 1}</p>
                  <p style="margin: 0; font-size: 11px;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</p>
                  ${data.rolNumbers.length > 0 ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #f59e0b;">Roles: ${data.rolNumbers.join(", ")}</p>` : ""}
                </div>
              `)
          })

          if (data.coordinates.length > 2) {
            const validCoords = data.coordinates.filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng))
            if (validCoords.length > 2) {
              L.polygon(validCoords, {
                color: "#8b5cf6",
                weight: 2,
                opacity: 0.8,
                fillColor: "#8b5cf6",
                fillOpacity: 0.1,
                dashArray: "5, 5",
                isKmz: true,
              })
                .addTo(mapInstance)
                .bindPopup(`
                  <div>
                    <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold;">Límite KMZ: ${data.fileName}</h4>
                    <p style="margin: 0; font-size: 11px;">${validCoords.length} puntos de límite</p>
                    ${data.rolNumbers.length > 0 ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #f59e0b;">Roles: ${data.rolNumbers.join(", ")}</p>` : ""}
                  </div>
                `)
            }
          }
        })

        console.log("[v0] KMZ data added successfully")
      } catch (err) {
        console.error("[v0] Error adding KMZ data:", err)
      }
    }

    addKmzData()
  }, [mapInstance, kmzData, showKmzOverlay])

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)}B`
    } else if (price >= 1000000) {
      return `${(price / 1000000).toFixed(0)}M`
    } else {
      return `${(price / 1000).toFixed(0)}K`
    }
  }

  return (
    <Card>
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-[500px] rounded-lg bg-gray-100 border"
          style={{
            minHeight: "500px",
            width: "100%",
            position: "relative",
            zIndex: 1,
          }}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Cargando mapa interactivo...</p>
              <p className="text-xs text-muted-foreground mt-1">Esto puede tomar unos segundos</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
            <div className="text-center p-4">
              <p className="text-sm text-red-600 mb-2">Error al cargar el mapa</p>
              <p className="text-xs text-red-500 mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => {
                  setError(null)
                  setIsLoading(true)
                  setLeafletLoaded(false)
                  window.location.reload()
                }}
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 max-w-xs">
          <h4 className="font-semibold text-sm">Leyenda</h4>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Casas</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Departamentos</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Terrenos</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Destacadas</span>
          </div>
          {kmzData.length > 0 && showKmzOverlay && (
            <>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Puntos KMZ</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-1 border-t-2 border-dashed border-purple-500"></div>
                <span>Límites KMZ</span>
              </div>
            </>
          )}
        </div>

        {kmzData.length > 0 && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Archivos KMZ</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleKmzOverlay}
                className="gap-1 text-xs px-2 py-1 bg-transparent"
              >
                <Layers className="h-3 w-3" />
                {showKmzOverlay ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {kmzData.map((data, index) => (
                <div key={index} className="text-xs p-2 bg-purple-50 rounded">
                  <div className="font-medium truncate">{data.fileName}</div>
                  <div className="text-muted-foreground">{data.coordinates.length} coordenadas</div>
                  {data.rolNumbers.length > 0 && (
                    <div className="text-orange-600 font-mono text-xs">
                      {data.rolNumbers.slice(0, 2).join(", ")}
                      {data.rolNumbers.length > 2 && "..."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProperty && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm">{selectedProperty.title}</h4>
              <Button variant="ghost" size="sm" onClick={() => onPropertySelect(null)} className="h-6 w-6 p-0">
                ×
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {selectedProperty.location.city}, {selectedProperty.location.region}
            </p>
            <p className="text-xs mb-3">{selectedProperty.description}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-green-600">{formatPrice(selectedProperty.price)}</span>
              <div className="flex items-center gap-2 text-xs">
                {selectedProperty.features.bedrooms && <span>{selectedProperty.features.bedrooms} hab</span>}
                {selectedProperty.features.bathrooms && <span>{selectedProperty.features.bathrooms} baños</span>}
                <span>{selectedProperty.features.area}m²</span>
              </div>
            </div>
            {selectedProperty.featured && (
              <Badge className="mt-2 bg-red-500">
                <Heart className="h-3 w-3 mr-1" />
                Destacada
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
