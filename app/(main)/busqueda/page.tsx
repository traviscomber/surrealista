"use client"

import type React from "react"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Folder,
  Users,
  MessageSquare,
  CheckSquare,
  MapPin,
  Calendar,
  MapIcon,
  Loader2,
  Plus,
  Upload,
  BarChart3,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { TaskCreationDialog } from "@/components/tasks/task-creation-dialog"
import { TaskActionsPanel } from "@/components/tasks/task-actions-panel"
import { useGoogleDrive } from "@/lib/contexts/google-drive-context"
import dynamicImport from "next/dynamic"
import { kmzStorageService } from "@/lib/kmz/kmz-storage-service"
import { kmzReader } from "@/lib/kmz/kmz-reader"
import { WeeklyTaskSummary } from "@/components/tasks/weekly-task-summary"
import { SimpleDriveFolderView } from "@/components/google-drive/simple-drive-folder-view"

const KMZMapDisplay = dynamicImport(() => import("@/components/kmz/kmz-map-display").then((mod) => mod.KMZMapDisplay), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-xl">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  ),
})

interface Client {
  name: string
  company: string
  status: "hot" | "warm" | "cold"
  lat: number
  lng: number
}

interface Campo {
  id: string
  name: string
  location: string
  files: number
  kmzFileId?: string
  driveFiles?: any[]
}

interface KMZFile {
  id: string
  file_name: string
  coordinates: any
  placemarks_count: number
}

interface Task {
  id: string
  title: string
  description: string
  location: string
  priority: string
  status: string
  due_date: string
  created_at: string
}

