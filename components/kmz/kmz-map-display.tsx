'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Eye, EyeOff, Maximize2, AlertCircle } from 'lucide-react'
import { getLocationDetailsFromCoordinates } from '@/lib/location-utils'
import { useKmzData } from '@/hooks/useKmzData'

interface LayerInfo {
  name: string
  fileName: string
  layer: any
  visible: boolean
  color: string
  bounds: any[]
  owner?: string
  kmzId?: string
  placemarks_count?: number
  locationDetails?: ChileanLocationDetails
  isLoadingLocation?: boolean
}

interface ChileanLocationDetails {
  type?: string
  region?: string
  provincia?: string
  comuna?: string
  ciudad?: string
  nearbyCities?: string[]
  lat?: number
  lng?: number
}

export function KmzMapDisplay({
  kmzFiles = [],
  selectedRegion = 'all',
  height = '600px',
  onPlacemarkSelect,
}: {
  kmzFiles?: any[]
  selectedRegion?: string
  height?: string
  onPlacemarkSelect?: (layer: LayerInfo) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null)
  const [ownerInput, setOwnerInput] = useState('')
  const [isSavingOwner, setIsSavingOwner] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoadingLayers, setIsLoadingLayers] = useState(false)
  const [layerProgress, setLayerProgress] = useState(0)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    try {
      const map = L.map(containerRef.current).setView([-30, -71], 4)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      window.addEventListener('fullscreenchange', () => {
        setTimeout(() => map.invalidateSize(), 100)
        setIsFullscreen(document.fullscreenElement !== null)
      })

      return () => window.removeEventListener('fullscreenchange', () => {})
    } catch (err) {
      console.error('[v0] Map initialization error:', err)
      setMapError('Failed to initialize map')
    }
  }, [])

  // Load KMZ files
  useEffect(() => {
    if (!mapRef.current || kmzFiles.length === 0) return

    async function loadKMZFiles() {
      try {
        setIsLoadingLayers(true)
        setLayerProgress(0)
        const newLayers: LayerInfo[] = []
        const totalFiles = kmzFiles.length

        for (let i = 0; i < kmzFiles.length; i++) {
          const kmzData = kmzFiles[i]

          try {
            const response = await fetch(`/api/kmz/parse?id=${kmzData.id}`)
            if (!response.ok) throw new Error('Failed to parse KMZ')

            const geojson = await response.json()
            const featureGroup = L.featureGroup()

            let layerName = kmzData.file_name || 'Unknown Layer'
            let bounds: any[] = []
            let placemarksCount = 0

            if (geojson.features) {
              geojson.features.forEach((feature: any) => {
                const coordinates = feature.geometry?.coordinates
                if (coordinates) {
                  bounds.push(coordinates)
                  placemarksCount++
                }

                const shape = L.geoJSON(feature, {
                  style: { color: '#3b82f6', weight: 2 },
                })

                shape.bindPopup(feature.properties?.name || layerName)

                // Add click handler to shape
                shape.on('click', () => {
                  const centerLat = bounds[Math.floor(bounds.length / 2)]?.[1] || -30
                  const centerLng = bounds[Math.floor(bounds.length / 2)]?.[0] || -71

                  const newLayer: LayerInfo = {
                    name: layerName,
                    fileName: kmzData.file_name,
                    layer: shape,
                    visible: true,
                    color: '#3b82f6',
                    bounds,
                    kmzId: kmzData.id,
                    owner: kmzData.owner,
                    placemarks_count: placemarksCount,
                    locationDetails: {
                      lat: centerLat,
                      lng: centerLng,
                      region: kmzData.region,
                    },
                  }

                  setSelectedLayer(newLayer)
                  onPlacemarkSelect?.(newLayer)
                })

                featureGroup.addLayer(shape)
              })
            }

            const layerInfo: LayerInfo = {
              name: layerName,
              fileName: kmzData.file_name,
              layer: featureGroup,
              visible: true,
              color: '#3b82f6',
              bounds,
              kmzId: kmzData.id,
              owner: kmzData.owner,
              placemarks_count: placemarksCount,
              locationDetails: {
                region: kmzData.region,
                lat: bounds[0]?.[1] || -30,
                lng: bounds[0]?.[0] || -71,
              },
            }

            newLayers.push(layerInfo)
            featureGroup.addTo(mapRef.current!)

            setLayerProgress(Math.round(((i + 1) / totalFiles) * 100))
          } catch (err) {
            console.error(`[v0] Error loading KMZ ${kmzData.id}:`, err)
          }
        }

        setLayers(newLayers)
      } catch (err) {
        console.error('[v0] Error loading KMZ files:', err)
        setMapError('Failed to load KMZ files')
      } finally {
        setIsLoadingLayers(false)
      }
    }

    loadKMZFiles()
  }, [kmzFiles, onPlacemarkSelect])

  // Save owner
  const saveOwner = async () => {
    if (!selectedLayer?.kmzId || !ownerInput.trim()) return

    setIsSavingOwner(true)
    try {
      const response = await fetch('/api/kmz/update-owner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kmzId: selectedLayer.kmzId, owner: ownerInput.trim() }),
      })

      if (!response.ok) throw new Error('Failed to save owner')

      setSelectedLayer((prev) =>
        prev ? { ...prev, owner: ownerInput.trim() } : null
      )

      console.log('[v0] Owner saved:', ownerInput)
    } catch (error) {
      console.error('[v0] Error saving owner:', error)
    } finally {
      setIsSavingOwner(false)
    }
  }

  // Update owner input when selected layer changes
  useEffect(() => {
    if (selectedLayer?.owner) {
      setOwnerInput(selectedLayer.owner)
    } else {
      setOwnerInput('')
    }
  }, [selectedLayer])

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

  return (
    <>
      <div
        ref={containerRef}
        className="flex w-full h-full relative"
        style={{ height: isFullscreen ? '100vh' : height || '100%' }}
      >
        {/* Map container */}
        <div className="flex-1 relative z-10">
          {mapError && (
            <div className="absolute top-4 left-4 z-[400] bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{mapError}</p>
            </div>
          )}

          {isLoadingLayers && (
            <div className="absolute top-4 left-4 z-[400] bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">Cargando capas: {layerProgress}%</p>
            </div>
          )}

          {/* Fullscreen button */}
          <Button
            size="sm"
            className="absolute top-4 right-4 z-[400]"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Details Panel */}
        {selectedLayer && (
          <div className="w-96 bg-white border-l shadow-lg flex flex-col overflow-hidden z-[200]">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Detalles del KMZ
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* File info */}
              <div>
                <p className="font-semibold text-gray-900">{selectedLayer.name}</p>
                <p className="text-xs text-gray-500 mt-1">Archivo: {selectedLayer.fileName}</p>
              </div>

              {/* Location details */}
              {selectedLayer.locationDetails && (
                <>
                  {selectedLayer.locationDetails.region && (
                    <div className="pt-3 border-t">
                      <p className="font-medium text-gray-700 mb-1">Región</p>
                      <p className="text-sm text-gray-600">{selectedLayer.locationDetails.region}</p>
                    </div>
                  )}

                  {selectedLayer.locationDetails.provincia && (
                    <div className="pt-3 border-t">
                      <p className="font-medium text-gray-700 mb-1">Provincia</p>
                      <p className="text-sm text-gray-600">{selectedLayer.locationDetails.provincia}</p>
                    </div>
                  )}

                  {selectedLayer.locationDetails.comuna && (
                    <div className="pt-3 border-t">
                      <p className="font-medium text-gray-700 mb-1">Comuna</p>
                      <p className="text-sm text-gray-600">{selectedLayer.locationDetails.comuna}</p>
                    </div>
                  )}

                  {selectedLayer.locationDetails.ciudad && (
                    <div className="pt-3 border-t">
                      <p className="font-medium text-gray-700 mb-1">Ciudad</p>
                      <p className="text-sm text-gray-600">{selectedLayer.locationDetails.ciudad}</p>
                    </div>
                  )}

                  {selectedLayer.locationDetails.nearbyCities && selectedLayer.locationDetails.nearbyCities.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="font-medium text-gray-700 mb-1">Ciudades Cercanas</p>
                      <p className="text-sm text-gray-600">{selectedLayer.locationDetails.nearbyCities.join(', ')}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <p className="font-medium text-gray-700 mb-1">Ubicación</p>
                    <p className="text-xs text-gray-600">Lat: {selectedLayer.locationDetails.lat?.toFixed(6)}</p>
                    <p className="text-xs text-gray-600">Lng: {selectedLayer.locationDetails.lng?.toFixed(6)}</p>
                  </div>
                </>
              )}

              {/* Owner field */}
              <div className="pt-3 border-t">
                <p className="font-medium text-gray-700 mb-2">Propietario</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingresar propietario..."
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={saveOwner}
                    disabled={isSavingOwner || !ownerInput.trim()}
                  >
                    {isSavingOwner ? '...' : 'Guardar'}
                  </Button>
                </div>
                {selectedLayer.owner && (
                  <p className="text-xs text-green-600 mt-2">✓ Propietario: {selectedLayer.owner}</p>
                )}
              </div>

              {/* Stats */}
              <div className="pt-3 border-t text-xs text-gray-500">
                <p>Puntos de interés: {selectedLayer.placemarks_count || 0}</p>
                <p>Total de capas: {layers.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
