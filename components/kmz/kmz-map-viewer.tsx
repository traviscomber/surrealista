'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Eye, EyeOff, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KMZFile {
  id?: string
  dbId?: number
  name: string
  location?: [number, number]
  placemarks_count?: number
}

interface KmzMapViewerProps {
  kmzFiles: KMZFile[]
  centerCoordinates?: [number, number]
  enableGeocoding?: boolean
  selectedKmzId?: string | null
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C9A4',
]

export default function KmzMapViewer({
  kmzFiles,
  centerCoordinates = [-30.6, -71.5],
  enableGeocoding = true,
  selectedKmzId = null,
}: KmzMapViewerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [map, setMap] = useState<L.Map | null>(null)
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({})

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return

    const mapContainer = document.getElementById('map-container')
    if (!mapContainer) return

    const leafletMap = L.map('map-container', {
      center: centerCoordinates,
      zoom: 6,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }),
      ],
    })

    mapRef.current = leafletMap
    setMap(leafletMap)
  }, [centerCoordinates])

  // Add markers for KMZ files
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    kmzFiles.forEach((file, index) => {
      if (file.location) {
        const color = COLORS[index % COLORS.length]
        const marker = L.circleMarker(file.location, {
          radius: 8,
          fillColor: color,
          color: '#000',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .addTo(map)
          .bindPopup(`<strong>${file.name}</strong><br/>Puntos: ${file.placemarks_count || 0}`)

        markersRef.current.push(marker)
      }
    })

    // Fit bounds if we have markers
    if (markersRef.current.length > 0) {
      const group = new L.FeatureGroup(markersRef.current)
      map.fitBounds(group.getBounds(), { padding: [50, 50] })
    }
  }, [map, kmzFiles])

  return (
    <div className="flex w-full h-full gap-0">
      {/* Map container on the left */}
      <div id="map-container" className="flex-1 h-full relative" />
      
      {/* Layers panel on the right */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Capas del Mapa ({kmzFiles.length})</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {kmzFiles.map((file, index) => {
            const fileId = (file.dbId || file.id)?.toString()
            const isSelected = fileId === selectedKmzId?.toString()
            const color = COLORS[index % COLORS.length]
            
            return (
              <div
                key={fileId || index}
                className={`flex items-start gap-2 p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: color, border: '2px solid #000' }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{file.placemarks_count || 0} puntos</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
