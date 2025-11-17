"use client"

import type React from "react"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Folder, Users, MessageSquare, CheckSquare, MapPin, MapIcon, Loader2, Plus, HardDrive, FileSpreadsheet } from 'lucide-react'
import { createBrowserClient } from "@/lib/supabase/client"
import { TaskCreationDialog } from "@/components/tasks/task-creation-dialog"
import { useGoogleDrive } from "@/lib/contexts/google-drive-context"
import dynamicImport from "next/dynamic"
import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"
import { SimpleDriveFolderView } from "@/components/google-drive/simple-drive-folder-view"
import { kmzReader } from "@/lib/kmz/kmz-reader"
import { kmzStorageService } from "@/lib/kmz/kmz-storage-service"
import { useRouter } from 'next/navigation' // Added router for navigation
import { RUTBulkValidationPanel } from "@/components/client-management/rut-validation-panel"
import { CommunicationsManager } from "@/components/communications/communications-manager"
import { ClientRepositoryDashboard } from "@/components/client-management/client-repository-dashboard"

const KMZMapDisplay = dynamicImport(() => import("@/components/kmz/kmz-map-display").then((mod) => mod.KMZMapDisplay), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-xl">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  ),
})

const CAMPOSFolderView = dynamicImport(
  () => import("@/components/campos/campos-folder-view").then((mod) => ({ default: mod.CAMPOSFolderView })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    ),
  }
)

const SimpleDriveFolderView = dynamicImport(
  () => import("@/components/google-drive/simple-drive-folder-view").then((mod) => ({ default: mod.SimpleDriveFolderView })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    ),
  }
)

const CommunicationsManager = dynamicImport(
  () => import("@/components/communications/communications-manager").then((mod) => ({ default: mod.CommunicationsManager })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    ),
  }
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

  const { driveService, isConnected, isLoading: driveLoading, reconnect } = useGoogleDrive()

  const supabase = createBrowserClient()

  const router = useRouter() // Added router instance

  useEffect(() => {
    getCurrentUser()
    loadTasks()
  }, [])

  useEffect(() => {
    if (isConnected && driveService) {
      console.log("[v0] Drive status changed, loading folders...")
      loadDriveFolders()
    }
  }, [isConnected, driveService])

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
      setTaskRefreshTrigger((prev) => prev + 1)
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
          <TabsList className="grid w-full grid-cols-4 mb-6 h-auto">
            <TabsTrigger
              value="campos"
              className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
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
              value="drive"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <HardDrive className="h-4 w-4" />
              Google Drive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campos" className="h-[calc(100vh-20rem)] min-h-[600px]">
            <CAMPOSFolderView />
          </TabsContent>

          <TabsContent value="clientes">
            <ClientRepositoryDashboard />
          </TabsContent>

          <TabsContent value="comunicaciones">
            <CommunicationsManager />
          </TabsContent>

          <TabsContent value="drive" className="h-[calc(100vh-16rem)] min-h-[600px]">
            <SimpleDriveFolderView />
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