export default function UnifiedSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("tareas") // Changed default active tab from "campos" to "tareas"
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedCampo, setSelectedCampo] = useState<Campo | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [kmzFiles, setKmzFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [camposData, setCamposData] = useState<Campo[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingKMZ, setUploadingKMZ] = useState(false)
  const [selectedFromFolders, setSelectedFromFolders] = useState<any[]>([]) // Added state for selected KMZ files from folder view

  const { driveService, isConnected, isLoading: driveLoading, reconnect } = useGoogleDrive()

  const supabase = createBrowserClient()

  useEffect(() => {
    getCurrentUser()
    loadTasks()
    loadCamposMetadata()
  }, [])

  useEffect(() => {
    if (isConnected && driveService) {
      console.log("[v0] Drive status changed, loading folders...")
      loadDriveFolders()
    }
  }, [isConnected, driveService])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
      console.log("[v0] Current user:", user?.email || "No user logged in")
    } catch (error) {
      console.error("[v0] Error getting user:", error)
    }
  }

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error loading tasks:", error)
    }
  }

  const loadDriveFolders = async () => {
    if (!driveService || !isConnected) {
      console.log("[v0] Google Drive not connected, cannot load folders")
      setCamposData([])
      return
    }

    try {
      console.log("[v0] Loading folders from Google Drive...")

      const kmzFiles = await driveService.searchKMZFiles()
      console.log("[v0] Found KMZ files:", kmzFiles.length)
      console.log(
        "[v0] KMZ file names from Drive:",
        kmzFiles.map((f) => f.name),
      )

      const folderMap = new Map<string, any[]>()

      for (const file of kmzFiles) {
        const parentId = file.parents?.[0] || "root"
        if (!folderMap.has(parentId)) {
          folderMap.set(parentId, [])
        }
        folderMap.get(parentId)?.push(file)
      }

      const camposFromDrive: Campo[] = []
      let index = 1

      for (const [folderId, files] of folderMap.entries()) {
        if (files.length > 0) {
          let folderName = "Sin nombre"
          let location = "Chile"

          try {
            if (folderId !== "root") {
              const apiKey = driveService.apiKey
              if (apiKey) {
                const folderResponse = await fetch(
                  `https://www.googleapis.com/drive/v3/files/${folderId}?key=${apiKey}&fields=name`,
                )
                if (folderResponse.ok) {
                  const folderData = await folderResponse.json()
                  folderName = folderData.name
                  console.log("[v0] Exact folder name from Drive:", folderName)

                  const firstWord = folderName.split(" ")[0]
                  if (firstWord && firstWord.length > 2) {
                    location = firstWord
                  }
                }
              }
            } else {
              folderName = files[0]?.name?.split(".")[0] || "Archivos raíz"
              location = "Drive raíz"
            }
          } catch (error) {
            console.error("[v0] Error getting folder name:", error)
            folderName = files[0]?.name?.split(".")[0] || `Carpeta ${index}`
          }

          camposFromDrive.push({
            id: `drive-${index}`,
            name: folderName,
            location: location,
            files: files.length,
            driveFiles: files,
          })
          index++
        }
      }

      console.log(
        "[v0] Created campos from Drive with exact names:",
        camposFromDrive.map((c) => c.name),
      )
      setCamposData(camposData.concat(camposFromDrive))
    } catch (error: any) {
      console.error("[v0] Error loading Drive folders:", error)
      setCamposData([])
    }
  }

  const loadCamposMetadata = async () => {
    console.log("[v0] Loading campos metadata (lightweight)...")

    try {
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("id, file_name, region, placemarks_count, file_path")
        .eq("is_active", true)
        .order("region", { ascending: true })

      if (error) {
        console.error("[v0] Error loading metadata:", error)
        return
      }

      console.log("[v0] Loaded metadata for", data?.length || 0, "KMZ files")

      // Group by region to build campos structure
      const regionMap = new Map<string, any[]>()

      data?.forEach((record) => {
        const region = record.region || "Sin Región"
        if (!regionMap.has(region)) {
          regionMap.set(region, [])
        }
        regionMap.get(region)?.push(record)
      })

      // Build campos from regions
      const camposFromMetadata: Campo[] = []
      let index = 1

      for (const [region, files] of regionMap.entries()) {
        camposFromMetadata.push({
          id: `region-${index}`,
          name: region,
          location: region,
          files: files.length,
        })
        index++
      }

      console.log("[v0] Built", camposFromMetadata.length, "campos from metadata")
      setCamposData(camposData.concat(camposFromMetadata))
    } catch (err) {
      console.error("[v0] Error loading campos metadata:", err)
    }
  }

  const handleClientClick = (client: Client) => {
    setSelectedClient(client)
    setSelectedCampo(null)
    setSelectedTask(null)
    setKmzFiles([])
    console.log("[v0] Client clicked:", client.name, "at", client.lat, client.lng)
  }

  const handleCampoClick = async (campo: Campo) => {
    setSelectedCampo(campo)
    setSelectedClient(null)
    setSelectedTask(null)
    setLoading(true)

    console.log("[v0] Loading KMZ files for region:", campo.location)

    try {
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("region", campo.location)
        .order("file_name", { ascending: true })

      if (error) {
        console.error("[v0] Error loading KMZ files for region:", error)
        setKmzFiles([])
      } else {
        console.log("[v0] Loaded", data?.length || 0, "KMZ files for region:", campo.location)

        const transformedKMZ = (data || []).map((record: any) => {
          const placemarks = (record.coordinates || []).map((coordArray: any, index: number) => {
            let geometryType = "Point"
            let coordinates = coordArray

            if (Array.isArray(coordArray) && coordArray.length > 3) {
              if (Array.isArray(coordArray[0]) && coordArray[0].length >= 2 && typeof coordArray[0][0] === "number") {
                geometryType = "Polygon"
                coordinates = coordArray
              }
            }

            return {
              name: `${record.file_name} - ${geometryType === "Polygon" ? "Polígono" : "Punto"} ${index + 1}`,
              type: geometryType,
              coordinates: coordinates,
              description: record.description || "",
              properties: {
                rol: record.rol_numbers?.[index] || "",
                category: record.category || "general",
              },
            }
          })

          return {
            fileName: record.file_name,
            placemarks: placemarks,
            bounds: record.bounds,
            metadata: {
              id: record.id,
              category: record.category,
              rolNumbers: record.rol_numbers || [],
              placemarks_count: record.placemarks_count,
            },
          }
        })

        setKmzFiles(transformedKMZ)
      }
    } catch (err) {
      console.error("[v0] Exception loading KMZ:", err)
      setKmzFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setSelectedClient(null)
    setSelectedCampo(null)
    setKmzFiles([])
    console.log("[v0] Task clicked:", task.title, "location:", task.location)
  }

  const getTaskCoordinates = (task: Task | null) => {
    if (!task || !task.location) return null
    const coords = task.location.split(",").map((c) => Number.parseFloat(c.trim()))
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      return { lat: coords[0], lng: coords[1] }
    }
    return null
  }

  const clients: Client[] = [
    { name: "Carlos Mendoza", company: "Inversiones del Sur", status: "hot", lat: -39.8196, lng: -73.2452 },
    { name: "Ana Silva", company: "Turismo Patagonia", status: "warm", lat: -39.2819, lng: -71.9489 },
    { name: "Roberto Fernández", company: "Forestal Los Andes", status: "cold", lat: -42.4827, lng: -73.7615 },
  ]

  const handleTabChange = (value: string) => {
    console.log("[v0] Tab changed to:", value)
    setActiveTab(value)
  }

  // KMZ files are now loaded on-demand by region when a campo is selected

  const detectCategory = (path: string): string => {
    const lowerPath = path.toLowerCase()
    if (lowerPath.includes("campo")) return "campo"
    if (lowerPath.includes("fundo")) return "fundo"
    if (lowerPath.includes("parcela")) return "parcela"
    if (lowerPath.includes("terreno")) return "terreno"
    if (lowerPath.includes("casa")) return "casa"
    return "general"
  }

  const handleOfflineKMZUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingKMZ(true)
    console.log("[v0] Uploading", files.length, "KMZ files from local computer...")

    try {
      const uploadedKMZ = []

      for (const file of Array.from(files)) {
        try {
          console.log("[v0] Processing offline KMZ file:", file.name)

          // Parse the KMZ file
          const kmzData = await kmzReader.readKMZFile(file)

          try {
            const saveResult = await kmzStorageService.saveKMZ({
              file_name: file.name,
              file_path: "offline-upload",
              description: kmzData.metadata?.description,
              metadata: kmzData.metadata,
              placemarks_count: kmzData.placemarks.length,
              rol_numbers: kmzReader.extractPropertyRoles(kmzData),
              bounds: kmzData.bounds,
              coordinates: kmzData.placemarks.map((p) => p.coordinates),
              category: "offline",
              created_by: currentUser?.id,
            })

            if (saveResult.success) {
              console.log("[v0] Offline KMZ saved to database:", file.name)
            }
          } catch (dbError) {
            console.error("[v0] Error saving KMZ to database:", dbError)
            // Continue to display the file even if database save fails
          }

          uploadedKMZ.push({
            id: file.name,
            name: file.name,
            placemarks: kmzData.placemarks,
          })
        } catch (error) {
          console.error("[v0] Error processing offline KMZ file:", file.name, error)
        }
      }

      // Add uploaded KMZ to the map
      if (uploadedKMZ.length > 0) {
        setKmzFiles((prev) => [...prev, ...uploadedKMZ])
        console.log("[v0] Successfully uploaded", uploadedKMZ.length, "KMZ files")
      }
    } catch (error) {
      console.error("[v0] Error uploading offline KMZ files:", error)
    } finally {
      setUploadingKMZ(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFolderKMZSelection = async (driveItems: any[]) => {
    console.log("[v0] Loading KMZ data for", driveItems.length, "selected files")
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      // Get KMZ data from Supabase for the selected files
      const fileNames = driveItems.map((item) => item.name)

      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .in("file_name", fileNames)

      if (error) {
        console.error("[v0] Error loading KMZ data:", error)
        setKmzFiles([])
        return
      }

      console.log("[v0] Loaded KMZ data for", data?.length || 0, "files")

      // Transform to map format
      const transformedKMZ = (data || []).map((record: any) => {
        const placemarks = (record.coordinates || []).map((coordArray: any, index: number) => {
          let geometryType = "Point"
          let coordinates = coordArray

          if (Array.isArray(coordArray) && coordArray.length > 3) {
            if (Array.isArray(coordArray[0]) && coordArray[0].length >= 2 && typeof coordArray[0][0] === "number") {
              geometryType = "Polygon"
              coordinates = coordArray
            }
          }

          return {
            name: `${record.file_name} - ${geometryType === "Polygon" ? "Polígono" : "Punto"} ${index + 1}`,
            type: geometryType,
            coordinates: coordinates,
            description: record.description || "",
            properties: {
              rol: record.rol_numbers?.[index] || "",
              category: record.category || "general",
            },
          }
        })

        return {
          fileName: record.file_name,
          placemarks: placemarks,
          bounds: record.bounds,
          metadata: {
            id: record.id,
            category: record.category,
            rolNumbers: record.rol_numbers || [],
            placemarks_count: record.placemarks_count,
          },
        }
      })

      setKmzFiles(transformedKMZ)
    } catch (err) {
      console.error("[v0] Error loading KMZ data:", err)
      setKmzFiles([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Búsqueda Unificada Sur-Realista</h1>
          <p className="text-gray-600">Sistema integrado de búsqueda para CAMPOS, Clientes, Comunicaciones y Tareas</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar en todos los módulos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 h-auto">
            <TabsTrigger
              value="campos"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Folder className="h-4 w-4" />
              CAMPOS
            </TabsTrigger>
            <TabsTrigger
              value="clientes"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger
              value="comunicaciones"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Comunicaciones
            </TabsTrigger>
            <TabsTrigger
              value="tareas"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CheckSquare className="h-4 w-4" />
              Nuevas Tareas
            </TabsTrigger>
            <TabsTrigger
              value="resumen"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              Resumen Semanal
            </TabsTrigger>
          </TabsList>

          {/* CAMPOS Tab */}
          <TabsContent value="campos" className="h-[calc(100vh-16rem)] min-h-[600px]">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
              {/* Folder Structure */}
              <div className="h-full overflow-hidden lg:col-span-1">
                <SimpleDriveFolderView
                  apiKey="AIzaSyB6AVo8HT0RyEmiu8YRKj3skR3ujXyjHTU"
                  onKMZSelected={handleFolderKMZSelection}
                />
              </div>

              {/* Map Display */}
              <div className="h-full relative lg:col-span-3">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapIcon className="h-5 w-5" />
                      Visualización de Campos
                      {kmzFiles.length > 0 && (
                        <Badge variant="outline" className="ml-auto">
                          {kmzFiles.length} archivo{kmzFiles.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    {loading ? (
                      <div className="h-full flex items-center justify-center bg-slate-100 rounded-xl">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      </div>
                    ) : kmzFiles.length > 0 ? (
                      <div className="h-full w-full rounded-xl overflow-hidden relative z-0">
                        <KMZMapDisplay kmzFiles={kmzFiles} height="100%" />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl">
                        <MapIcon className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Selecciona una carpeta o archivo</p>
                        <p className="text-sm text-gray-400 mt-2 text-center max-w-sm">
                          Haz clic en las carpetas de la izquierda para visualizar los campos en el mapa
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Offline KMZ Upload Button */}
                <div className="absolute top-4 right-4 z-[1000]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".kmz,.kml"
                    multiple
                    onChange={handleOfflineKMZUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingKMZ}
                    className="bg-white shadow-lg hover:bg-gray-50"
                  >
                    {uploadingKMZ ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Cargar KMZ Offline
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Clientes Tab */}
          <TabsContent value="clientes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Clients List */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Lista de Clientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {clients.map((client, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleClientClick(client)}
                        className={`p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors ${
                          selectedClient?.name === client.name ? "bg-blue-100 border-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.company}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="h-4 w-4" />
                              {client.lat.toFixed(4)}, {client.lng.toFixed(4)}
                            </p>
                          </div>
                          <Badge
                            className={
                              client.status === "hot"
                                ? "bg-red-100 text-red-700"
                                : client.status === "warm"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                            }
                          >
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Map with Client Locations */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapIcon className="h-5 w-5" />
                      Ubicaciones de Clientes
                      {selectedClient && (
                        <Badge variant="outline" className="ml-auto">
                          {selectedClient.name}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    <div className="h-[500px] w-full rounded-xl overflow-hidden relative z-0">
                      <KMZMapDisplay
                        kmzFiles={[]}
                        height="500px"
                        centerCoordinates={
                          selectedClient ? { lat: selectedClient.lat, lng: selectedClient.lng } : undefined
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Comunicaciones Tab */}
          <TabsContent value="comunicaciones">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comunicaciones (WZP, GMAIL)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: "WhatsApp",
                      from: "Carlos Mendoza",
                      subject: "Consulta sobre terreno en Valdivia",
                      date: "2024-01-15",
                    },
                    {
                      type: "Gmail",
                      from: "Ana Silva",
                      subject: "Cotización proyecto Pucón",
                      date: "2024-01-14",
                    },
                    {
                      type: "WhatsApp",
                      from: "Roberto Fernández",
                      subject: "Seguimiento parcela Castro",
                      date: "2024-01-13",
                    },
                  ].map((comm, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{comm.type}</Badge>
                            <span className="font-medium">{comm.from}</span>
                          </div>
                          <p className="text-sm text-gray-700">{comm.subject}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {comm.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tareas Tab */}
          <TabsContent value="tareas">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tasks List - Now takes more space */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      Nuevas Tareas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full mb-4" onClick={() => setTaskDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Tarea
                    </Button>
                    <div className="max-h-[700px] overflow-y-auto space-y-2 pr-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={`p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors ${
                            selectedTask?.id === task.id ? "bg-blue-100 border-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                              )}
                              {task.location && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                                  <MapPin className="h-4 w-4" />
                                  {task.location}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={
                                task.priority === "urgent" || task.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : task.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                              }
                            >
                              {task.priority === "urgent" || task.priority === "high"
                                ? "Urgente"
                                : task.priority === "medium"
                                  ? "Media"
                                  : "Baja"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={
                                task.status === "completed"
                                  ? "bg-green-50 text-green-700"
                                  : task.status === "in_progress"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-gray-50 text-gray-700"
                              }
                            >
                              {task.status === "completed"
                                ? "Completada"
                                : task.status === "in_progress"
                                  ? "En progreso"
                                  : "Pendiente"}
                            </Badge>
                            {task.due_date && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <div className="text-center py-12">
                          <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">No hay tareas creadas</p>
                          <p className="text-sm text-gray-400 mt-2 text-center max-w-sm">
                            Crea tu primera tarea usando el botón de arriba
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Task Details Panel - Now takes equal space */}
              <div className="space-y-4">
                {selectedTask ? (
                  <TaskActionsPanel
                    task={selectedTask}
                    onTaskUpdated={loadTasks}
                    onTaskDeleted={() => {
                      setSelectedTask(null)
                      loadTasks()
                    }}
                  />
                ) : (
                  <Card className="h-full min-h-[400px]">
                    <CardContent className="flex flex-col items-center justify-center h-full py-12">
                      <CheckSquare className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium text-lg">Selecciona una tarea</p>
                      <p className="text-sm text-gray-400 mt-2 text-center max-w-sm">
                        Haz clic en una tarea de la lista para ver sus detalles y opciones de gestión
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resumen">
            <WeeklyTaskSummary />
          </TabsContent>
        </Tabs>

        <TaskCreationDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          currentUser={currentUser}
          onTaskCreated={() => {
            loadTasks()
            setTaskDialogOpen(false)
          }}
        />
      </div>
    </div>
  )
}
