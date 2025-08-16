"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Search,
  FolderOpen,
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  FolderSyncIcon as Sync,
  Activity,
  Users,
  Shield,
  TrendingUp,
  Clock,
  HardDrive,
  Wifi,
  CheckCircle,
  XCircle,
  Eye,
  Share2,
  Settings,
  Filter,
  Grid,
  List,
  BarChart3,
} from "lucide-react"

interface FileItem {
  id: string
  name: string
  type: "folder" | "document" | "image" | "video" | "audio" | "archive"
  size: string
  modified: string
  owner: string
  shared: boolean
  synced: boolean
  thumbnail?: string
  path: string
}

interface SyncStatus {
  status: "idle" | "syncing" | "completed" | "error"
  progress: number
  filesProcessed: number
  totalFiles: number
  currentFile: string
  speed: string
  timeRemaining: string
}

export default function GoogleDriveIntegrationPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: "idle",
    progress: 0,
    filesProcessed: 0,
    totalFiles: 0,
    currentFile: "",
    speed: "0 MB/s",
    timeRemaining: "0s",
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Datos de ejemplo para el dashboard
  const storageStats = {
    used: 0.8, // Datos reales muy bajos para Etapa 1
    total: 15, // Espacio asignado inicial
    files: 47, // Solo archivos de los 5 casos de éxito
    folders: 5, // Los 5 casos de éxito identificados
    shared: 5, // Casos de éxito compartidos por Juan Navarro
    recent: 5, // Casos recién identificados
  }

  const recentActivity = [
    {
      action: "Identificación",
      file: "Valdivia 142 has Teresa F...",
      time: "2 días",
      user: "Juan Navarro",
      status: "completed",
    },
    { action: "API Key", file: "Google Drive API", time: "1 día", user: "Sur-Realista", status: "completed" },
    { action: "Configuración", file: "Integración Google Drive", time: "30 min", user: "Sistema", status: "completed" },
    { action: "Análisis", file: "Estructura de carpetas", time: "15 min", user: "Sistema", status: "completed" },
    { action: "Preparación", file: "Migración data real", time: "5 min", user: "Sistema", status: "completed" },
  ]

  const fileItems: FileItem[] = [
    {
      id: "1",
      name: "Valdivia 142 has Teresa F...",
      type: "folder",
      size: "6.1 MB",
      modified: "Aug 12, 2025",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142",
    },
    {
      id: "2",
      name: "fotos",
      type: "folder",
      size: "—",
      modified: "Aug 12, 2025",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142/fotos",
    },
    {
      id: "3",
      name: "fotos cel",
      type: "folder",
      size: "—",
      modified: "Aug 12, 2025",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142/fotos cel",
    },
    {
      id: "4",
      name: "Fotos enero 2024",
      type: "folder",
      size: "—",
      modified: "Aug 12, 2025",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142/Fotos enero 2024",
    },
    {
      id: "5",
      name: "Campo Iñipulli 140_has.kmz",
      type: "archive",
      size: "2 KB",
      modified: "Sep 13, 2023",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142/Campo Iñipulli 140_has.kmz",
    },
    {
      id: "6",
      name: "Fundo Iñipulli_140_110124_compressed.pdf",
      type: "document",
      size: "5.1 MB",
      modified: "Jan 12, 2024",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142/Fundo Iñipulli_140_110124_compressed.pdf",
    },
    {
      id: "7",
      name: "MARIOUINAfoto.pdf",
      type: "document",
      size: "1.8 MB",
      modified: "Sep 13, 2023",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142/MARIOUINAfoto.pdf",
    },
    {
      id: "8",
      name: "Orden de Venta Iñipulli.docx",
      type: "document",
      size: "38 KB",
      modified: "Nov 23, 2023",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142/Orden de Venta Iñipulli.docx",
    },
    {
      id: "9",
      name: "Orden de Venta TF.pdf",
      type: "document",
      size: "650 KB",
      modified: "Dec 13, 2023",
      owner: "juan.navarro",
      shared: true,
      synced: true,
      path: "/Casos de Éxito/Valdivia 142/Orden de Venta TF.pdf",
    },
  ]

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder":
        return <FolderOpen className="h-8 w-8 text-blue-500" />
      case "document":
        return <FileText className="h-8 w-8 text-red-500" />
      case "image":
        return <ImageIcon className="h-8 w-8 text-green-500" />
      case "video":
        return <Video className="h-8 w-8 text-purple-500" />
      case "audio":
        return <Music className="h-8 w-8 text-orange-500" />
      case "archive":
        return <Archive className="h-8 w-8 text-gray-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const startSync = () => {
    setSyncStatus({
      status: "syncing",
      progress: 0,
      filesProcessed: 0,
      totalFiles: 156,
      currentFile: "Iniciando sincronización...",
      speed: "0 MB/s",
      timeRemaining: "Calculando...",
    })

    // Simular progreso de sincronización
    const interval = setInterval(() => {
      setSyncStatus((prev) => {
        if (prev.progress >= 100) {
          clearInterval(interval)
          return {
            ...prev,
            status: "completed",
            progress: 100,
            currentFile: "Sincronización completada",
            speed: "0 MB/s",
            timeRemaining: "0s",
          }
        }

        const newProgress = prev.progress + Math.random() * 5
        const filesProcessed = Math.floor((newProgress / 100) * 156)

        return {
          ...prev,
          progress: Math.min(newProgress, 100),
          filesProcessed,
          currentFile: `Procesando archivo ${filesProcessed + 1} de 156`,
          speed: `${(Math.random() * 10 + 5).toFixed(1)} MB/s`,
          timeRemaining: `${Math.floor(Math.random() * 60 + 10)}s`,
        }
      })
    }, 500)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Aquí manejarías la subida de archivos
    console.log("Archivos soltados:", e.dataTransfer.files)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header con estadísticas principales */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Google Drive Integration - Sur-Realista
          </h1>
          <p className="text-gray-600 mt-2">Etapa 1 - Procesando 5 casos de éxito reales</p>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            API Key Configurada
          </Badge>
          <Button onClick={startSync} disabled={syncStatus.status === "syncing"} className="flex items-center gap-2">
            <Sync className={`h-4 w-4 ${syncStatus.status === "syncing" ? "animate-spin" : ""}`} />
            {syncStatus.status === "syncing" ? "Procesando..." : "Procesar Casos de Éxito"}
          </Button>
        </div>
      </div>

      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">5 Casos de Éxito Identificados</p>
              <p className="text-sm text-green-600">
                Carpetas reales compartidas por Juan Navarro - Listas para procesamiento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Almacenamiento</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{storageStats.used} GB</div>
            <Progress value={(storageStats.used / storageStats.total) * 100} className="mt-2" />
            <p className="text-xs text-blue-600 mt-1">de {storageStats.total} GB asignados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Archivos</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{storageStats.files}</div>
            <p className="text-xs text-green-600 mt-1">en casos de éxito</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Casos de Éxito</CardTitle>
            <FolderOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{storageStats.folders}</div>
            <p className="text-xs text-purple-600 mt-1">identificados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Compartidos</CardTitle>
            <Share2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{storageStats.shared}</div>
            <p className="text-xs text-orange-600 mt-1">por Juan Navarro</p>
          </CardContent>
        </Card>
      </div>

      {/* Estado de sincronización */}
      {syncStatus.status !== "idle" && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sync
                className={`h-5 w-5 ${syncStatus.status === "syncing" ? "animate-spin text-blue-600" : "text-green-600"}`}
              />
              Procesamiento de Casos de Éxito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{syncStatus.currentFile}</span>
              <span>
                {syncStatus.filesProcessed} / {syncStatus.totalFiles}
              </span>
            </div>
            <Progress value={syncStatus.progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Velocidad: {syncStatus.speed}</span>
              <span>Tiempo restante: {syncStatus.timeRemaining}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue="explorer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explorer" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Explorador
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Actividad
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Explorador de archivos */}
        <TabsContent value="explorer" className="space-y-6">
          {/* Barra de herramientas */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar archivos y carpetas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Zona de drag & drop */}
          <Card
            className={`border-2 border-dashed transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className={`h-12 w-12 mb-4 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
              <p className="text-lg font-medium mb-2">
                {isDragging ? "Suelta los archivos aquí" : "Arrastra archivos para subir"}
              </p>
              <p className="text-sm text-gray-500 mb-4">o haz clic para seleccionar archivos</p>
              <Button variant="outline">Seleccionar Archivos</Button>
            </CardContent>
          </Card>

          {/* Lista/Grid de archivos */}
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"
            }
          >
            {fileItems.map((file) => (
              <Card
                key={file.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedFiles.includes(file.id) ? "ring-2 ring-blue-500" : ""
                } ${viewMode === "list" ? "p-4" : ""}`}
              >
                <CardContent className={viewMode === "grid" ? "p-4" : "p-0"}>
                  <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-row"} items-center gap-3`}>
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.size} • {file.modified}
                        </p>
                      </div>
                    </div>

                    {viewMode === "list" && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Badge variant={file.synced ? "default" : "secondary"}>
                          {file.synced ? "Sincronizado" : "Pendiente"}
                        </Badge>
                        {file.shared && <Share2 className="h-4 w-4 text-blue-500" />}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {viewMode === "grid" && (
                      <div className="flex items-center justify-between w-full mt-2">
                        <Badge variant={file.synced ? "default" : "secondary"} className="text-xs">
                          {file.synced ? "Sync" : "Pending"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {file.shared && <Share2 className="h-3 w-3 text-blue-500" />}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Actividad reciente */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>Últimas acciones realizadas en Google Drive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1">
                      <p className="font-medium">
                        {activity.action}: {activity.file}
                      </p>
                      <p className="text-sm text-gray-500">
                        por {activity.user} • hace {activity.time}
                      </p>
                    </div>
                    <Badge variant={activity.status === "error" ? "destructive" : "default"}>
                      {activity.status === "completed"
                        ? "Completado"
                        : activity.status === "error"
                          ? "Error"
                          : "Pendiente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Uso de Almacenamiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Documentos</span>
                    <span className="font-medium">8.2 GB</span>
                  </div>
                  <Progress value={54} />

                  <div className="flex justify-between items-center">
                    <span>Imágenes</span>
                    <span className="font-medium">4.1 GB</span>
                  </div>
                  <Progress value={27} />

                  <div className="flex justify-between items-center">
                    <span>Videos</span>
                    <span className="font-medium">2.9 GB</span>
                  </div>
                  <Progress value={19} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Actividad por Usuario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Ana García", "Carlos López", "María Silva", "Equipo Legal"].map((user, index) => (
                    <div key={user} className="flex items-center justify-between">
                      <span>{user}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${[85, 72, 68, 45][index]}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{[85, 72, 68, 45][index]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuración */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sync className="h-5 w-5" />
                  Configuración de Sincronización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Sincronización automática</span>
                  <Button variant="outline" size="sm">
                    Activada
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frecuencia</span>
                  <Button variant="outline" size="sm">
                    Cada 15 min
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Notificaciones</span>
                  <Button variant="outline" size="sm">
                    Habilitadas
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Seguridad y Permisos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Encriptación</span>
                  <Badge variant="default">Activa</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Backup automático</span>
                  <Badge variant="default">Activo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Acceso de equipo</span>
                  <Button variant="outline" size="sm">
                    Gestionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
