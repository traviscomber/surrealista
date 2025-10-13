"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Folder, Users, MessageSquare, CheckSquare, MapPin, Calendar, Map, Loader2, Plus } from "lucide-react"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@/lib/supabase/client"
import { TaskCreationDialog } from "@/components/tasks/task-creation-dialog"
import { driveService, type DriveFile, type DriveFolder } from "@/lib/google-drive/drive-service"

const KMZMapDisplay = dynamic(() => import("@/components/kmz/kmz-map-display").then((mod) => mod.KMZMapDisplay), {
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
  driveFiles?: DriveFile[]
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
  const [activeTab, setActiveTab] = useState("campos")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedCampo, setSelectedCampo] = useState<Campo | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [kmzFiles, setKmzFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([])
  const [driveLoading, setDriveLoading] = useState(false)
  const [camposData, setCamposData] = useState<Campo[]>([])

  const supabase = createBrowserClient()

  useEffect(() => {
    loadTasks()
    loadDriveFolders()
  }, [])

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
    setDriveLoading(true)
    try {
      console.log("[v0] Loading folders from Google Drive...")
      const kmzFiles = await driveService.searchKMZFiles()
      console.log("[v0] Found KMZ files:", kmzFiles.length)

      const folderMap = new Map<string, DriveFile[]>()

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
          let folderName = "Carpeta sin nombre"
          let location = "Ubicación desconocida"

          try {
            if (folderId !== "root") {
              const folderResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${folderId}?key=${driveService.apiKey}&fields=name`,
              )
              if (folderResponse.ok) {
                const folderData = await folderResponse.json()
                folderName = folderData.name
                location = folderName.split(" ")[0] || "Chile"
              }
            }
          } catch (error) {
            console.error("[v0] Error getting folder name:", error)
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

      console.log("[v0] Created campos from Drive:", camposFromDrive.length)
      setCamposData(camposFromDrive)
    } catch (error) {
      console.error("[v0] Error loading Drive folders:", error)
      setCamposData([
        { id: "1", name: "Valdivia 142 has", location: "Valdivia", files: 8 },
        { id: "2", name: "Pucon Lote 45", location: "Pucón", files: 12 },
        { id: "3", name: "Castro Parcela 23", location: "Castro", files: 15 },
      ])
    } finally {
      setDriveLoading(false)
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

    console.log("[v0] Campo clicked:", campo.name)

    try {
      if (campo.driveFiles && campo.driveFiles.length > 0) {
        console.log("[v0] Using Drive files for campo:", campo.driveFiles.length)
        setKmzFiles([])
      } else {
        const { data, error } = await supabase
          .from("kmz_collection")
          .select("*")
          .ilike("file_name", `%${campo.location}%`)
          .eq("is_active", true)
          .limit(5)

        if (error) {
          console.error("[v0] Error loading KMZ files:", error)
          setKmzFiles([])
        } else {
          console.log("[v0] Loaded KMZ files from DB:", data?.length || 0)

          const transformedData = (data || []).map((kmz: any) => ({
            id: kmz.id,
            name: kmz.file_name,
            placemarks:
              kmz.coordinates?.features?.map((feature: any) => ({
                name: feature.properties?.name || kmz.file_name,
                description: feature.properties?.description || "",
                coordinates:
                  feature.geometry?.type === "Polygon"
                    ? feature.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]])
                    : feature.geometry?.type === "Point"
                      ? [[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]]
                      : [],
                type: feature.geometry?.type || "Point",
              })) || [],
          }))

          setKmzFiles(transformedData)
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Búsqueda Unificada Sur-Realista</h1>
          <p className="text-gray-600">Sistema integrado de búsqueda para CAMPOS, Clientes, Comunicaciones y Tareas</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Google Drive Conectado
            </Badge>
            {driveLoading && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando carpetas...
              </Badge>
            )}
          </div>
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
          </TabsList>

          {/* CAMPOS Tab */}
          <TabsContent value="campos">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Folders List */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="h-5 w-5" />
                      Carpetas CAMPOS
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadDriveFolders}
                        disabled={driveLoading}
                        className="ml-auto"
                      >
                        {driveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {camposData.length === 0 && !driveLoading && (
                      <p className="text-sm text-gray-500 text-center py-4">No se encontraron carpetas</p>
                    )}
                    {camposData.map((campo) => (
                      <div
                        key={campo.id}
                        onClick={() => handleCampoClick(campo)}
                        className={`p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors ${
                          selectedCampo?.id === campo.id ? "bg-blue-100 border-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{campo.name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {campo.location}
                            </p>
                          </div>
                          <Badge>{campo.files} archivos</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Map View */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      Vista de Mapa - Polígonos KMZ
                      {selectedCampo && (
                        <Badge variant="outline" className="ml-auto">
                          {selectedCampo.name}
                        </Badge>
                      )}
                      {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    <div className="h-[500px] w-full rounded-xl overflow-hidden relative z-0">
                      <KMZMapDisplay kmzFiles={kmzFiles} height="500px" />
                    </div>
                  </CardContent>
                </Card>
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
                              <MapPin className="h-3 w-3" />
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
                      <Map className="h-5 w-5" />
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
                            <Calendar className="h-3 w-3" />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tasks List */}
              <div className="lg:col-span-1 space-y-4">
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
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={`p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors ${
                          selectedTask?.id === task.id ? "bg-blue-100 border-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && <p className="text-xs text-gray-600 mt-1">{task.description}</p>}
                            {task.location && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
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
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
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
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No hay tareas creadas</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Map with Task Locations */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      Ubicaciones de Tareas
                      {selectedTask && (
                        <Badge variant="outline" className="ml-auto">
                          {selectedTask.title}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    <div className="h-[500px] w-full rounded-xl overflow-hidden relative z-0">
                      <KMZMapDisplay
                        kmzFiles={[]}
                        height="500px"
                        centerCoordinates={getTaskCoordinates(selectedTask) || undefined}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <TaskCreationDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onTaskCreated={() => {
            loadTasks()
            setTaskDialogOpen(false)
          }}
        />
      </div>
    </div>
  )
}
