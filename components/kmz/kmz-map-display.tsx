"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Eye, EyeOff, MapPin, Maximize, Minimize } from "lucide-react"
import type { KMZData } from "@/lib/kmz/kmz-reader"
import { reverseGeocoder, type ChileanLocationDetails } from "@/lib/geocoding/reverse-geocode"
import { Button } from "@/components/ui/button"

interface KMZMapDisplayProps {
  kmzFiles?: KMZData[]
  height?: string
  centerCoordinates?: { lat: number; lng: number }
  onPlacemarkSelect?: (placemark: LayerInfo | null) => void
  enableGeocoding?: boolean // Add option to disable geocoding for performance
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

export function KMZMapDisplay({
  kmzFiles = [],
  height = "600px",
  centerCoordinates,
  onPlacemarkSelect,
  enableGeocoding = true, // Re-enabled by default for location details
}: KMZMapDisplayProps) {
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoadingLayers, setIsLoadingLayers] = useState(false)
  const [layerProgress, setLayerProgress] = useState(0)
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null) // track selected layer
  const mapRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const clientMarkerRef = useRef<any>(null)
  const currentKmzDataRef = useRef<string>("")
  const isProcessingRef = useRef<boolean>(false)
  const renderQueueRef = useRef<any[]>([])
  const geocodingQueueRef = useRef<Array<{ lat: number; lng: number; callback: (details: any) => void }>>([])
  const activeGeocodingRef = useRef<number>(0)
  const maxConcurrentGeocoding = 5

  const safeKmzFiles = Array.isArray(kmzFiles) ? kmzFiles : []

  console.log("[v0] KMZMapDisplay received", safeKmzFiles.length, "KMZ files")

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

        const topoLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenTopoMap contributors",
          maxZoom: 17,
          updateWhenIdle: true,
          keepBuffer: 2,
        })

        // Add default layer
        osmLayer.addTo(map)

        const baseLayers = {
          Calles: osmLayer,
          Satélite: satelliteLayer,
          Topográfico: topoLayer,
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

  const processGeocodingQueue = async () => {
    while (geocodingQueueRef.current.length > 0 && activeGeocodingRef.current < maxConcurrentGeocoding) {
      const item = geocodingQueueRef.current.shift()
      if (!item) break

      activeGeocodingRef.current++
      reverseGeocoder
        .getLocationDetails(item.lat, item.lng)
        .then((details) => {
          item.callback(details)
        })
        .catch((error) => {
          console.error("[v0] Geocoding error:", error)
        })
        .finally(() => {
          activeGeocodingRef.current--
          if (geocodingQueueRef.current.length > 0) {
            processGeocodingQueue()
          }
        })
    }
  }

  const renderPlacemarksInChunks = async (placemarks: any[], allBounds: any[], newLayers: LayerInfo[]) => {
    const chunkSize = 50
    const L = (window as any).L

    const processChunk = (startIndex: number) => {
      return new Promise<void>((resolve) => {
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(
            () => {
              const endIndex = Math.min(startIndex + chunkSize, placemarks.length)
              console.log(`[v0] Processing placemarks chunk ${startIndex}-${endIndex}/${placemarks.length}`)

              for (let i = startIndex; i < endIndex; i++) {
                const placemark = placemarks[i]
                const kmzData = placemark._kmzData // Get kmzData from placemark
                const color = getColorForPlacemark(kmzData.fileName, placemark.name)

                if (placemark.type === "Point" && placemark.coordinates.length > 0) {
                  const [lng, lat] = placemark.coordinates[0]

                  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.warn(`[v0] Invalid coordinates for ${placemark.name}`)
                    continue
                  }

                  const marker = L.marker([lat, lng], { isKMZ: true }).addTo(mapInstance)

                  marker.bindPopup(`
                    <div style="min-width: 250px;">
                      <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
                      <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
                      <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                      <div id="location-details-${placemark.name}" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0; font-size: 11px; color: #666;">Cargando información de ubicación...</p>
                      </div>
                      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>📁 Documentación:</strong></p>
                        <a href="/documentacion/campos/${encodeURIComponent(kmzData.fileName.replace(".kmz", "").replace(".kml", ""))}" 
                           target="_blank"
                           style="color: #6B8E7A; text-decoration: none; font-size: 11px; display: inline-block; padding: 4px 8px; background: #f0f4f0; border-radius: 4px; margin-top: 4px;">
                          Ver carpeta de documentos →
                        </a>
                      </div>
                      ${placemark.description ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #666;">${placemark.description.substring(0, 100)}...</p>` : ""}
                    </div>
                  `)

                  allBounds.push([lat, lng])

                  const layerInfo: LayerInfo = {
                    name: placemark.name,
                    fileName: kmzData.fileName,
                    layer: marker,
                    visible: true,
                    color,
                    bounds: [[lat, lng]],
                    isLoadingLocation: enableGeocoding,
                  }

                  newLayers.push(layerInfo)

                  // Only geocode if enabled
                  if (enableGeocoding) {
                    geocodingQueueRef.current.push({
                      lat,
                      lng,
                      callback: (details) => {
                        layerInfo.locationDetails = details
                        layerInfo.isLoadingLocation = false
                        marker.setPopupContent(buildPopupContent(placemark, kmzData, color, lat, lng, details))
                        setLayers([...newLayers])
                      },
                    })
                  }
                } else if (
                  (placemark.type === "LineString" || placemark.type === "Polygon") &&
                  placemark.coordinates.length > 1
                ) {
                  const leafletCoords = placemark.coordinates
                    .filter(
                      ([lng, lat]: [number, number]) =>
                        !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180,
                    )
                    .map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])

                  if (leafletCoords.length < 2) continue

                  let shape: any
                  if (placemark.type === "Polygon") {
                    shape = L.polygon(leafletCoords, {
                      color,
                      weight: 2,
                      opacity: 0.8,
                      fillColor: color,
                      fillOpacity: 0.3,
                      isKMZ: true,
                    }).addTo(mapInstance)
                  } else {
                    shape = L.polyline(leafletCoords, {
                      color,
                      weight: 3,
                      opacity: 0.8,
                      isKMZ: true,
                    }).addTo(mapInstance)
                  }

                  allBounds.push(...leafletCoords)

                  const layerInfo: LayerInfo = {
                    name: placemark.name,
                    fileName: kmzData.fileName,
                    layer: shape,
                    visible: true,
                    color,
                    bounds: leafletCoords,
                    isLoadingLocation: enableGeocoding,
                  }

                  newLayers.push(layerInfo)

                  // Calculate center of polygon/polyline for popup and geocoding
                  const centerLat = leafletCoords.reduce((sum, coord) => sum + coord[0], 0) / leafletCoords.length
                  const centerLng = leafletCoords.reduce((sum, coord) => sum + coord[1], 0) / leafletCoords.length

                  // Add a pin/marker at the center of the polygon for easy identification
                  if (placemark.type === "Polygon") {
                    const pinIcon = L.divIcon({
                      html: `<div style="
                        background-color: ${color};
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        cursor: pointer;
                      "></div>`,
                      iconSize: [16, 16],
                      className: "kmz-polygon-pin",
                    })

                    const pinMarker = L.marker([centerLat, centerLng], {
                      icon: pinIcon,
                      title: placemark.name,
                      zIndexOffset: 1000,
                    }).addTo(mapInstance)

                    // Clicking the pin also opens the polygon popup
                    pinMarker.on("click", () => {
                      shape.openPopup()
                    })
                  }

                  // Bind popup to shape
                  const popupContent = `
                    <div style="min-width: 250px;">
                      <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
                      <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
                      <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Tipo:</strong> ${placemark.type}</p>
                      <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas (centro):</strong> ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}</p>
                      <div id="location-details-${placemark.name}" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0; font-size: 11px; color: #666;">Cargando información de ubicación...</p>
                      </div>
                      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>📁 Documentación:</strong></p>
                        <a href="/documentacion/campos/${encodeURIComponent(kmzData.fileName.replace(".kmz", "").replace(".kml", ""))}" 
                           target="_blank"
                           style="color: #6B8E7A; text-decoration: none; font-size: 11px; display: inline-block; padding: 4px 8px; background: #f0f4f0; border-radius: 4px; margin-top: 4px;">
                          Ver carpeta de documentos →
                        </a>
                      </div>
                      ${placemark.description ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #666;">${placemark.description.substring(0, 100)}...</p>` : ""}
                    </div>
                  `

                  shape.bindPopup(popupContent)

                  // Only geocode if enabled
                  if (enableGeocoding) {
                    geocodingQueueRef.current.push({
                      lat: centerLat,
                      lng: centerLng,
                      callback: (details) => {
                        layerInfo.locationDetails = details
                        layerInfo.isLoadingLocation = false
                        shape.setPopupContent(buildPopupContent(placemark, kmzData, color, centerLat, centerLng, details))
                        setLayers([...newLayers])
                      },
                    })
                  }
                }
              }

              setLayerProgress(Math.round((endIndex / placemarks.length) * 100))
              setLayers([...newLayers])

              if (endIndex < placemarks.length) {
                processChunk(endIndex).then(() => resolve())
              } else {
                resolve()
              }
            },
            { timeout: 1000 },
          )
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(async () => {
            await processChunk(startIndex)
          }, 10)
        }
      })
    }

    await processChunk(0)
  }

  const buildPopupContent = (
    placemark: any,
    kmzData: any,
    color: string,
    lat: number,
    lng: number,
    details?: ChileanLocationDetails,
  ) => {
    const locationHtml = details
      ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
        ${details.region ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Región:</strong> ${details.region}</p>` : ""}
        ${details.provincia ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Provincia:</strong> ${details.provincia}</p>` : ""}
        ${details.comuna ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Comuna:</strong> ${details.comuna}</p>` : ""}
        ${details.nearbyCities && details.nearbyCities.length > 0 ? `<p style="margin: 0 0 3px 0; font-size: 11px; color: #666;"><strong>Cerca de:</strong> ${details.nearbyCities.join(", ")}</p>` : ""}
      </div>
    `
      : `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;"><p style="margin: 0; font-size: 11px; color: #666;">Cargando información de ubicación...</p></div>`

    return `
      <div style="min-width: 250px;">
        <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        ${locationHtml}
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>📁 Documentación:</strong></p>
          <a href="/documentacion/campos/${encodeURIComponent(kmzData.fileName.replace(".kmz", "").replace(".kml", ""))}" 
             target="_blank"
             style="color: #6B8E7A; text-decoration: none; font-size: 11px; display: inline-block; padding: 4px 8px; background: #f0f4f0; border-radius: 4px; margin-top: 4px;">
            Ver carpeta de documentos →
          </a>
        </div>
        ${placemark.description ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #666; padding-top: 8px; border-top: 1px solid #e0e0e0;">${placemark.description.substring(0, 100)}...</p>` : ""}
      </div>
    `
  }

  useEffect(() => {
    if (!mapInstance || !safeKmzFiles || safeKmzFiles.length === 0) {
      console.log("[v0] Map not ready or no KMZ files")
      return
    }

    const kmzDataHash = JSON.stringify(
      safeKmzFiles.map((f) => ({
        fileName: f.fileName,
        placemarkCount: f.placemarks?.length || 0,
      })),
    )

    if (isProcessingRef.current || currentKmzDataRef.current === kmzDataHash) {
      console.log("[v0] Skipping duplicate render")
      return
    }

    isProcessingRef.current = true
    currentKmzDataRef.current = kmzDataHash
    setIsLoadingLayers(true)
    setLayerProgress(0)

    const L = (window as any).L
    if (!L) {
      isProcessingRef.current = false
      return
    }

    console.log("[v0] Starting chunked KMZ rendering...")

    // Clear existing KMZ layers
    mapInstance.eachLayer((layer: any) => {
      if (layer.options && layer.options.isKMZ) {
        mapInstance.removeLayer(layer)
      }
    })

    const allBounds: any[] = []
    const newLayers: LayerInfo[] = []

    // Process each KMZ file
    const allPlacemarks = safeKmzFiles.flatMap((kmzData) => {
      if (!kmzData.placemarks || !Array.isArray(kmzData.placemarks)) {
        return []
      }
      return kmzData.placemarks.map((p) => ({ ...p, _kmzData: kmzData }))
    })

    console.log("[v0] Total placemarks to render:", allPlacemarks.length)

    renderPlacemarksInChunks(allPlacemarks, allBounds, newLayers).then(() => {
      console.log("[v0] Placemark rendering complete, finalizing...")
      if (enableGeocoding) {
        processGeocodingQueue()
      }

      setLayers(newLayers)
      setIsLoadingLayers(false)
      isProcessingRef.current = false

      if (allBounds.length > 0) {
        try {
          const bounds = L.latLngBounds(allBounds)
          mapInstance.fitBounds(bounds, { padding: [50, 50] })
          console.log("[v0] Map bounds fitted")
        } catch (error) {
          console.warn("[v0] Error fitting bounds:", error)
        }
      }
    })
  }, [mapInstance, safeKmzFiles])

  useEffect(() => {
    if (!mapInstance || !centerCoordinates) return

    const L = (window as any).L
    if (!L) return

    console.log("[v0] Centering map on coordinates:", centerCoordinates)

    if (clientMarkerRef.current) {
      mapInstance.removeLayer(clientMarkerRef.current)
    }

    const clientIcon = L.divIcon({
      className: "custom-client-marker",
      html: `
        <div style="
          background-color: #3b82f6;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    const marker = L.marker([centerCoordinates.lat, centerCoordinates.lng], {
      icon: clientIcon,
      zIndexOffset: 1000,
    }).addTo(mapInstance)

    marker
      .bindPopup(`
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #3b82f6; font-weight: bold;">Ubicación del Cliente</h4>
        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas:</strong> ${centerCoordinates.lat.toFixed(6)}, ${centerCoordinates.lng.toFixed(6)}</p>
      </div>
    `)
      .openPopup()

    clientMarkerRef.current = marker

    mapInstance.flyTo([centerCoordinates.lat, centerCoordinates.lng], 13, {
      duration: 1.5,
      easeLinearity: 0.25,
    })

    if (!document.getElementById("client-marker-styles")) {
      const style = document.createElement("style")
      style.id = "client-marker-styles"
      style.textContent = `
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [mapInstance, centerCoordinates])

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

      if (layer.layer.openPopup) {
        layer.layer.openPopup()
      }
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (mapInstance) {
        setTimeout(() => {
          mapInstance.invalidateSize()
        }, 100)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [mapInstance])

  const getColorForPlacemark = (fileName: string, placemarkName: string): string => {
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
      "#8e44ad", // wisteria
      "#d35400", // pumpkin
      "#c0392b", // pomegranate
      "#bdc3c7", // silver
      "#7f8c8d", // asbestos
      "#34495e", // wet asphalt
    ]

    const str = `${fileName}-${placemarkName}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }

    const colorIndex = Math.abs(hash) % colors.length
    return colors[colorIndex]
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
    <>
      {mapError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{mapError}</p>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex w-full h-full relative pr-96"
        style={{ height: isFullscreen ? "100vh" : height || "100%" }}
      >
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 left-4 z-[1000] shadow-lg"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>

        <div ref={mapRef} className="flex-1 h-full rounded-lg overflow-hidden border pointer-events-auto" />

        <div className="absolute inset-y-0 right-0 w-96 flex flex-col pointer-events-none bg-white border-l shadow-lg z-[200]">
          {/* Capas del Mapa section */}
          <div className="flex-1 border-b overflow-y-auto pointer-events-auto">
            <div className="p-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm mb-3">
                <MapPin className="h-4 w-4" />
                Capas del Mapa ({layers.length})
              </h3>

              {isLoadingLayers && (
                <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  Cargando capas: {layerProgress}%
                </div>
              )}

              {layers.length === 0 ? (
                <p className="text-xs text-gray-500">No hay capas cargadas</p>
              ) : (
                <div className="space-y-1.5">
                  {layers.map((layer, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        zoomToLayer(index)
                        setSelectedLayer(layer)
                        onPlacemarkSelect?.(layer)
                      }}
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedLayer?.name === layer.name
                          ? "bg-blue-50 border-blue-300"
                          : "bg-card hover:bg-accent/70 border-gray-200"
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded flex-shrink-0 mt-0.5 border border-gray-300"
                        style={{ backgroundColor: layer.color }}
                        title={`Color: ${layer.color}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{layer.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{layer.fileName}</p>
                        {layer.isLoadingLocation && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Cargando ubicación...</p>
                        )}
                        {layer.locationDetails && !layer.isLoadingLocation && (
                          <div className="mt-1 space-y-0.5">
                            {layer.locationDetails.comuna && (
                              <p className="text-[10px] text-muted-foreground">📍 {layer.locationDetails.comuna}</p>
                            )}
                            {layer.locationDetails.region && (
                              <p className="text-[10px] text-muted-foreground">
                                {layer.locationDetails.region.replace("Región de ", "")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLayerVisibility(index)
                          }}
                          title={layer.visible ? "Ocultar" : "Mostrar"}
                        >
                          {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            zoomToLayer(index)
                          }}
                          title="Centrar en mapa"
                        >
                          <MapPin className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalles del Pinpoint section */}
          {selectedLayer && (
            <div className="h-64 p-4 overflow-y-auto bg-slate-50 border-t">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Detalles
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="font-medium text-gray-700">{selectedLayer.name}</p>
                  <p className="text-gray-600">Archivo: {selectedLayer.fileName}</p>
                </div>
                {selectedLayer.locationDetails && (
                  <>
                    {selectedLayer.locationDetails.region && (
                      <div className="pt-2 border-t">
                        <p className="font-medium text-gray-700">Región</p>
                        <p className="text-gray-600">{selectedLayer.locationDetails.region}</p>
                      </div>
                    )}
                    {selectedLayer.locationDetails.provincia && (
                      <div className="pt-2 border-t">
                        <p className="font-medium text-gray-700">Provincia</p>
                        <p className="text-gray-600">{selectedLayer.locationDetails.provincia}</p>
                      </div>
                    )}
                    {selectedLayer.locationDetails.comuna && (
                      <div className="pt-2 border-t">
                        <p className="font-medium text-gray-700">Comuna</p>
                        <p className="text-gray-600">{selectedLayer.locationDetails.comuna}</p>
                      </div>
                    )}
                    {selectedLayer.locationDetails.nearbyCities &&
                      selectedLayer.locationDetails.nearbyCities.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="font-medium text-gray-700">Ciudades Cercanas</p>
                          <p className="text-gray-600">{selectedLayer.locationDetails.nearbyCities.join(", ")}</p>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
