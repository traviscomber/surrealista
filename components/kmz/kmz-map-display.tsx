'use client'

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2 } from 'lucide-react'

interface KMZFile {
  id: string
  name: string
  bounds: any
  placemarks?: any[]
}

interface KMZMapDisplayProps {
  kmzFiles?: KMZFile[]
  centerCoordinates?: { lat: number; lng: number }
  height?: string
  enableGeocoding?: boolean
  onPlacemarkSelect?: (placemark: any) => void
}

export function KMZMapDisplay({
  kmzFiles = [],
  centerCoordinates = { lat: -35.675, lng: -71.5436 },
  height = '500px',
  enableGeocoding = false,
  onPlacemarkSelect,
}: KMZMapDisplayProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<any>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      // Initialize map
      map.current = L.map(mapContainer.current).setView([centerCoordinates.lat, centerCoordinates.lng], 6)

      // Add base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current)

      // Load KMZ files
      if (kmzFiles.length > 0) {
        kmzFiles.forEach((kmz) => {
          loadKMZToMap(kmz, map.current!)
        })
      }
    } catch (error) {
      console.error('[v0] Error initializing map:', error)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  const loadKMZToMap = (kmz: KMZFile, leafletMap: L.Map) => {
    if (!kmz.bounds) return

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
    const colorIndex = Math.random() * colors.length
    const color = colors[Math.floor(colorIndex)]

    try {
      // Create marker at center of bounds
      const lat = (kmz.bounds.north + kmz.bounds.south) / 2
      const lng = (kmz.bounds.east + kmz.bounds.west) / 2

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: color,
        color: '#000',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .bindPopup(`<strong>${kmz.name}</strong><br/>Puntos: ${kmz.placemarks?.length || 0}`)
        .addTo(leafletMap)

      // Add click handler to open detail panel
      marker.on('click', () => {
        setSelectedLayer({
          name: kmz.name,
          fileName: kmz.name,
          bounds: kmz.bounds,
          placemarks_count: kmz.placemarks?.length || 0,
          locationDetails: {
            region: kmz.region || 'Por determinar',
            provincia: kmz.provincia || '',
            comuna: kmz.comuna || '',
            nearbyCities: kmz.nearbyCities || [],
          },
          lat,
          lng,
        })
        onPlacemarkSelect?.(kmz)
      })

      // Draw boundary rectangle if available
      if (kmz.bounds) {
        const bounds = L.latLngBounds(
          [kmz.bounds.south, kmz.bounds.west],
          [kmz.bounds.north, kmz.bounds.east]
        )
        L.rectangle(bounds, {
          color: color,
          weight: 2,
          opacity: 0.5,
          fill: false,
        }).addTo(leafletMap)
      }
    } catch (error) {
      console.error('[v0] Error loading KMZ:', error)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div
      className={isFullscreen ? 'fixed inset-0 z-[1000]' : 'relative'}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      <div ref={mapContainer} className="w-full h-full rounded-lg border shadow-sm bg-slate-50" />

      {/* Detail Panel - Right Side */}
      <div className="absolute inset-y-0 right-0 w-96 bg-white border-l shadow-lg z-50 pointer-events-none">
        {selectedLayer && (
          <div className="flex flex-col h-full pointer-events-auto overflow-y-auto p-4">
            <h3 className="font-semibold text-lg mb-4">{selectedLayer.name}</h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Ubicación</p>
                <p className="text-gray-600">{selectedLayer.locationDetails?.comuna || 'No especificado'}</p>
              </div>

              {selectedLayer.locationDetails?.region && (
                <div className="border-t pt-3">
                  <p className="font-medium text-gray-700 mb-1">Región</p>
                  <p className="text-gray-600">{selectedLayer.locationDetails.region}</p>
                </div>
              )}

              {selectedLayer.locationDetails?.provincia && (
                <div className="border-t pt-3">
                  <p className="font-medium text-gray-700 mb-1">Provincia</p>
                  <p className="text-gray-600">{selectedLayer.locationDetails.provincia}</p>
                </div>
              )}

              {selectedLayer.locationDetails?.nearbyCities?.length > 0 && (
                <div className="border-t pt-3">
                  <p className="font-medium text-gray-700 mb-1">Ciudades Cercanas</p>
                  <p className="text-gray-600">{selectedLayer.locationDetails.nearbyCities.join(', ')}</p>
                </div>
              )}

              <div className="border-t pt-3">
                <p className="font-medium text-gray-700 mb-1">Coordenadas</p>
                <p className="text-gray-600 text-xs">
                  Lat: {selectedLayer.lat?.toFixed(4)} / Lng: {selectedLayer.lng?.toFixed(4)}
                </p>
              </div>

              <div className="border-t pt-3">
                <p className="font-medium text-gray-700 mb-1">Puntos de Interés</p>
                <p className="text-gray-600">{selectedLayer.placemarks_count}</p>
              </div>
            </div>
          </div>
        )}

        {!selectedLayer && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            <p>Haz click en un KMZ para ver detalles</p>
          </div>
        )}
      </div>

      {/* Fullscreen Button */}
      <div className="absolute top-4 right-4 z-40 pointer-events-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="bg-white shadow-md hover:bg-slate-50"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
