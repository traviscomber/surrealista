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
  BarChart3,
  HardDrive,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { TaskCreationDialog } from "@/components/tasks/task-creation-dialog"
import { TaskActionsPanel } from "@/components/tasks/task-actions-panel"
import { useGoogleDrive } from "@/lib/contexts/google-drive-context"
import dynamicImport from "next/dynamic"
import { WeeklyTaskSummary } from "@/components/tasks/weekly-task-summary"
import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"
import { SimpleDriveFolderView } from "@/components/google-drive/simple-drive-folder-view"
import { kmzReader } from "@/lib/kmz/kmz-reader"
import { kmzStorageService } from "@/lib/kmz/kmz-storage-service"
import { useRouter } from "next/navigation" // Added router for navigation

const KMZMapDisplay = dynamicImport(() => import("@/components/kmz/kmz-map-display").then((mod) => mod.KMZMapDisplay), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-xl">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  ),
})

interface Client {
  id: string
  first_name: string
  last_name: string
  company_name?: string
  status: "hot" | "warm" | "cold"
  email?: string
  phone?: string
  address?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  main_interest?: string
  locations_of_interest?: string[]
  budget_min?: number
  budget_max?: number
  last_contact_date?: string
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
  const [activeTab, setActiveTab] = useState("campos") // Set campos as default tab
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
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState("")
  const [showQuickTask, setShowQuickTask] = useState(false)

  const { driveService, isConnected, isLoading: driveLoading, reconnect } = useGoogleDrive()

  const supabase = createBrowserClient()

  const router = useRouter() // Added router instance

  useEffect(() => {
    getCurrentUser()
    loadTasks()
    loadCamposMetadata()
    loadClients()
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
    console.log("[v0] Client clicked:", client.first_name, client.last_name, "at", client.latitude, client.longitude)
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

  const loadClients = async () => {
    console.log("[v0] Loading clients from database...")
    setLoadingClients(true)

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("last_contact_date", { ascending: false })

      if (error) {
        console.error("[v0] Error loading clients:", error)
        return
      }

      console.log("[v0] Loaded", data?.length || 0, "clients from database")

      // Transform database clients to match interface
      const transformedClients = (data || []).map((client: any) => ({
        id: client.id,
        first_name: client.first_name || "",
        last_name: client.last_name || "",
        company_name: client.company_name,
        status: client.status || "cold",
        email: client.email,
        phone: client.phone || client.mobile,
        address: client.address,
        city: client.city,
        region: client.region,
        latitude: client.latitude,
        longitude: client.longitude,
        main_interest: client.main_interest,
        locations_of_interest: client.locations_of_interest,
        budget_min: client.budget_min,
        budget_max: client.budget_max,
        last_contact_date: client.last_contact_date,
      }))

      setClients(transformedClients)
    } catch (err) {
      console.error("[v0] Exception loading clients:", err)
    } finally {
      setLoadingClients(false)
    }
  }

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

  const handleQuickTaskCreate = async () => {
    if (!quickTaskTitle.trim()) return

    try {
      const { error } = await supabase.from("tasks").insert([
        {
          title: quickTaskTitle,
          status: "pending",
          priority: "medium",
          created_by: currentUser?.email || "system",
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      setQuickTaskTitle("")
      setShowQuickTask(false)
      loadTasks()
      console.log("[v0] Quick task created:", quickTaskTitle)
    } catch (error) {
      console.error("[v0] Error creating quick task:", error)
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
          <TabsList className="grid w-full grid-cols-6 mb-6 h-auto">
            <TabsTrigger
              value="campos"
              className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Folder className="h-4 w-4" />
              CAMPOS
            </TabsTrigger>
            <TabsTrigger
              value="drive"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <HardDrive className="h-4 w-4" />
              Google Drive
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

          <TabsContent value="campos" className="h-[calc(100vh-20rem)] min-h-[600px]">
            <CAMPOSFolderView />
          </TabsContent>

          <TabsContent value="drive" className="h-[calc(100vh-16rem)] min-h-[600px]">
            <SimpleDriveFolderView />
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
                      <Badge variant="outline" className="ml-auto">
                        {clients.length} clientes
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {loadingClients && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      </div>
                    )}
                    {!loadingClients && clients.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No hay clientes registrados</p>
                        <p className="text-sm text-gray-400 mt-1 mb-4">
                          Importa clientes desde Excel o agrégalos manualmente
                        </p>
                        <div className="flex flex-col gap-2">
                          <Button onClick={() => router.push("/admin/clientes")} className="w-full gap-2" size="sm">
                            <FileSpreadsheet className="h-4 w-4" />
                            Importar desde Excel
                          </Button>
                          <Button
                            onClick={() => {
                              // TODO: Implement manual client creation
                              alert("Función de agregar cliente manual en desarrollo")
                            }}
                            variant="outline"
                            className="w-full gap-2"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar Manual
                          </Button>
                        </div>
                      </div>
                    )}
                    {!loadingClients && clients.length > 0 && (
                      <>
                        <div className="flex gap-2 mb-3">
                          <Button
                            onClick={() => router.push("/admin/clientes")}
                            size="sm"
                            variant="outline"
                            className="w-full gap-2"
                          >
                            <Upload className="h-3 w-3" />
                            Importar más clientes
                          </Button>
                        </div>
                        {clients.map((client) => (
                          <div
                            key={client.id}
                            onClick={() => handleClientClick(client)}
                            className={`p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors ${
                              selectedClient?.id === client.id ? "bg-blue-100 border-blue-500" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {client.first_name} {client.last_name}
                                </p>
                                {client.company_name && <p className="text-sm text-gray-500">{client.company_name}</p>}
                                {client.latitude && client.longitude && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <MapPin className="h-4 w-4" />
                                    {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
                                  </p>
                                )}
                                {client.city && client.region && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {client.city}, {client.region}
                                  </p>
                                )}
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
                      </>
                    )}
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
                          {selectedClient.first_name} {selectedClient.last_name}
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
                          selectedClient && selectedClient.latitude && selectedClient.longitude
                            ? { lat: selectedClient.latitude, lng: selectedClient.longitude }
                            : undefined
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
                      <div className="ml-auto flex items-center gap-2">
                        {/* Quick action icons */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowQuickTask(!showQuickTask)}
                          className="text-xs"
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Rápida
                        </Button>
                        <Button size="sm" onClick={() => setTaskDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Nueva
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {showQuickTask && (
                      <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-900">Crear Tarea Rápida</span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Título de la tarea..."
                            value={quickTaskTitle}
                            onChange={(e) => setQuickTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleQuickTaskCreate()
                              }
                            }}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={handleQuickTaskCreate} disabled={!quickTaskTitle.trim()}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-emerald-700">Presiona Enter o clic en ✓ para crear</p>
                      </div>
                    )}

                    {/* Filter/sort quick actions */}
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          /* Filter urgent */
                        }}
                        className="text-xs"
                      >
                        <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                        Urgente
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          /* Filter today */
                        }}
                        className="text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1 text-blue-500" />
                        Hoy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          /* Filter location */
                        }}
                        className="text-xs"
                      >
                        <MapPin className="h-3 w-3 mr-1 text-purple-500" />
                        Con ubicación
                      </Button>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
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
                          <p className="text-gray-500 font-medium text-lg">Selecciona una tarea</p>
                          <p className="text-sm text-gray-400 mt-2 text-center max-w-sm">
                            Haz clic en una tarea de la lista para ver sus detalles y opciones de gestión
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
