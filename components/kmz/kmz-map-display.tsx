'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface KMZData {
  id: string
  name: string
  file_name: string
  region: string
  placemarks_count: number
  bounds?: [[number, number], [number, number]]
}

interface KMZMapDisplayProps {
  kmzFiles?: KMZData[]
  height?: string
  centerCoordinates?: { lat: number; lng: number }
  enableGeocoding?: boolean
  selectedKmzId?: string | null
}

export function KMZMapDisplay({
  kmzFiles = [],
  height = '600px',
  centerCoordinates,
  enableGeocoding = true,
  selectedKmzId = null,
}: KMZMapDisplayProps) {
  const [mapError, setMapError] = useState<string | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Filter KMZ files based on selectedKmzId
  const displayedKmzFiles = selectedKmzId
    ? kmzFiles.filter((kmz) => kmz.id === selectedKmzId)
    : kmzFiles

  useEffect(() => {
    // Load Leaflet CSS and JS
    if (typeof window !== 'undefined' && !leafletLoaded) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      script.onload = () => setLeafletLoaded(true)
      document.body.appendChild(script)
    }
  }, [leafletLoaded])

  if (mapError) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <p className="text-sm text-red-800">{mapError}</p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="w-full bg-gray-100 rounded-lg overflow-hidden">
      <div id="map" style={{ height: '100%', width: '100%' }} />
      <div className="p-2 text-xs text-gray-600 bg-white border-t">
        {selectedKmzId ? (
          <span>
            Mostrando: <strong>{displayedKmzFiles[0]?.file_name || 'KMZ'}</strong> ({displayedKmzFiles[0]?.placemarks_count || 0} puntos)
          </span>
        ) : (
          <span>
            Capas del Mapa: <strong>{kmzFiles.length}</strong> archivos
          </span>
        )}
      </div>
    </div>
  )
}
