"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, MapPin, FileText, Eye, Trash2, AlertCircle, CheckCircle, Sparkles } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { kmzReader, type KMZData } from "@/lib/kmz/kmz-reader"
import { DownloadPropertyButton } from "@/components/features/pdf-generator/download-button"

export function EnhancedKMZViewer() {
  const [kmzFiles, setKmzFiles] = useState<KMZData[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedKMZ, setSelectedKMZ] = useState<KMZData | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined" || (window as any).L) {
        setLeafletLoaded(true)
        return
      }

      try {
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
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })

        setLeafletLoaded(true)
      } catch (error) {
        console.error("Error loading Leaflet:", error)
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
        if (!L) return

        // Clear any existing map
        if (mapRef.current) {
          mapRef.current.innerHTML = ""
        }

        // Create map with Chile-focused view
        const map = L.map(mapRef.current, {
          center: [-41.0, -72.5], // Centro de Chile
          zoom: 8,
          zoomControl: false, // We'll add custom controls
        })

        // Add multiple tile layer options for better KMZ visualization
        const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        })

        const satelliteLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "© Esri",
            maxZoom: 18,
          },
        )

        const topoLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenTopoMap contributors",
          maxZoom: 17,
        })

        // Add default layer
        osmLayer.addTo(map)

        // Layer control
        const baseLayers = {
          OpenStreetMap: osmLayer,
          Satélite: satelliteLayer,
          Topográfico: topoLayer,
        }
        L.control.layers(baseLayers).addTo(map)

        // Custom zoom controls
        L.control
          .zoom({
            position: "topright",
          })
          .addTo(map)

        setMapInstance(map)
      } catch (error) {
        console.error("Error initializing map:", error)
        setMapError("Error inicializando el mapa")
      }
    }

    initMap()
  }, [leafletLoaded, mapInstance])

  useEffect(() => {
    if (!mapInstance || !kmzFiles.length) return

    const L = (window as any).L
    if (!L) return

    // Clear existing KMZ layers
    mapInstance.eachLayer((layer: any) => {
      if (layer.options && layer.options.isKMZ) {
        mapInstance.removeLayer(layer)
      }
    })

    const allBounds: any[] = []

    kmzFiles.forEach((kmzData, kmzIndex) => {
      const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"]
      const color = colors[kmzIndex % colors.length]

      kmzData.placemarks.forEach((placemark, placemarkIndex) => {
        // Handle different geometry types properly
        if (placemark.type === "Point" && placemark.coordinates.length > 0) {
          const [lng, lat] = placemark.coordinates[0]

          // Validate coordinates
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`Invalid coordinates for ${placemark.name}: [${lng}, ${lat}]`)
            return
          }

          const marker = L.marker([lat, lng], {
            isKMZ: true,
            icon: L.divIcon({
              html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
              className: "kmz-point-marker",
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            }),
          }).addTo(mapInstance)

          marker.bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${placemark.name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Archivo:</strong> ${kmzData.fileName}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Tipo:</strong> ${placemark.type}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>📁 Documentación:</strong></p>
                <a href="/documentacion/campos/${encodeURIComponent(kmzData.fileName.replace(".kmz", "").replace(".kml", ""))}" 
                   target="_blank"
                   style="color: #6B8E7A; text-decoration: none; font-size: 11px; display: inline-block; padding: 4px 8px; background: #f0f4f0; border-radius: 4px; margin-top: 4px;">
                  Ver carpeta de documentos →
                </a>
              </div>
              ${placemark.description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">${placemark.description.substring(0, 100)}...</p>` : ""}
            </div>
          `)

          allBounds.push([lat, lng])
        } else if (
          (placemark.type === "LineString" || placemark.type === "Polygon") &&
          placemark.coordinates.length > 1
        ) {
          // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
          const leafletCoords = placemark.coordinates
            .filter(([lng, lat]) => !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
            .map(([lng, lat]) => [lat, lng] as [number, number])

          if (leafletCoords.length < 2) {
            console.warn(`Insufficient valid coordinates for ${placemark.name}`)
            return
          }

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
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>📁 Documentación:</strong></p>
                <a href="/documentacion/campos/${encodeURIComponent(kmzData.fileName.replace(".kmz", "").replace(".kml", ""))}" 
                   target="_blank"
                   style="color: #6B8E7A; text-decoration: none; font-size: 11px; display: inline-block; padding: 4px 8px; background: #f0f4f0; border-radius: 4px; margin-top: 4px;">
                  Ver carpeta de documentos →
                </a>
              </div>
              ${placemark.description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">${placemark.description.substring(0, 100)}...</p>` : ""}
            </div>
          `)

          allBounds.push(...leafletCoords)
        }
      })
    })

    // Fit map to show all KMZ data
    if (allBounds.length > 0) {
      try {
        const bounds = L.latLngBounds(allBounds)
        mapInstance.fitBounds(bounds, { padding: [20, 20] })
      } catch (error) {
        console.warn("Error fitting bounds:", error)
      }
    }
  }, [mapInstance, kmzFiles])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const kmzFiles = acceptedFiles.filter(
      (file) => file.name.toLowerCase().endsWith(".kmz") || file.name.toLowerCase().endsWith(".kml"),
    )

    if (kmzFiles.length === 0) {
      alert("Por favor selecciona archivos KMZ o KML válidos")
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      const results = []
      for (let i = 0; i < kmzFiles.length; i++) {
        const file = kmzFiles[i]
        try {
          const kmzData = await kmzReader.readKMZFile(file)
          results.push(kmzData)
          setProgress(((i + 1) / kmzFiles.length) * 100)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
        }
      }

      setKmzFiles((prev) => [...prev, ...results])
    } catch (error) {
      console.error("Error processing KMZ files:", error)
      alert("Error al procesar los archivos KMZ")
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.google-earth.kmz": [".kmz"],
      "application/vnd.google-earth.kml+xml": [".kml"],
    },
    multiple: true,
  })

  const removeKMZ = (index: number) => {
    setKmzFiles((prev) => prev.filter((_, i) => i !== index))
    if (selectedKMZ && kmzFiles.indexOf(selectedKMZ) === index) {
      setSelectedKMZ(null)
    }
  }

  const getTotalPlacemarks = () => {
    return kmzFiles.reduce((total, kmz) => total + kmz.placemarks.length, 0)
  }

  const getAllRoles = () => {
    const allRoles = kmzFiles.flatMap((kmz) => kmzReader.extractPropertyRoles(kmz))
    return [...new Set(allRoles)]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex justify-between items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Visualizador KMZ Mejorado</h1>
              </div>
              <p className="text-blue-100 text-lg font-medium">
                Visualización avanzada de archivos KMZ con mapas interactivos y coordenadas precisas
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setKmzFiles([])}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Todo
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-[1.02] shadow-lg"
                  : "border-slate-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-slate-50 hover:to-blue-50 hover:shadow-md"
              }`}
            >
              <input {...getInputProps()} />
              <div className={`transition-all duration-300 ${isDragActive ? "scale-110" : ""}`}>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                {isDragActive ? (
                  <p className="text-xl font-semibold text-blue-700">¡Suelta los archivos KMZ aquí!</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xl font-semibold text-slate-700">
                      Arrastra archivos KMZ aquí o haz clic para seleccionar
                    </p>
                    <p className="text-slate-500 font-medium">
                      Soporta archivos .kmz y .kml • Visualización mejorada con coordenadas precisas
                    </p>
                  </div>
                )}
              </div>
            </div>

            {loading && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">Procesando archivos...</span>
                  <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {kmzFiles.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <Tabs defaultValue="map" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger
                    value="map"
                    className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Mapa Interactivo
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Lista de Archivos
                  </TabsTrigger>
                  <TabsTrigger
                    value="roles"
                    className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Números de Rol
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="map">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">Visualización Mejorada de KMZ</h3>
                      <p className="text-slate-600 font-medium">
                        Mapa interactivo con coordenadas precisas y múltiples capas base
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl">
                      <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg relative">
                        {mapError ? (
                          <div className="flex items-center justify-center h-full bg-red-50">
                            <div className="text-center">
                              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                              <p className="text-red-600 font-medium">{mapError}</p>
                            </div>
                          </div>
                        ) : !leafletLoaded ? (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-gray-600">Cargando mapa...</p>
                            </div>
                          </div>
                        ) : (
                          <div ref={mapRef} className="w-full h-full" />
                        )}
                      </div>

                      {/* Enhanced map statistics */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-bold text-green-700">Archivos Cargados</div>
                              <div className="text-sm text-slate-600">{kmzFiles.length} archivos KMZ</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-bold text-blue-700">Ubicaciones</div>
                              <div className="text-sm text-slate-600">{getTotalPlacemarks()} puntos visualizados</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <FileText className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-bold text-orange-700">Números de Rol</div>
                              <div className="text-sm text-slate-600">{getAllRoles().length} identificados</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="list" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kmzFiles.map((kmz, index) => (
                      <Card
                        key={index}
                        className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg truncate font-bold text-slate-800">{kmz.fileName}</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeKMZ(index)}
                              className="hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {kmz.metadata?.name && (
                            <CardDescription className="font-medium">{kmz.metadata.name}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Ubicaciones:</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-semibold">
                              {kmz.placemarks.length}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Números de Rol:</span>
                            <Badge variant="outline" className="border-orange-200 text-orange-700 font-semibold">
                              {kmzReader.extractPropertyRoles(kmz).length}
                            </Badge>
                          </div>

                          {kmz.bounds && (
                            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                              <div className="font-semibold mb-1">Límites geográficos:</div>
                              <div className="space-y-1">
                                <div>
                                  N: {kmz.bounds.north.toFixed(4)}, S: {kmz.bounds.south.toFixed(4)}
                                </div>
                                <div>
                                  E: {kmz.bounds.east.toFixed(4)}, W: {kmz.bounds.west.toFixed(4)}
                                </div>
                              </div>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedKMZ(kmz)}
                            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 font-semibold transition-all duration-300"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="roles">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">Números de Rol Extraídos</h3>
                      <p className="text-slate-600 font-medium">
                        Identificadores de propiedades encontrados en los archivos KMZ
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {getAllRoles().map((role, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="justify-center py-2 bg-white border-orange-200 text-orange-700 font-semibold hover:bg-orange-50 transition-colors"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                      {getAllRoles().length === 0 && (
                        <div className="text-center py-12">
                          <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <AlertCircle className="h-10 w-10 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-medium text-lg">
                            No se encontraron números de rol en los archivos KMZ
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            Intenta cargar archivos con información de propiedades
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {selectedKMZ && (
          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
              <div className="flex justify-between items-center gap-3">
                <CardTitle className="text-xl font-bold text-slate-800">Detalles: {selectedKMZ.fileName}</CardTitle>
                <div className="flex items-center gap-2">
                  <DownloadPropertyButton
                    propertyData={selectedKMZ}
                    propertyName={selectedKMZ.fileName}
                    variant="outline"
                    size="sm"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedKMZ(null)}
                    className="hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {selectedKMZ.metadata?.description && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-slate-700 font-medium">{selectedKMZ.metadata.description}</p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-800">Ubicaciones ({selectedKMZ.placemarks.length})</h4>
                <div className="max-h-80 overflow-y-auto space-y-3">
                  {selectedKMZ.placemarks.map((placemark, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-xl p-4 bg-gradient-to-r from-white to-slate-50 hover:shadow-md transition-shadow"
                    >
                      <div className="font-bold text-slate-800">{placemark.name}</div>
                      <div className="text-slate-600 text-sm mt-1">
                        <span className="font-medium">Tipo:</span> {placemark.type} •
                        <span className="font-medium"> Coordenadas:</span> {placemark.coordinates.length} puntos
                      </div>
                      {placemark.coordinates.length > 0 && (
                        <div className="text-xs mt-2 text-slate-500 bg-slate-50 p-2 rounded font-mono">
                          Lat: {placemark.coordinates[0][1]?.toFixed(6)}, Lng: {placemark.coordinates[0][0]?.toFixed(6)}
                        </div>
                      )}
                      {placemark.description && (
                        <div className="text-xs mt-2 text-slate-500 bg-slate-50 p-2 rounded">
                          {placemark.description.substring(0, 150)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
