"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  FolderOpen,
  FileText,
  Layers,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { realDriveService, type FolderStructure } from "@/lib/google-drive/real-drive-service"
import { completenessAnalyzer } from "@/lib/google-drive/completeness-analyzer"
import { KMZMapDisplay } from "@/components/kmz/kmz-map-display"
import { kmzReader, type KMZData } from "@/lib/kmz/kmz-reader"
import { driveService } from "@/lib/google-drive/drive-service"
import { useDropzone } from "react-dropzone"

interface Campo {
  id: string
  name: string
  location: string
  hectares: number
  region: string
  coordinates?: [number, number]
  files: number
  rolNumbers: number
  status: string
  driveFolder?: FolderStructure
  completenessScore?: number
}

export function CamposView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [campos, setCampos] = useState<Campo[]>([])
  const [selectedCampo, setSelectedCampo] = useState<Campo | null>(null)
  const [loading, setLoading] = useState(true)
  const [driveConnected, setDriveConnected] = useState(false)
  const [driveConnecting, setDriveConnecting] = useState(false)
  const [driveFolders, setDriveFolders] = useState<FolderStructure[]>([])
  const [kmzFiles, setKmzFiles] = useState<KMZData[]>([])
  const [loadingKMZ, setLoadingKMZ] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadCampos()
    connectToDrive()
  }, [])

  const connectToDrive = async () => {
    setDriveConnecting(true)
    try {
      console.log("[v0] Connecting to Google Drive...")
      const success = await realDriveService.authenticate()

      if (success) {
        setDriveConnected(true)
        console.log("[v0] Successfully connected to Google Drive")
        await loadDriveFolders()
      }
    } catch (error) {
      console.error("[v0] Error connecting to Google Drive:", error)
    } finally {
      setDriveConnecting(false)
    }
  }

  const loadDriveFolders = async () => {
    try {
      console.log("[v0] Loading folders from Google Drive...")
      const folders = await realDriveService.listSuccessCases()
      setDriveFolders(folders)
      console.log("[v0] Loaded", folders.length, "folders from Google Drive")

      // Merge Drive folders with existing campos
      mergeDriveFoldersWithCampos(folders)
    } catch (error) {
      console.error("[v0] Error loading Drive folders:", error)
    }
  }

  const mergeDriveFoldersWithCampos = (folders: FolderStructure[]) => {
    const driveCampos: Campo[] = folders.map((folder) => ({
      id: folder.id,
      name: folder.displayName || folder.name,
      location: folder.extractedInfo.location || "Ubicación desconocida",
      hectares: folder.extractedInfo.area ? Number.parseInt(folder.extractedInfo.area) : 0,
      region: "Los Ríos", // Default region, could be extracted from location
      coordinates: undefined, // Could be extracted from KMZ files
      files: folder.totalFiles,
      rolNumbers: folder.extractedInfo.rolNumbers.length,
      status: folder.completionStatus,
      driveFolder: folder,
      completenessScore: folder.completenessScore,
    }))

    setCampos((prev) => {
      // Merge with existing campos, prioritizing Drive data
      const merged = [...driveCampos]
      prev.forEach((campo) => {
        if (!merged.find((c) => c.id === campo.id)) {
          merged.push(campo)
        }
      })
      return merged
    })
  }

  const loadCampos = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_type", "terreno")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading campos:", error)
        // Use mock data as fallback
        setCampos(getMockCampos())
        return
      }

      const camposData: Campo[] = (data || []).map((prop) => ({
        id: prop.id,
        name: prop.title || "Campo sin nombre",
        location: prop.city || prop.location || "Ubicación desconocida",
        hectares: prop.lot_size ? Math.round(prop.lot_size / 10000) : 0,
        region: prop.region || "Región desconocida",
        coordinates: prop.latitude && prop.longitude ? [prop.latitude, prop.longitude] : undefined,
        files: 0,
        rolNumbers: prop.roll_number ? 1 : 0,
        status: prop.status || "active",
      }))

      setCampos(camposData.length > 0 ? camposData : getMockCampos())
    } catch (error) {
      console.error("[v0] Error in loadCampos:", error)
      setCampos(getMockCampos())
    } finally {
      setLoading(false)
    }
  }

  const getMockCampos = (): Campo[] => [
    {
      id: "1",
      name: "Iñipulli",
      location: "Valdivia",
      hectares: 142,
      region: "Los Ríos",
      coordinates: [-39.8142, -73.2459],
      files: 8,
      rolNumbers: 2,
      status: "active",
    },
    {
      id: "2",
      name: "Puelo",
      location: "Puerto Varas",
      hectares: 500,
      region: "Los Lagos",
      coordinates: [-41.3317, -72.9828],
      files: 12,
      rolNumbers: 3,
      status: "active",
    },
    {
      id: "3",
      name: "Talca",
      location: "Talca",
      hectares: 500,
      region: "Maule",
      coordinates: [-35.4264, -71.6554],
      files: 5,
      rolNumbers: 1,
      status: "active",
    },
  ]

  const filteredCampos = campos.filter(
    (campo) =>
      campo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campo.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campo.region.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCampoClick = async (campo: Campo) => {
    setSelectedCampo(campo)

    if (campo.driveFolder && driveConnected) {
      await loadKMZFromFolder(campo.driveFolder.id)
    }
  }

  const loadKMZFromFolder = async (folderId: string) => {
    setLoadingKMZ(true)
    try {
      console.log("[v0] Searching for KMZ files in folder:", folderId)

      // Search for KMZ files in the folder and subfolders
      const kmzFiles = await driveService.searchKMZInAllFolders(folderId)

      console.log("[v0] Found", kmzFiles.length, "KMZ files in folder")

      if (kmzFiles.length === 0) {
        console.log("[v0] No KMZ files found in this folder")
        return
      }

      // Download and parse each KMZ file
      const parsedKMZFiles: KMZData[] = []

      for (const { file } of kmzFiles) {
        try {
          console.log("[v0] Downloading KMZ file:", file.name)

          // Get file content as blob
          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${driveService.apiKey}`,
          )

          if (!response.ok) {
            console.error("[v0] Error downloading file:", file.name, response.status)
            continue
          }

          const blob = await response.blob()
          const fileObj = new File([blob], file.name, { type: "application/vnd.google-earth.kmz" })

          // Parse KMZ file
          const kmzData = await kmzReader.readKMZFile(fileObj)
          parsedKMZFiles.push(kmzData)

          console.log("[v0] Successfully parsed KMZ file:", file.name, "with", kmzData.placemarks.length, "placemarks")
        } catch (error) {
          console.error("[v0] Error processing KMZ file:", file.name, error)
        }
      }

      // Add parsed KMZ files to the map
      if (parsedKMZFiles.length > 0) {
        setKmzFiles(parsedKMZFiles)
        console.log("[v0] Loaded", parsedKMZFiles.length, "KMZ files to map")
      }
    } catch (error) {
      console.error("[v0] Error loading KMZ files from folder:", error)
    } finally {
      setLoadingKMZ(false)
    }
  }

  const onDropKMZ = async (acceptedFiles: File[]) => {
    const kmzFilesOnly = acceptedFiles.filter(
      (file) => file.name.toLowerCase().endsWith(".kmz") || file.name.toLowerCase().endsWith(".kml"),
    )

    if (kmzFilesOnly.length === 0) {
      alert("Por favor selecciona archivos KMZ o KML válidos")
      return
    }

    setLoadingKMZ(true)

    try {
      const results = []
      for (const file of kmzFilesOnly) {
        try {
          const kmzData = await kmzReader.readKMZFile(file)
          results.push(kmzData)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
        }
      }

      setKmzFiles((prev) => [...prev, ...results])
      console.log("[v0] Loaded", results.length, "KMZ files")
    } catch (error) {
      console.error("Error processing KMZ files:", error)
      alert("Error al procesar los archivos KMZ")
    } finally {
      setLoadingKMZ(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropKMZ,
    accept: {
      "application/vnd.google-earth.kmz": [".kmz"],
      "application/vnd.google-earth.kml+xml": [".kml"],
    },
    multiple: true,
    noClick: false,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500"
      case "incomplete":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-16rem)]">
      {/* Left Panel: Folders and Files */}
      <Card className="overflow-hidden w-[400px] flex-shrink-0">
        <CardContent className="p-6 h-full flex flex-col">
          {driveConnecting && (
            <Alert className="mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Conectando con Google Drive...</AlertDescription>
            </Alert>
          )}

          {driveConnected && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Conectado a Google Drive • {driveFolders.length} carpetas encontradas
              </AlertDescription>
            </Alert>
          )}

          {!driveConnected && !driveConnecting && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Google Drive no conectado</span>
                <Button size="sm" variant="outline" onClick={connectToDrive}>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Conectar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              {isDragActive ? (
                <p className="text-sm text-blue-600 font-medium">Suelta los archivos KMZ aquí</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 font-medium">Arrastra archivos KMZ o haz clic</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {kmzFiles.length > 0 ? `${kmzFiles.length} archivo(s) cargado(s)` : "Soporta .kmz y .kml"}
                  </p>
                </div>
              )}
            </div>
            {loadingKMZ && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando archivos KMZ desde Google Drive...</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar campos, carpetas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Campos ({filteredCampos.length})</h3>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {filteredCampos.reduce((sum, c) => sum + c.hectares, 0).toLocaleString()} ha
            </Badge>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Cargando campos...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredCampos.map((campo) => (
                <div
                  key={campo.id}
                  onClick={() => handleCampoClick(campo)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCampo?.id === campo.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FolderOpen
                        className={`h-5 w-5 mt-0.5 ${selectedCampo?.id === campo.id ? "text-blue-600" : "text-blue-500"}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{campo.name}</p>
                          {campo.completenessScore !== undefined && (
                            <Badge
                              variant="outline"
                              className={completenessAnalyzer.getCompletenessColor(campo.completenessScore)}
                            >
                              {completenessAnalyzer.getCompletenessIcon(campo.completenessScore)}{" "}
                              {campo.completenessScore}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {campo.hectares} hectáreas • {campo.location}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <FileText className="h-3 w-3" />
                            {campo.files} archivos
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Layers className="h-3 w-3" />
                            {campo.rolNumbers} roles
                          </div>
                          {campo.driveFolder && (
                            <Badge className={`${getStatusColor(campo.status)} text-white text-xs`}>
                              {campo.status === "complete"
                                ? "Completo"
                                : campo.status === "incomplete"
                                  ? "Incompleto"
                                  : "Pendiente"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 ${selectedCampo?.id === campo.id ? "text-blue-600" : "text-gray-400"}`}
                    />
                  </div>
                </div>
              ))}

              {filteredCampos.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron campos</p>
                  <p className="text-sm text-gray-500 mt-2">Intenta con otros términos de búsqueda</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Container - Now takes full remaining width */}
      <Card className="overflow-hidden flex-1">
        <CardContent className="p-0 h-full relative">
          {selectedCampo && (
            <div className="absolute top-4 left-4 z-[999] max-w-md">
              <Card className="shadow-xl border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1">{selectedCampo.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedCampo.hectares} hectáreas • {selectedCampo.location}, {selectedCampo.region}
                      </p>
                      {selectedCampo.driveFolder && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCampo.driveFolder.extractedInfo.rolNumbers.map((rol, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              📋 {rol}
                            </Badge>
                          ))}
                          {selectedCampo.driveFolder.extractedInfo.year && (
                            <Badge variant="secondary" className="text-xs">
                              📅 {selectedCampo.driveFolder.extractedInfo.year}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedCampo(null)} className="flex-shrink-0">
                      ✕
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <KMZMapDisplay kmzFiles={kmzFiles} height="100%" />
        </CardContent>
      </Card>
    </div>
  )
}
