"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Eye, EyeOff, MapPin, ChevronLeft, ChevronRight, Layers } from "lucide-react"
import type { KMZData } from "@/lib/kmz/kmz-reader"
import { reverseGeocoder, type ChileanLocationDetails } from "@/lib/geocoding/reverse-geocode"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface KMZMapDisplayProps {
  kmzFiles: KMZData[]
  height?: string
  center?: { lat: number; lng: number; zoom?: number }
}

interface LayerInfo {
  name: string
  fileName: string
  layer: any
  visible: boolean
  color: string
  bounds: any[]
  locationDetails?: ChileanLocationDetails
  isLoadingLocation?: boolean
}

export function KMZMapDisplay({ kmzFiles, height = "600px", center }: KMZMapDisplayProps) {
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [legendCollapsed, setLegendCollapsed] = useState(false)
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
          zoomControl: false, // Disable default zoom control to add custom one
        })

        const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
          updateWhenIdle: true,
          keepBuffer: 2,
        })

        const satelliteLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "© Esri",
            maxZoom: 19,
            updateWhenIdle: true,
            keepBuffer: 2,
          },
        )

        // Add default layer
        osmLayer.addTo(map)

        const baseLayers = {
          Calles: osmLayer,
          Satélite: satelliteLayer,
        }

        L.control.layers(baseLayers, null, { position: "topright" }).addTo(map)

        L.control
          .zoom({
            position: "topright",
          })
          .addTo(map)

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
            <div style="min-width: 250px;">
              <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
              <div id="location-details-${placemarkIndex}" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; font-size: 11px; color: #666;">Cargando información de ubicación...</p>
              </div>
              ${placemark.description ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #666;">${placemark.description.substring(0, 100)}...</p>` : ""}
            </div>
          `)

          const bounds = [[lat, lng]]
          allBounds.push([lat, lng])

          const layerInfo: LayerInfo = {
            name: placemark.name,
            fileName: kmzData.fileName,
            layer: marker,
            visible: true,
            color: color,
            bounds: bounds,
            isLoadingLocation: true,
          }

          newLayers.push(layerInfo)

          reverseGeocoder
            .getLocationDetails(lat, lng)
            .then((details) => {
              layerInfo.locationDetails = details
              layerInfo.isLoadingLocation = false

              // Update popup with location details
              const locationHtml = `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                ${details.region ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Región:</strong> ${details.region}</p>` : ""}
                ${details.provincia ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Provincia:</strong> ${details.provincia}</p>` : ""}
                ${details.comuna ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Comuna:</strong> ${details.comuna}</p>` : ""}
                ${details.city ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Ciudad:</strong> ${details.city}</p>` : ""}
                ${details.nearbyCities && details.nearbyCities.length > 0 ? `<p style="margin: 0 0 3px 0; font-size: 11px; color: #666;"><strong>Cerca de:</strong> ${details.nearbyCities.join(", ")}</p>` : ""}
              </div>
            `

              marker.setPopupContent(`
              <div style="min-width: 250px;">
                <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
                <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                ${locationHtml}
                ${placemark.description ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #666; padding-top: 8px; border-top: 1px solid #e0e0e0;">${placemark.description.substring(0, 100)}...</p>` : ""}
              </div>
            `)

              // Trigger re-render
              setLayers([...newLayers])
            })
            .catch((error) => {
              console.error("[v0] Error fetching location details:", error)
              layerInfo.isLoadingLocation = false
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

          const centerLat = leafletCoords.reduce((sum, coord) => sum + coord[0], 0) / leafletCoords.length
          const centerLng = leafletCoords.reduce((sum, coord) => sum + coord[1], 0) / leafletCoords.length

          shape.bindPopup(`
            <div style="min-width: 250px;">
              <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Tipo:</strong> ${placemark.type}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Puntos:</strong> ${leafletCoords.length}</p>
              <div id="location-details-${placemarkIndex}" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; font-size: 11px; color: #666;">Cargando información de ubicación...</p>
              </div>
              ${placemark.description ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #666;">${placemark.description.substring(0, 100)}...</p>` : ""}
            </div>
          `)

          allBounds.push(...leafletCoords)

          const layerInfo: LayerInfo = {
            name: placemark.name,
            fileName: kmzData.fileName,
            layer: shape,
            visible: true,
            color: color,
            bounds: leafletCoords,
            isLoadingLocation: true,
          }

          newLayers.push(layerInfo)

          reverseGeocoder
            .getLocationDetails(centerLat, centerLng)
            .then((details) => {
              layerInfo.locationDetails = details
              layerInfo.isLoadingLocation = false

              const locationHtml = `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                ${details.region ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Región:</strong> ${details.region}</p>` : ""}
                ${details.provincia ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Provincia:</strong> ${details.provincia}</p>` : ""}
                ${details.comuna ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Comuna:</strong> ${details.comuna}</p>` : ""}
                ${details.nearbyCities && details.nearbyCities.length > 0 ? `<p style="margin: 0 0 3px 0; font-size: 11px; color: #666;"><strong>Cerca de:</strong> ${details.nearbyCities.join(", ")}</p>` : ""}
              </div>
            `

              shape.setPopupContent(`
              <div style="min-width: 250px;">
                <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
                <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Tipo:</strong> ${placemark.type}</p>
                <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Puntos:</strong> ${leafletCoords.length}</p>
                ${locationHtml}
                ${placemark.description ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #666; padding-top: 8px; border-top: 1px solid #e0e0e0;">${placemark.description.substring(0, 100)}...</p>` : ""}
              </div>
            `)

              setLayers([...newLayers])
            })
            .catch((error) => {
              console.error("[v0] Error fetching location details:", error)
              layerInfo.isLoadingLocation = false
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

  useEffect(() => {
    if (!mapInstance || !center) return

    const L = (window as any).L
    if (!L) return

    console.log("[v0] Zooming map to center:", center)

    // Fly to the new center with animation
    mapInstance.flyTo([center.lat, center.lng], center.zoom || 13, {
      duration: 1.5,
      easeLinearity: 0.25,
    })
  }, [mapInstance, center])

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

  const layersByFile = layers.reduce(
    (acc, layer) => {
      if (!acc[layer.fileName]) {
        acc[layer.fileName] = []
      }
      acc[layer.fileName].push(layer)
      return acc
    },
    {} as Record<string, LayerInfo[]>,
  )

  const visibleLayersCount = layers.filter((l) => l.visible).length

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />

      {layers.length > 0 && (
        <div
          className={`absolute top-4 bottom-4 transition-all duration-300 z-[1000] ${
            legendCollapsed
              ? "right-2 w-14" // Keep visible at right edge when collapsed
              : "right-4 w-80" // Normal position when expanded
          }`}
        >
          <Card className="h-full shadow-xl border-2 flex flex-col">
            {legendCollapsed ? (
              <div className="flex flex-col items-center justify-between h-full gap-2 p-2 bg-background">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setLegendCollapsed(false)}
                  className="h-10 w-10 p-0 shadow-md"
                  title="Mostrar leyenda"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex flex-col items-center gap-3 flex-1 justify-center">
                  <Layers className="h-6 w-6 text-primary" />
                  <div className="writing-mode-vertical text-xs font-medium text-muted-foreground">CAPAS</div>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {visibleLayersCount}/{layers.length}
                  </Badge>
                </div>
                <div className="h-10" /> {/* Spacer for balance */}
              </div>
            ) : (
              <>
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-sm">Capas del Mapa</h3>
                      <p className="text-xs text-muted-foreground">
                        {visibleLayersCount} de {layers.length} visible{layers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLegendCollapsed(true)}
                    className="h-8 w-8 p-0"
                    title="Ocultar leyenda"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-4">
                    {Object.entries(layersByFile).map(([fileName, fileLayers]) => (
                      <div key={fileName} className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-primary truncate" title={fileName}>
                              {fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fileLayers.filter((l) => l.visible).length}/{fileLayers.length} capas
                            </p>
                          </div>
                        </div>

                        {fileLayers.map((layer, index) => {
                          const globalIndex = layers.indexOf(layer)
                          return (
                            <div
                              key={globalIndex}
                              className={`group rounded-lg border-2 transition-all ${
                                layer.visible
                                  ? "bg-card border-border hover:border-primary/50"
                                  : "bg-muted/50 border-muted opacity-60"
                              }`}
                            >
                              <div className="p-2.5">
                                <div className="flex items-start gap-2 mb-2">
                                  <div
                                    className="w-6 h-6 rounded border-2 border-white shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: layer.color }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-tight truncate" title={layer.name}>
                                      {layer.name}
                                    </p>
                                  </div>
                                </div>

                                {layer.isLoadingLocation && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>Cargando ubicación...</span>
                                  </div>
                                )}

                                {layer.locationDetails && !layer.isLoadingLocation && (
                                  <div className="space-y-1 mb-2">
                                    {layer.locationDetails.comuna && (
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                                        <p className="text-xs font-medium truncate">{layer.locationDetails.comuna}</p>
                                      </div>
                                    )}
                                    {layer.locationDetails.region && (
                                      <p className="text-xs text-muted-foreground pl-4.5 truncate">
                                        {layer.locationDetails.region.replace("Región de ", "")}
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-1.5 pt-2 border-t">
                                  <Button
                                    variant={layer.visible ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => toggleLayerVisibility(globalIndex)}
                                  >
                                    {layer.visible ? (
                                      <>
                                        <Eye className="h-3 w-3 mr-1" />
                                        Visible
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Oculta
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 bg-transparent"
                                    onClick={() => zoomToLayer(globalIndex)}
                                    title="Centrar en mapa"
                                  >
                                    <MapPin className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
