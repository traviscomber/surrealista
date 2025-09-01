"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, MapPin, FileText, Map, Eye, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { kmzReader, type KMZData } from "@/lib/kmz/kmz-reader"

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lector de Archivos KMZ</h1>
          <p className="text-muted-foreground">Carga y visualiza múltiples archivos KMZ de propiedades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setKmzFiles([])}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Todo
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Suelta los archivos KMZ aquí...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Arrastra archivos KMZ aquí o haz clic para seleccionar</p>
                <p className="text-sm text-muted-foreground">
                  Soporta archivos .kmz y .kml (múltiples archivos permitidos)
                </p>
              </div>
            )}
          </div>

          {loading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Procesando archivos...</span>
                <span className="text-sm">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {kmzFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archivos KMZ</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kmzFiles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ubicaciones</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalPlacemarks()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Números de Rol</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{getAllRoles().length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Listo</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KMZ Files List and Details */}
      {kmzFiles.length > 0 && (
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista de Archivos</TabsTrigger>
            <TabsTrigger value="map">Vista de Mapa</TabsTrigger>
            <TabsTrigger value="roles">Números de Rol</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kmzFiles.map((kmz, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg truncate">{kmz.fileName}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => removeKMZ(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {kmz.metadata?.name && <CardDescription>{kmz.metadata.name}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Ubicaciones:</span>
                      <Badge variant="secondary">{kmz.placemarks.length}</Badge>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Números de Rol:</span>
                      <Badge variant="outline">{kmzReader.extractPropertyRoles(kmz).length}</Badge>
                    </div>

                    {kmz.bounds && (
                      <div className="text-xs text-muted-foreground">
                        <div>Límites geográficos:</div>
                        <div>
                          N: {kmz.bounds.north.toFixed(4)}, S: {kmz.bounds.south.toFixed(4)}
                        </div>
                        <div>
                          E: {kmz.bounds.east.toFixed(4)}, W: {kmz.bounds.west.toFixed(4)}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedKMZ(kmz)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Vista de Mapa Integrado</CardTitle>
                <CardDescription>Visualización de todas las ubicaciones KMZ en el mapa interactivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Integración con mapa interactivo (próximamente)</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Se mostrarán {getTotalPlacemarks()} ubicaciones de {kmzFiles.length} archivos KMZ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Números de Rol Extraídos</CardTitle>
                <CardDescription>Roles de propiedades encontrados en los archivos KMZ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {getAllRoles().map((role, index) => (
                    <Badge key={index} variant="outline" className="justify-center">
                      {role}
                    </Badge>
                  ))}
                </div>
                {getAllRoles().length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No se encontraron números de rol en los archivos KMZ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Selected KMZ Details Modal */}
      {selectedKMZ && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Detalles: {selectedKMZ.fileName}</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedKMZ(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedKMZ.metadata?.description && (
              <p className="text-sm text-muted-foreground">{selectedKMZ.metadata.description}</p>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold">Ubicaciones ({selectedKMZ.placemarks.length})</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedKMZ.placemarks.map((placemark, index) => (
                  <div key={index} className="border rounded p-3 text-sm">
                    <div className="font-medium">{placemark.name}</div>
                    <div className="text-muted-foreground">
                      Tipo: {placemark.type} | Coordenadas: {placemark.coordinates.length} puntos
                    </div>
                    {placemark.description && (
                      <div className="text-xs mt-1 text-muted-foreground">
                        {placemark.description.substring(0, 100)}...
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
  )
}
