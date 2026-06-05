"use client"

import type React from "react"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Folder, Users, MessageSquare, Loader2, HardDrive, CheckSquare, MapPin, Database } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { TaskCreationDialog } from "@/components/tasks/task-creation-dialog"
import { TasksManager } from "@/components/tasks/tasks-manager"
import dynamicImport from "next/dynamic"
import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"
import { kmzReader } from "@/lib/kmz/kmz-reader"
import { kmzStorageService } from "@/lib/kmz/kmz-storage-service"
import { useRouter } from "next/navigation" // Added router for navigation
import { ClientRepositoryDashboard } from "@/components/client-management/client-repository-dashboard"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const KMZMapDisplay = dynamicImport(() => import("@/components/kmz/kmz-map-display").then((mod) => mod.KMZMapDisplay), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-xl">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

const SimpleDriveFolderViewDynamic = dynamicImport(
  () =>
    import("@/components/google-drive/simple-drive-folder-view").then((mod) => ({
      default: mod.SimpleDriveFolderView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  },
)

const CommunicationsManagerDynamic = dynamicImport(
  () =>
    import("@/components/communications/communications-manager").then((mod) => ({
      default: mod.CommunicationsManager,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  },
)

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
  rut?: string // Added RUT field
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
  const [quickTaskTitle, setQuickTaskTitle] = useState("")
  const [showQuickTask, setShowQuickTask] = useState(false)
  const [showRUTValidation, setShowRUTValidation] = useState(false)
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)

  const supabase = createBrowserClient()

  const router = useRouter() // Added router instance

  useEffect(() => {
    const controller = new AbortController()

    const initializeData = async () => {
      try {
        await getCurrentUser()
        await loadTasks()
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("[v0] Error initializing data:", error)
        }
      }
    }

    initializeData()

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    // Load KMZ data from Supabase on mount
    loadKMZFromSupabase()
  }, [])

  useEffect(() => {
    if (activeTab === "clientes") {
      // The ClientRepositoryDashboard component handles its own data loading with pagination
    }
  }, [activeTab])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
      console.log("[v0] Current user:", user?.email || "No user logged in")
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("[v0] Error getting user:", error)
      }
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
      setTaskRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("[v0] Error loading tasks:", error)
      }
    }
  }

  const loadKMZFromSupabase = async () => {
    console.log("[v0] Loading KMZ data from Supabase...")
    await loadCamposMetadata()
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
    <div className="min-h-screen bg-background px-4 py-4">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Sur-Realista</h1>
          <p className="text-sm text-muted-foreground">Sistema integrado de gestión para CAMPOS, Clientes, Comunicaciones y Tareas</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4 h-auto">
            <TabsTrigger
              value="campos"
              className="flex items-center gap-2 data-[state=active]:bg-sage data-[state=active]:text-white"
            >
              <Folder className="h-4 w-4" />
              CAMPOS
            </TabsTrigger>
            <TabsTrigger
              value="clientes"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-sage data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger
              value="comunicaciones"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-sage data-[state=active]:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              Comunicaciones
            </TabsTrigger>
            <TabsTrigger
              value="tareas"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-sage data-[state=active]:text-white"
            >
              <CheckSquare className="h-4 w-4" />
              Tareas
            </TabsTrigger>
            <TabsTrigger
              value="drive"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-sage data-[state=active]:text-white"
            >
              <HardDrive className="h-4 w-4" />
              Google Drive
            </TabsTrigger>
            <TabsTrigger
              value="kmz"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-sage data-[state=active]:text-white"
            >
              <MapPin className="h-4 w-4" />
              KMZ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campos" className="h-[calc(100vh-20rem)] min-h-[600px]">
            <CAMPOSFolderView />
          </TabsContent>

          <TabsContent value="clientes">
            <ClientRepositoryDashboard />
          </TabsContent>

          <TabsContent value="comunicaciones">
            <CommunicationsManagerDynamic />
          </TabsContent>

          <TabsContent value="tareas" className="h-[calc(100vh-20rem)] min-h-[600px]">
            <TasksManager tasks={tasks} refreshTrigger={taskRefreshTrigger} onTasksUpdate={() => loadTasks()} />
          </TabsContent>

          <TabsContent value="drive" className="h-[calc(100vh-16rem)] min-h-[600px]">
            <SimpleDriveFolderViewDynamic />
          </TabsContent>

          <TabsContent value="kmz" className="h-[calc(100vh-16rem)] min-h-[600px]">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* KMZ Search Access */}

                {/* Admin KMZ Collection Access */}
                <Link href="/admin/kmz-collection">
                  <div className="h-full group cursor-pointer">
                    <div className="relative bg-card rounded-2xl border p-8 hover:border-primary transition-all hover:shadow-xl hover:-translate-y-1 h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Database className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Administración de Colección</h3>
                        <p className="text-muted-foreground mb-6">
                          Gestiona y visualiza la colección de 338 archivos KMZ. Carga, indexa y administra las ubicaciones de todos tus archivos.
                        </p>
                        <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                          Administrar
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
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
