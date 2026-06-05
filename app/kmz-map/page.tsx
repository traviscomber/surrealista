'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function KMZMapPage() {
  const searchParams = useSearchParams()
  const kmzId = searchParams.get('kmzId')
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kmzName, setKmzName] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Build query based on whether we're filtering by kmzId
  const { data: locations } = useSWR(
    kmzId ? `/api/kmz/get-by-id?kmzId=${kmzId}` : '/api/kmz/search?q=',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  // If filtering by kmzId, fetch KMZ info
  useEffect(() => {
    if (kmzId && locations?.kmz) {
      setKmzName(locations.kmz.name)
    }
  }, [kmzId, locations])

  // Load Leaflet
  useEffect(() => {
    let mounted = true

    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return

      try {
        if ((window as any).L) {
          setLeafletLoaded(true)
          return
        }

        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        cssLink.crossOrigin = ''
        document.head.appendChild(cssLink)

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''

        await new Promise((resolve, reject) => {
          script.onload = () => {
            if ((window as any).L) {
              resolve(true)
            } else {
              reject(new Error('Leaflet not available'))
            }
          }
          script.onerror = () => reject(new Error('Failed to load Leaflet'))
          document.head.appendChild(script)
        })

        if (mounted) {
          setLeafletLoaded(true)
        }
      } catch (err) {
        console.error('[v0] Error loading Leaflet:', err)
        if (mounted) {
          setError('Error al cargar el mapa')
        }
      }
    }

    loadLeaflet()

    return () => {
      mounted = false
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstance) return

    let mounted = true

    const initMap = () => {
      try {
        const L = (window as any).L
        if (!L) return

        if (mapRef.current) {
          mapRef.current.innerHTML = ''
        }

        const map = L.map(mapRef.current, {
          center: [-41.0, -72.5],
          zoom: 8,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        if (mounted) {
          setMapInstance(map)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[v0] Error initializing map:', err)
        if (mounted) {
          setError('Error al inicializar el mapa')
          setIsLoading(false)
        }
      }
    }

    setTimeout(initMap, 100)

    return () => {
      mounted = false
    }
  }, [leafletLoaded, mapInstance])

  // Add markers
  useEffect(() => {
    if (!mapInstance) return

    const L = (window as any).L
    if (!L) return

    // Get locations based on data structure
    let locationsToShow: any[] = []
    
    if (kmzId && locations?.locations) {
      // Using KMZ-specific API
      locationsToShow = locations.locations
      console.log("[v0] Loaded", locationsToShow.length, "locations from KMZ:", locations.kmz?.name)
    } else if (locations?.results?.length) {
      // Using general search API
      locationsToShow = locations.results.filter((loc: any) => loc.type === 'location')
      console.log("[v0] Loaded", locationsToShow.length, "locations from search API")
    }

    if (locationsToShow.length === 0) return

    const locationsByRegion: Record<string, any[]> = {}

    locationsToShow.forEach((loc: any) => {
      const region = loc.region || 'Sin región'
      if (!locationsByRegion[region]) {
        locationsByRegion[region] = []
      }
      locationsByRegion[region].push(loc)
    })

    const colors: Record<string, string> = {}
    const colorList = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    let colorIndex = 0

    Object.keys(locationsByRegion).forEach((region) => {
      if (!colors[region]) {
        colors[region] = colorList[colorIndex % colorList.length]
        colorIndex++
      }

      locationsByRegion[region].forEach((loc: any) => {
        const marker = L.circleMarker([loc.latitude, loc.longitude], {
          radius: 6,
          fillColor: colors[region],
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapInstance)

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold; color: ${colors[region]};">${loc.name}</h4>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Región:</strong> ${loc.region || 'N/A'}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas:</strong> ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</p>
            ${loc.address ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #666;"><strong>Dirección:</strong> ${loc.address}</p>` : ''}
          </div>
        `)
      })
    })
  }, [mapInstance, locations, kmzId])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-8 w-8" />
            <h1 className="text-4xl font-bold">
              {kmzId && kmzName ? `Ubicaciones: ${kmzName}` : 'Mapa Interactivo de Ubicaciones'}
            </h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-blue-100">
              {kmzId && kmzName 
                ? `Visualiza todas las ubicaciones del archivo ${kmzName}`
                : 'Visualiza todas las ubicaciones indexadas de tus archivos KMZ'
              }
            </p>
            {kmzId && (
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => window.history.back()}
              >
                <X className="h-4 w-4" />
                Volver a Búsqueda
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="overflow-hidden">
          <div className="relative bg-gray-100" style={{ height: '600px' }}>
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '100%',
                zIndex: 1,
              }}
            />

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-slate-900 font-semibold">Cargando mapa...</p>
                  <p className="text-sm text-slate-600 mt-1">Esto puede tomar unos segundos</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                <div className="text-center">
                  <p className="text-red-900 font-semibold mb-2">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-20">
              <h3 className="font-semibold text-sm mb-3">Leyenda</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Región 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Región 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Región 3</span>
                </div>
                <p className="mt-3 text-slate-600 text-xs">
                  Haz clic en cada marcador para ver detalles de la ubicación
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Info */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="p-6">
            <p className="text-blue-900">
              Se muestran <strong>{kmzId && locations?.locations ? locations.locations.length : locations?.results?.filter((r: any) => r.type === 'location').length || 0}</strong> ubicaciones
              {kmzId && locations?.kmz && ` del archivo ${locations.kmz.name}`}.
              Usa el mapa para explorar y haz clic en los marcadores para ver más información.
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}
