"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, MapPin, FileText, Map, Eye, Trash2, AlertCircle, CheckCircle, Sparkles } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { kmzReader, type KMZData } from "@/lib/kmz/kmz-reader"
import { CanvasMap } from "@/components/maps/canvas-map"

export function KMZViewer() {
  const [kmzFiles, setKmzFiles] = useState<KMZData[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedKMZ, setSelectedKMZ] = useState<KMZData | null>(null)

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
                <h1 className="text-4xl font-bold tracking-tight">Lector de Archivos KMZ</h1>
              </div>
              <p className="text-blue-100 text-lg font-medium">
                Carga y visualiza múltiples archivos KMZ de propiedades con tecnología avanzada
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
        {/* </CHANGE> */}

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
                      Soporta archivos .kmz y .kml • Múltiples archivos permitidos
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
        {/* </CHANGE> */}

        {kmzFiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold opacity-90">Archivos KMZ</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{kmzFiles.length}</div>
                <p className="text-xs opacity-80 mt-1">archivos cargados</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold opacity-90">Ubicaciones</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <MapPin className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{getTotalPlacemarks()}</div>
                <p className="text-xs opacity-80 mt-1">puntos geográficos</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold opacity-90">Números de Rol</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{getAllRoles().length}</div>
                <p className="text-xs opacity-80 mt-1">propiedades identificadas</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold opacity-90">Estado</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Map className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">Listo</div>
                <p className="text-xs opacity-80 mt-1">sistema operativo</p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* </CHANGE> */}

        {kmzFiles.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <Tabs defaultValue="list" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger
                    value="list"
                    className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Lista de Archivos
                  </TabsTrigger>
                  <TabsTrigger
                    value="map"
                    className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Vista de Mapa
                  </TabsTrigger>
                  <TabsTrigger
                    value="roles"
                    className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Números de Rol
                  </TabsTrigger>
                </TabsList>

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

                <TabsContent value="map">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">Vista de Mapa Integrado</h3>
                      <p className="text-slate-600 font-medium">
                        Visualización interactiva de todas las ubicaciones KMZ
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl">
                      <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg">
                        <CanvasMap
                          properties={[]}
                          kmzData={kmzFiles}
                          selectedProperty={null}
                          onPropertySelect={() => {}}
                          showKMZOverlay={true}
                        />
                      </div>

                      {/* Enhanced map statistics */}
                      <div className="mt-6 flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-bold text-green-700">Mapa Activo</div>
                            <div className="text-sm text-slate-600">
                              {getTotalPlacemarks()} ubicaciones visualizadas
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-700">
                            {kmzFiles.length} archivo{kmzFiles.length !== 1 ? "s" : ""} KMZ
                          </div>
                          <div className="text-sm text-slate-500">cargado{kmzFiles.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>

                      {/* Enhanced KMZ files summary */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {kmzFiles.map((kmz, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 shadow-sm"
                          >
                            <div className="font-bold text-slate-800 truncate">{kmz.fileName}</div>
                            <div className="text-sm text-slate-600 mt-1">{kmz.placemarks.length} ubicaciones</div>
                            {kmzReader.extractPropertyRoles(kmz).length > 0 && (
                              <div className="text-xs text-orange-600 font-mono mt-2 bg-orange-50 px-2 py-1 rounded">
                                Roles: {kmzReader.extractPropertyRoles(kmz).slice(0, 2).join(", ")}
                                {kmzReader.extractPropertyRoles(kmz).length > 2 && "..."}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
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
        {/* </CHANGE> */}

        {selectedKMZ && (
          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-slate-800">Detalles: {selectedKMZ.fileName}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedKMZ(null)}
                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  ✕
                </Button>
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
        {/* </CHANGE> */}
      </div>
    </div>
  )
}
