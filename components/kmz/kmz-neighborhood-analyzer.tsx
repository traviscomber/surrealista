"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  MapPin,
  Navigation,
  Plane,
  Car,
  Building2,
  ShoppingCart,
  Ruler,
  Search,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Anchor,
  Trees,
  CloudRain,
  Mountain,
  Route,
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { kmzReader, type KMZData } from "@/lib/kmz/kmz-reader"
import { neighborhoodAnalyzer, type NeighborhoodAnalysis } from "@/lib/kmz/neighborhood-analyzer"
import dynamic from "next/dynamic"

const KMZMapDisplay = dynamic(() => import("@/components/kmz/kmz-map-display").then((mod) => mod.KMZMapDisplay), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-xl">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  ),
})

interface KMZRecord {
  id: string
  file_name: string
  file_path: string
  region?: string
  [key: string]: unknown
}

interface KMZNeighborhoodAnalyzerProps {
  kmzFile?: KMZRecord | null
}

export function KMZNeighborhoodAnalyzer({ kmzFile }: KMZNeighborhoodAnalyzerProps = {}) {
  const [kmzFiles, setKmzFiles] = useState<KMZData[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<NeighborhoodAnalysis | null>(null)
  const [searchRadius, setSearchRadius] = useState(5)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)

  useEffect(() => {
    if (kmzFile?.file_path && kmzFiles.length === 0) {
      loadKMZFromPath(kmzFile.file_path, kmzFile.file_name)
    }
  }, [kmzFile])

  const loadKMZFromPath = async (filePath: string, fileName: string) => {
    setLoading(true)
    try {
      const response = await fetch(filePath)
      const blob = await response.blob()
      const file = new File([blob], fileName, { type: "application/vnd.google-earth.kmz" })
      const kmzData = await kmzReader.readKMZFile(file)
      setKmzFiles([kmzData])
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const kmzFilesLocal = acceptedFiles.filter(
      (file) => file.name.toLowerCase().endsWith(".kmz") || file.name.toLowerCase().endsWith(".kml"),
    )

    if (kmzFilesLocal.length === 0) {
      alert("Por favor selecciona archivos KMZ o KML válidos")
      return
    }

    setLoading(true)
    setUploadProgress({ current: 0, total: kmzFilesLocal.length })

    try {
      const results = await Promise.allSettled(
        kmzFilesLocal.map(async (file, index) => {
          try {
            const kmzData = await kmzReader.readKMZFile(file)
            setUploadProgress({ current: index + 1, total: kmzFilesLocal.length })
            return kmzData
          } catch (error) {
            console.error(`Error processing ${file.name}:`, error)
            return null
          }
        }),
      )

      const successfulResults = results
        .filter(
          (result): result is PromiseFulfilledResult<KMZData> => result.status === "fulfilled" && result.value !== null,
        )
        .map((result) => result.value)

      setKmzFiles((prev) => [...prev, ...successfulResults])
    } catch (error) {
      console.error("Error processing KMZ files:", error)
      alert("Error al procesar los archivos KMZ")
    } finally {
      setLoading(false)
      setUploadProgress(null)
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

  const analyzeNeighborhood = async () => {
    if (kmzFiles.length === 0) {
      alert("Por favor carga al menos un archivo KMZ primero")
      return
    }

    setAnalyzing(true)

    try {
      const result = await neighborhoodAnalyzer.analyzeNeighborhood(kmzFiles, searchRadius)
      setAnalysis(result)
    } catch (error) {
      console.error("Error analyzing neighborhood:", error)
      alert("Error al analizar el vecindario")
    } finally {
      setAnalyzing(false)
    }
  }

  const estimateTravelTime = (distance: number): string => {
    // Placeholder function for estimating travel time based on distance
    return `${Math.round(distance / 50)} horas`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <MapPin className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Análisis de Vecindario KMZ</h1>
            </div>
            <p className="text-emerald-100 text-lg font-medium">
              Identifica roles vecinos, accesos, distancias y obtén información de fuentes gubernamentales chilenas
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 scale-[1.02] shadow-lg"
                  : "border-slate-300 hover:border-emerald-400 hover:bg-gradient-to-br hover:from-slate-50 hover:to-emerald-50 hover:shadow-md"
              }`}
            >
              <input {...getInputProps()} />
              <div className={`transition-all duration-300 ${isDragActive ? "scale-110" : ""}`}>
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                {isDragActive ? (
                  <p className="text-xl font-semibold text-emerald-700">¡Suelta los archivos KMZ aquí!</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xl font-semibold text-slate-700">Arrastra archivos KMZ del vecindario aquí</p>
                    <p className="text-slate-500 font-medium">
                      Soporta archivos .kmz y .kml • Múltiples archivos permitidos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {loading && uploadProgress && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-3 text-emerald-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-semibold">
                    Procesando archivos KMZ... ({uploadProgress.current}/{uploadProgress.total})
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Controls */}
        {kmzFiles.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-600" />
                Configuración de Análisis
              </CardTitle>
              <CardDescription>Configura los parámetros para el análisis de vecindario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="radius">Radio de Búsqueda (km)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="1"
                    max="50"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="text-lg font-semibold"
                  />
                  <p className="text-sm text-slate-500">Buscar propiedades vecinas dentro de {searchRadius} km</p>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={analyzeNeighborhood}
                    disabled={analyzing}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-6 text-lg"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Analizando Vecindario...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Analizar Vecindario
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-900">
                      {kmzFiles.length} archivo{kmzFiles.length !== 1 ? "s" : ""} KMZ cargado
                      {kmzFiles.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-emerald-700">Listo para analizar roles vecinos, accesos y distancias</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="neighbors">Vecinos</TabsTrigger>
              <TabsTrigger value="access">Accesos</TabsTrigger>
              <TabsTrigger value="distances">Distancias</TabsTrigger>
              <TabsTrigger value="map">Mapa</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold opacity-90">Roles Vecinos</CardTitle>
                    <Building2 className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysis.neighboringProperties.length}</div>
                    <p className="text-xs opacity-80 mt-1">propiedades identificadas</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold opacity-90">Radio Análisis</CardTitle>
                    <Ruler className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysis.searchRadius} km</div>
                    <p className="text-xs opacity-80 mt-1">área analizada</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold opacity-90">Fuentes Datos</CardTitle>
                    <FileText className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {analysis.dataSources.map((source, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="justify-center py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 font-semibold"
                        >
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold opacity-90">Accesos</CardTitle>
                    <Navigation className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysis.accessRoutes.length}</div>
                    <p className="text-xs opacity-80 mt-1">rutas identificadas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Sources */}
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle>Fuentes de Datos Consultadas</CardTitle>
                  <CardDescription>Información obtenida de múltiples fuentes gubernamentales chilenas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {analysis.dataSources.map((source, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="justify-center py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 font-semibold"
                      >
                        {source}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Neighbors Tab */}
            <TabsContent value="neighbors" className="space-y-6">
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Propiedades Vecinas (Radio: {analysis.searchRadius} km)
                  </CardTitle>
                  <CardDescription>
                    Propiedades identificadas en los archivos KMZ dentro del radio de búsqueda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-blue-900">Fuente de Datos</p>
                        <p className="text-sm text-blue-700">
                          Las propiedades vecinas se identifican a partir de los archivos KMZ cargados. Para obtener
                          información completa del vecindario, asegúrate de cargar todos los archivos KMZ relevantes de
                          la zona.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {analysis.neighboringProperties.map((property, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-xl p-6 bg-gradient-to-r from-white to-slate-50 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-bold text-lg text-slate-800">{property.rol}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              Distancia: {property.distance.toFixed(2)} km
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold"
                          >
                            {property.source}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-600">Coordenadas:</span>
                            <div className="text-slate-800 font-mono text-xs mt-1">
                              {property.coordinates.lat.toFixed(6)}, {property.coordinates.lng.toFixed(6)}
                            </div>
                          </div>
                          {property.additionalInfo && (
                            <div>
                              <span className="font-medium text-slate-600">Descripción:</span>
                              <div className="text-slate-800 text-xs mt-1">{property.additionalInfo}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {analysis.neighboringProperties.length === 0 && (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <p className="text-slate-700 font-semibold">
                            No se encontraron propiedades vecinas en el radio de {analysis.searchRadius} km
                          </p>
                          <p className="text-slate-500 text-sm">
                            Las propiedades vecinas se identifican a partir de los archivos KMZ cargados. Intenta cargar
                            más archivos KMZ de la zona o aumentar el radio de búsqueda.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Access Routes Tab */}
            <TabsContent value="access" className="space-y-6">
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-emerald-600" />
                    Rutas de Acceso
                  </CardTitle>
                  <CardDescription>Accesos terrestres y aéreos desde Santiago y ciudades cercanas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Santiago Access */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Acceso desde Santiago
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.accessRoutes
                          .filter((route) => route.from === "Santiago")
                          .map((route, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                {route.type === "air" ? (
                                  <Plane className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Car className="h-4 w-4 text-blue-600" />
                                )}
                                <span className="font-semibold text-blue-900">
                                  {route.type === "air" ? "Vía Aérea" : "Vía Terrestre"}
                                </span>
                              </div>
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="text-slate-600">Distancia:</span>{" "}
                                  <span className="font-semibold">{route.distance} km</span>
                                </div>
                                <div>
                                  <span className="text-slate-600">Tiempo estimado:</span>{" "}
                                  <span className="font-semibold">{route.duration}</span>
                                </div>
                                {route.description && (
                                  <div className="text-slate-600 mt-2 pt-2 border-t">{route.description}</div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Other Routes */}
                    <div className="space-y-4">
                      {analysis.accessRoutes
                        .filter((route) => route.from !== "Santiago")
                        .map((route, index) => (
                          <div
                            key={index}
                            className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {route.type === "air" ? (
                                  <Plane className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Car className="h-4 w-4 text-emerald-600" />
                                )}
                                <span className="font-semibold text-slate-800">
                                  Desde {route.from} a {route.to}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {route.distance} km
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-600">
                              <span className="font-medium">Tiempo:</span> {route.duration}
                            </div>
                            {route.description && (
                              <div className="text-sm text-slate-600 mt-2 pt-2 border-t">{route.description}</div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Distances Tab */}
            <TabsContent value="distances" className="space-y-6">
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-emerald-600" />
                    Distancias a Puntos de Interés
                  </CardTitle>
                  <CardDescription>Distancias a capitales, ciudades y servicios básicos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analysis.distances.map((distance, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {distance.type === "provincial_capital" && <Building2 className="h-5 w-5 text-blue-600" />}
                            {distance.type === "commune_capital" && <Building2 className="h-5 w-5 text-emerald-600" />}
                            {distance.type === "nearest_town" && <ShoppingCart className="h-5 w-5 text-orange-600" />}
                            {distance.type === "airport" && <Plane className="h-5 w-5 text-purple-600" />}
                            {distance.type === "city" && <Building2 className="h-5 w-5 text-teal-600" />}
                            {distance.type === "port" && <Anchor className="h-5 w-5 text-cyan-600" />}
                            {distance.type === "national_park" && <Trees className="h-5 w-5 text-green-600" />}
                            <span className="font-bold text-slate-800">{distance.name}</span>
                          </div>
                          <Badge variant="outline" className="font-semibold">
                            {distance.distance} km
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div>
                            <span className="font-medium">Tipo:</span> {distance.typeLabel}
                          </div>
                          {distance.travelTime && (
                            <div>
                              <span className="font-medium">Tiempo estimado:</span> {distance.travelTime}
                            </div>
                          )}
                          {distance.description && (
                            <div className="mt-2 pt-2 border-t text-slate-500">{distance.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contextual Information */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mountain className="h-5 w-5 text-blue-600" />
                    Información Contextual
                  </CardTitle>
                  <CardDescription>Contexto geográfico, climático y turístico de la ubicación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Road Type Section */}
                  {analysis.contextualInfo.roadType && (
                    <div className="bg-white rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Route className="h-5 w-5 text-orange-600" />
                        <h3 className="font-bold text-lg text-slate-800">Tipo de Camino</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`font-semibold ${
                              analysis.contextualInfo.roadType.type === "highway"
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : analysis.contextualInfo.roadType.type === "paved"
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : analysis.contextualInfo.roadType.type === "rural"
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            {analysis.contextualInfo.roadType.type === "highway"
                              ? "Autopista"
                              : analysis.contextualInfo.roadType.type === "paved"
                                ? "Pavimentado"
                                : analysis.contextualInfo.roadType.type === "rural"
                                  ? "Rural"
                                  : "Desconocido"}
                          </Badge>
                          {analysis.contextualInfo.roadType.name && (
                            <span className="font-semibold text-slate-800">
                              {analysis.contextualInfo.roadType.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{analysis.contextualInfo.roadType.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Climate Zone */}
                  {analysis.contextualInfo.climateZone && (
                    <div className="bg-white rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CloudRain className="h-5 w-5 text-blue-600" />
                        <h3 className="font-bold text-lg text-slate-800">Zona Climática</h3>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-blue-900">
                            {analysis.contextualInfo.climateZone.name}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{analysis.contextualInfo.climateZone.description}</p>
                        <div className="mt-3">
                          <span className="text-sm font-medium text-slate-700">Características:</span>
                          <ul className="mt-1 space-y-1">
                            {analysis.contextualInfo.climateZone.characteristics.map((char, idx) => (
                              <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                {char}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nearest Cities */}
                  <div className="bg-white rounded-xl p-6 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-bold text-lg text-slate-800">Ciudades Cercanas</h3>
                    </div>
                    <div className="space-y-3">
                      {analysis.contextualInfo.nearestCities.slice(0, 5).map((city, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <div className="font-semibold text-slate-800">{city.name}</div>
                            <div className="text-xs text-slate-500">
                              {city.population.toLocaleString("es-CL")} habitantes
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-emerald-600">{Math.round(city.distance)} km</div>
                            <div className="text-xs text-slate-500">{city.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nearest Port */}
                  {analysis.contextualInfo.nearestPort && (
                    <div className="bg-white rounded-xl p-6 border border-cyan-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Anchor className="h-5 w-5 text-cyan-600" />
                        <h3 className="font-bold text-lg text-slate-800">Puerto Más Cercano</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {analysis.contextualInfo.nearestPort.name}
                          </span>
                          <Badge variant="outline" className="bg-cyan-50 border-cyan-200 text-cyan-700">
                            {Math.round(analysis.contextualInfo.nearestPort.distance)} km
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{analysis.contextualInfo.nearestPort.description}</p>
                        <div className="text-sm">
                          <span className="font-medium text-slate-700">Tipo:</span>{" "}
                          <span className="text-slate-600 capitalize">{analysis.contextualInfo.nearestPort.type}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nearest National Park */}
                  {analysis.contextualInfo.nearestNationalPark && (
                    <div className="bg-white rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Trees className="h-5 w-5 text-green-600" />
                        <h3 className="font-bold text-lg text-slate-800">Área Protegida Más Cercana</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {analysis.contextualInfo.nearestNationalPark.name}
                          </span>
                          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                            {Math.round(analysis.contextualInfo.nearestNationalPark.distance)} km
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {analysis.contextualInfo.nearestNationalPark.description}
                        </p>
                        <div className="text-sm">
                          <span className="font-medium text-slate-700">Superficie:</span>{" "}
                          <span className="text-slate-600">
                            {analysis.contextualInfo.nearestNationalPark.area.toLocaleString("es-CL")} hectáreas
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Distance to Santiago */}
                  <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg text-slate-800">Distancia a Santiago</div>
                        <div className="text-sm text-slate-600 mt-1">Capital de Chile</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-800">
                          {analysis.contextualInfo.distanceToSantiago} km
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {estimateTravelTime(analysis.contextualInfo.distanceToSantiago)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map">
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    Mapa de Vecindario
                  </CardTitle>
                  <CardDescription>Visualización de propiedades vecinas y puntos de interés</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] w-full rounded-xl overflow-hidden">
                    <KMZMapDisplay kmzFiles={kmzFiles} height="600px" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
