'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface KMZFile {
  name: string
  fileName: string
  region?: string
  [key: string]: any
}

interface Props {
  kmzFiles?: KMZFile[]
  centerCoordinates?: [number, number]
  height?: string
  enableGeocoding?: boolean
  onPlacemarkSelect?: (placemark: any) => void
}

const MapContainer = dynamic(
  () => import('@react-three/fiber').then(m => m),
  { ssr: false, loading: () => <div>Loading map...</div> }
)

export function KMZMapDisplay({
  kmzFiles = [],
  centerCoordinates = [-33.8688, -71.2093],
  height = '100%',
  enableGeocoding = true,
  onPlacemarkSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    try {
      // Dynamically import Leaflet only in client
      const L = require('leaflet')

      // Initialize map if not already done
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView(centerCoordinates, 5)

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapRef.current)
      }

      // Add KMZ files as markers
      if (kmzFiles && kmzFiles.length > 0) {
        kmzFiles.forEach((kmz, index) => {
          // Create a random color for each marker
          const colors = ['red', 'blue', 'green', 'orange', 'purple', 'yellow']
          const color = colors[index % colors.length]

          // Add a marker at a default position (center coordinates adjusted by index)
          const lat = centerCoordinates[0] + (index * 0.1)
          const lng = centerCoordinates[1] + (index * 0.1)

          const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: color,
            color: '#000',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.8,
          })
            .bindPopup(`<strong>${kmz.name}</strong><br/>${kmz.fileName}`)
            .addTo(mapRef.current)

          // Add click handler
          marker.on('click', () => {
            onPlacemarkSelect?.({
              name: kmz.name,
              fileName: kmz.fileName,
              region: kmz.region,
              coordinates: [lat, lng],
            })
          })
        })
      }
    } catch (error) {
      console.error('[v0] Error initializing map:', error)
      setMapError('Error al cargar el mapa')
    }
  }, [kmzFiles, centerCoordinates, onPlacemarkSelect])

  if (mapError) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <p className="text-sm text-red-800">{mapError}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full relative bg-gray-100"
      style={{ height: isFullscreen ? '100vh' : height || '400px' }}
    />
  )
}
