"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Eye, EyeOff, MapPin } from "lucide-react"
import type { KMZData } from "@/lib/kmz/kmz-reader"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface KMZMapDisplayProps {
  kmzFiles: KMZData[]
  height?: string
}

interface LayerInfo {
  name: string
  fileName: string
  layer: any
  visible: boolean
  color: string
  bounds: any[]
}

export function KMZMapDisplay({ kmzFiles, height = "600px" }: KMZMapDisplayProps) {
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const mapRef = useRef<HTMLDivElement>(null)

  console.log("[v0] KMZMapDisplay received", kmzFiles.length, "KMZ files")

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      if ((window as any).L) {
        console.log("[v0] Leaflet already loaded")
        setLeafletLoaded(true)
        return
      }

      try {
        console.log("[v0] Loading Leaflet...")

        // Load Leaflet CSS
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        cssLink.crossOrigin = ""
        document.head.appendChild(cssLink)

        // Load Leaflet JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""

        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("[v0] Leaflet loaded successfully")
            resolve(true)
          }
          script.onerror = (error) => {
            console.error("[v0] Error loading Leaflet:", error)
            reject(error)
          }
          document.head.appendChild(script)
        })

        setLeafletLoaded(true)
      } catch (error) {
        console.error("[v0] Error loading Leaflet:", error)
        setMapError("Error cargando el mapa")
      }
    }

    loadLeaflet()
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstance) return

    const initMap = async () => {
      try {
        const L = (window as any).L
        if (!L) {
          console.error("[v0] Leaflet not available")
          return
        }

        console.log("[v0] Initializing map...")

        // Clear any existing map
        if (mapRef.current) {
          mapRef.current.innerHTML = ""
        }

        // Create map with Chile-focused view
        const map = L.map(mapRef.current, {
          center: [-41.0, -72.5], // Centro de Chile
          zoom: 8,
          zoomControl: true,
        })

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(map)

        console.log("[v0] Map initialized successfully")
        setMapInstance(map)
      } catch (error) {
        console.error("[v0] Error initializing map:", error)
        setMapError("Error inicializando el mapa")
      }
    }

    initMap()
  }, [leafletLoaded, mapInstance])

  useEffect(() => {
    if (!mapInstance || !kmzFiles.length) {
      console.log("[v0] Map not ready or no KMZ files:", { mapInstance: !!mapInstance, kmzFiles: kmzFiles.length })
      return
    }

    const L = (window as any).L
    if (!L) {
      console.error("[v0] Leaflet not available for adding KMZ data")
      return
    }

    console.log("[v0] Adding KMZ data to map...")

    // Clear existing KMZ layers
    mapInstance.eachLayer((layer: any) => {
      if (layer.options && layer.options.isKMZ) {
        mapInstance.removeLayer(layer)
      }
    })

    const allBounds: any[] = []
    const newLayers: LayerInfo[] = []
    const colors = [
      "#e74c3c", // red
      "#3498db", // blue
      "#2ecc71", // green
      "#f39c12", // orange
      "#9b59b6", // purple
      "#1abc9c", // turquoise
      "#e67e22", // carrot
      "#16a085", // green sea
      "#c0392b", // dark red
      "#2980b9", // belize blue
      "#27ae60", // nephritis
      "#f1c40f", // sunflower
    ]

    let placemarkIndex = 0

    kmzFiles.forEach((kmzData, kmzIndex) => {
      console.log("[v0] Processing KMZ file:", kmzData.fileName, "with", kmzData.placemarks.length, "placemarks")

      kmzData.placemarks.forEach((placemark) => {
        const color = colors[placemarkIndex % colors.length]
        placemarkIndex++

        console.log(
          "[v0] Processing placemark:",
          placemark.name,
          "type:",
          placemark.type,
          "coords:",
          placemark.coordinates.length,
        )

        // Handle different geometry types properly
        if (placemark.type === "Point" && placemark.coordinates.length > 0) {
          const [lng, lat] = placemark.coordinates[0]

          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`[v0] Invalid coordinates for ${placemark.name}: [${lng}, ${lat}]`)
            return
          }

          console.log("[v0] Adding point marker at:", [lat, lng])

          const marker = L.marker([lat, lng], {
            isKMZ: true,
          }).addTo(mapInstance)

          marker.bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Tipo:</strong> ${placemark.type}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
              ${placemark.description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">${placemark.description.substring(0, 100)}...</p>` : ""}
            </div>
          `)

          const bounds = [[lat, lng]]
          allBounds.push([lat, lng])

          newLayers.push({
            name: placemark.name,
            fileName: kmzData.fileName,
            layer: marker,
            visible: true,
            color: color,
            bounds: bounds,
          })
        } else if (
          (placemark.type === "LineString" || placemark.type === "Polygon") &&
          placemark.coordinates.length > 1
        ) {
          const leafletCoords = placemark.coordinates
            .filter(([lng, lat]) => !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
            .map(([lng, lat]) => [lat, lng] as [number, number])

          if (leafletCoords.length < 2) {
            console.warn(`[v0] Insufficient valid coordinates for ${placemark.name}`)
            return
          }

          console.log("[v0] Adding", placemark.type, "with", leafletCoords.length, "points")

          let shape: any
          if (placemark.type === "Polygon") {
            shape = L.polygon(leafletCoords, {
              color: color,
              weight: 3,
              opacity: 1,
              fillColor: color,
              fillOpacity: 0.4,
              isKMZ: true,
            }).addTo(mapInstance)
          } else {
            shape = L.polyline(leafletCoords, {
              color: color,
              weight: 4,
              opacity: 1,
              isKMZ: true,
            }).addTo(mapInstance)
          }

          shape.bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Tipo:</strong> ${placemark.type}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Puntos:</strong> ${leafletCoords.length}</p>
              ${placemark.description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">${placemark.description.substring(0, 100)}...</p>` : ""}
            </div>
          `)

          allBounds.push(...leafletCoords)

          newLayers.push({
            name: placemark.name,
            fileName: kmzData.fileName,
            layer: shape,
            visible: true,
            color: color,
            bounds: leafletCoords,
          })
        }
      })
    })

    console.log("[v0] Added", newLayers.length, "placemarks to map")
    setLayers(newLayers)

    // Fit map to show all KMZ data
    if (allBounds.length > 0) {
      try {
        const bounds = L.latLngBounds(allBounds)
        mapInstance.fitBounds(bounds, { padding: [50, 50] })
        console.log("[v0] Map bounds fitted to show all data")
      } catch (error) {
        console.warn("[v0] Error fitting bounds:", error)
      }
    }
  }, [mapInstance, kmzFiles])

  const toggleLayerVisibility = (index: number) => {
    if (!mapInstance) return

    const updatedLayers = [...layers]
    const layer = updatedLayers[index]

    if (layer.visible) {
      mapInstance.removeLayer(layer.layer)
    } else {
      layer.layer.addTo(mapInstance)
    }

    layer.visible = !layer.visible
    setLayers(updatedLayers)
  }

  const zoomToLayer = (index: number) => {
    if (!mapInstance) return

    const L = (window as any).L
    const layer = layers[index]

    if (layer.bounds.length > 0) {
      const bounds = L.latLngBounds(layer.bounds)
      mapInstance.fitBounds(bounds, { padding: [50, 50] })

      // Open popup if available
      if (layer.layer.openPopup) {
        layer.layer.openPopup()
      }
    }
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50" style={{ height }}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{mapError}</p>
        </div>
      </div>
    )
  }

  if (!leafletLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 w-full" style={{ height }}>
      <div ref={mapRef} className="flex-1 h-full rounded-lg overflow-hidden border" />

      {layers.length > 0 && (
        <Card className="w-96 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Capas del Mapa ({layers.length})
          </h3>
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="space-y-2">
              {layers.map((layer, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: layer.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{layer.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{layer.fileName}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleLayerVisibility(index)}
                      title={layer.visible ? "Ocultar" : "Mostrar"}
                    >
                      {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => zoomToLayer(index)}
                      title="Centrar en mapa"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
