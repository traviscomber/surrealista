'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C9A4',
]

export default function KmzMapViewer({
  kmzFiles,
  centerCoordinates = [-30.6, -71.5],
  enableGeocoding = true,
}: KmzMapViewerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [map, setMap] = useState<L.Map | null>(null)

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return

    const leafletMap = L.map(mapRef.current || 'map', {
      center: centerCoordinates,
      zoom: 6,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }),
      ],
    })

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
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
      }}
      className="leaflet-container"
    />
  )
}
