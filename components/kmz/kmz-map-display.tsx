"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"
import type { KMZData } from "@/lib/kmz/kmz-reader"

interface KMZMapDisplayProps {
  kmzFiles: KMZData[]
  height?: string
}

export function KMZMapDisplay({ kmzFiles, height = "600px" }: KMZMapDisplayProps) {
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
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
    let totalPlacemarks = 0

    kmzFiles.forEach((kmzData, kmzIndex) => {
      const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"]
      const color = colors[kmzIndex % colors.length]

      console.log("[v0] Processing KMZ file:", kmzData.fileName, "with", kmzData.placemarks.length, "placemarks")

      kmzData.placemarks.forEach((placemark, placemarkIndex) => {
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

          // Validate coordinates
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

          allBounds.push([lat, lng])
          totalPlacemarks++
        } else if (
          (placemark.type === "LineString" || placemark.type === "Polygon") &&
          placemark.coordinates.length > 1
        ) {
          // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
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
              weight: 2,
              opacity: 0.8,
              fillColor: color,
              fillOpacity: 0.2,
              isKMZ: true,
            }).addTo(mapInstance)
          } else {
            shape = L.polyline(leafletCoords, {
              color: color,
              weight: 3,
              opacity: 0.8,
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
          totalPlacemarks++
        }
      })
    })

    console.log("[v0] Added", totalPlacemarks, "placemarks to map")

    // Fit map to show all KMZ data
    if (allBounds.length > 0) {
      try {
        const bounds = L.latLngBounds(allBounds)
        mapInstance.fitBounds(bounds, { padding: [20, 20] })
        console.log("[v0] Map bounds fitted to show all data")
      } catch (error) {
        console.warn("[v0] Error fitting bounds:", error)
      }
    }
  }, [mapInstance, kmzFiles])

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

  return <div ref={mapRef} className="w-full h-full" style={{ height }} />
}
