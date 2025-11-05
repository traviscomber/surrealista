"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Folder,
  FileText,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  FolderOpen,
  Settings,
  Database,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import { AppHeader } from "@/components/layout/app-header"

const SimpleDriveFolderView = dynamic(
  () =>
    import("@/components/google-drive/simple-drive-folder-view").then((mod) => ({
      default: mod.SimpleDriveFolderView,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false,
  },
)

let realDriveService: any = null

interface SearchIndexItem {
  id: string
  name: string
  type: "folder" | "file"
  path: string
  parentId: string
  mimeType?: string
}

interface IndexingProgress {
  isIndexing: boolean
  currentFolder: string
  foldersProcessed: number
  filesProcessed: number
  totalProgress: number
}

function FolderDetailView({ folder, onBack }: { folder: any; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                {folder.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{folder.files}</p>
              <p className="text-sm text-gray-600">archivos</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{folder.rolNumbers}</p>
              <p className="text-sm text-gray-600">números de rol</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm font-bold text-purple-600">Aug 8,</p>
              <p className="text-sm text-gray-600">2025</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <SimpleDriveFolderView apiKey="AIzaSyB6AVo8HT0RyEmiu8YRKj3skR3ujXyjHTU" />
        </div>
      </div>
    </div>
  )
}

const FolderCard = ({
  folder,
  viewMode,
  onViewDetails,
}: { folder: any; viewMode: "grid" | "list"; onViewDetails: (folder: any) => void }) => {
  const statusConfig = useMemo(() => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "complete":
          return "text-green-600 bg-green-50 border-green-200"
        case "processing":
          return "text-blue-600 bg-blue-50 border-blue-200"
        case "pending":
          return "text-yellow-600 bg-yellow-50 border-yellow-200"
        default:
          return "text-red-600 bg-red-50 border-red-200"
      }
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "complete":
          return <CheckCircle className="h-4 w-4" />
        case "processing":
          return <Calendar className="h-4 w-4" />
        case "pending":
          return <AlertCircle className="h-4 w-4" />
        default:
          return <AlertCircle className="h-4 w-4" />
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case "complete":
          return "Completo"
        case "processing":
          return "Procesando"
        case "pending":
          return "Pendiente"
        default:
          return "Incompleto"
      }
    }

    return { getStatusColor, getStatusIcon, getStatusText }
  }, [])

  const handleClick = useCallback(() => {
    onViewDetails(folder)
  }, [folder, onViewDetails])

  if (viewMode === "list") {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">{folder.name}</h3>
              <p className="text-sm text-gray-500">
                {folder.location} • {folder.propertyType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {folder.files}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {folder.rolNumbers}
              </span>
            </div>
            <Badge className={statusConfig.getStatusColor(folder.status)}>
              {statusConfig.getStatusIcon(folder.status)}
              {statusConfig.getStatusText(folder.status)}
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{folder.name}</CardTitle>
          <Badge className={statusConfig.getStatusColor(folder.status)}>
            {statusConfig.getStatusIcon(folder.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Archivos:</span>
            <span className="font-medium">{folder.files}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Rol:</span>
            <span className="font-medium">{folder.rolNumbers}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Completitud:</span>
            <span className="font-medium">{folder.completionScore}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null)
  const [serviceInitialized, setServiceInitialized] = useState(false)

  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([])
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress>({
    isIndexing: false,
    currentFolder: "",
    foldersProcessed: 0,
    filesProcessed: 0,
    totalProgress: 0,
  })

  // Removed PARAOrganizer related hooks and calculations
  // const paraOrganizer = useMemo(() => new PARAOrganizer(), [])
  // const paraStats = useMemo(() => paraOrganizer.getCategoryStats(folders), [folders, paraOrganizer])

  useEffect(() => {
    const demoFolders = [
      {
        id: "demo-1",
        name: "Valdivia 142 has Teresa F...",
        status: "complete",
        files: 8,
        rolNumbers: 2,
        location: "VALDIVIA",
        propertyType: "PARCELA",
        lastModified: new Date().toLocaleDateString("es-CL"),
        completionScore: 95,
      },
      {
        id: "demo-2",
        name: "Pucon Lote 45 - Familia Martinez",
        status: "processing",
        files: 12,
        rolNumbers: 1,
        location: "PUCON",
        propertyType: "TERRENO",
        lastModified: new Date().toLocaleDateString("es-CL"),
        completionScore: 75,
      },
      {
        id: "demo-3",
        name: "Villarrica Centro - Comercial",
        status: "complete",
        files: 15,
        rolNumbers: 3,
        location: "VILLARRICA",
        propertyType: "LOCAL",
        lastModified: new Date().toLocaleDateString("es-CL"),
        completionScore: 88,
      },
    ]
    setFolders(demoFolders)
  }, [])

  const initializeService = useCallback(async () => {
    if (typeof window !== "undefined" && !realDriveService && !serviceInitialized) {
      try {
        setServiceInitialized(true)
        const { RealDriveService } = await import("@/lib/google-drive/real-drive-service")
        realDriveService = new RealDriveService()
      } catch (err) {
        console.error("Error loading drive service:", err)
        setError(null)
        realDriveService = null
      }
    }
  }, [serviceInitialized])

  const buildSearchIndex = useCallback(async (folderId: string, path = ""): Promise<SearchIndexItem[]> => {
    if (!realDriveService) return []

    try {
      const response = await fetch(`/api/drive/folders/${folderId}`)
      if (!response.ok) return []

      const contents = await response.json()
      const items: SearchIndexItem[] = []

      setIndexingProgress((prev) => ({
        ...prev,
        currentFolder: path || "Root",
        foldersProcessed: prev.foldersProcessed + 1,
      }))

      if (contents.files && Array.isArray(contents.files)) {
        for (const item of contents.files) {
          const itemPath = path ? `${path}/${item.name}` : item.name
          const isFolder = item.mimeType === "application/vnd.google-apps.folder"

          items.push({
            id: item.id,
            name: item.name,
            type: isFolder ? "folder" : "file",
            path: itemPath,
            parentId: folderId,
            mimeType: item.mimeType,
          })

          if (isFolder && path.split("/").length < 2) {
            const subItems = await buildSearchIndex(item.id, itemPath)
            items.push(...subItems)
          } else if (!isFolder) {
            setIndexingProgress((prev) => ({
              ...prev,
              filesProcessed: prev.filesProcessed + 1,
            }))
          }
        }
      }

      return items
    } catch (error) {
      console.error(`Error indexing folder ${folderId}:`, error)
      return []
    }
  }, [])

  const loadRealData = useCallback(async () => {
    if (typeof window === "undefined") {
      setError("Servicio no disponible en el servidor")
      return
    }

    try {
      setLoading(true)
      setError(null)

      await initializeService()

      if (!realDriveService) {
        console.log("[v0] Drive service not available, using demo data")
        setIsAuthenticated(false)
        return
      }

      const authSuccess = await realDriveService.authenticate()
      setIsAuthenticated(authSuccess)

      if (!authSuccess) {
        console.log("[v0] Authentication failed, using demo data")
        setError(null) // Don't show error, just use demo data
        return
      }

      const realFolders = await realDriveService.listSuccessCases()

      const processedFolders = realFolders.map((folder: any, index: number) => ({
        id: folder.id || index.toString(),
        name: folder.name,
        status:
          folder.completionStatus === "complete"
            ? "complete"
            : folder.completionStatus === "incomplete"
              ? "processing"
              : "pending",
        files: folder.totalFiles || 0,
        rolNumbers: folder.rolNumbers || 0,
        location: folder.location || "DESCONOCIDA",
        propertyType: folder.propertyType || "PROPIEDAD",
        lastModified: new Date(folder.files?.[0]?.modifiedTime || Date.now()).toLocaleDateString("es-CL"),
        completionScore: folder.completenessScore || 0,
      }))

      setFolders(processedFolders)
      console.log("[v0] Loaded", processedFolders.length, "folders from Google Drive")
    } catch (err) {
      console.error("[v0] Error loading Google Drive data:", err)
      setError(null) // Don't show error, demo data is already loaded
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [initializeService])

  const startIndexing = useCallback(async () => {
    if (!isAuthenticated || folders.length === 0) {
      console.log("[v0] Cannot index: not authenticated or no folders")
      return
    }

    setIndexingProgress({
      isIndexing: true,
      currentFolder: "Iniciando...",
      foldersProcessed: 0,
      filesProcessed: 0,
      totalProgress: 0,
    })

    const allItems: SearchIndexItem[] = []
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i]
      const items = await buildSearchIndex(folder.id, folder.name)
      allItems.push(...items)

      setIndexingProgress((prev) => ({
        ...prev,
        totalProgress: Math.round(((i + 1) / folders.length) * 100),
      }))
    }

    setSearchIndex(allItems)
    setIndexingProgress((prev) => ({
      ...prev,
      isIndexing: false,
      currentFolder: "Completado",
    }))

    console.log("[v0] Indexing complete:", allItems.length, "items indexed")
  }, [isAuthenticated, folders, buildSearchIndex])

  const filteredAndSortedFolders = useMemo(() => {
    if (!folders.length) return []

    let filtered = folders.filter((folder) => {
      const matchesStatus = statusFilter === "all" || folder.status === statusFilter
      const matchesLocation = locationFilter === "all" || folder.location === locationFilter
      return matchesStatus && matchesLocation
    })

    // Enhanced search using the full index
    if (searchTerm.trim() && searchIndex.length > 0) {
      const searchLower = searchTerm.toLowerCase()
      const matchingItems = searchIndex.filter(
        (item) => item.name.toLowerCase().includes(searchLower) || item.path.toLowerCase().includes(searchLower),
      )

      // Get unique folder IDs from matching items
      const matchingFolderIds = new Set(matchingItems.map((item) => item.parentId))

      filtered = filtered.filter(
        (folder) =>
          folder.name.toLowerCase().includes(searchLower) ||
          folder.location.toLowerCase().includes(searchLower) ||
          folder.propertyType.toLowerCase().includes(searchLower) ||
          matchingFolderIds.has(folder.id),
      )
    } else if (searchTerm.trim()) {
      // Fallback to basic search if index not ready
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (folder) =>
          folder.name.toLowerCase().includes(searchLower) ||
          folder.location.toLowerCase().includes(searchLower) ||
          folder.propertyType.toLowerCase().includes(searchLower),
      )
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "files":
          return b.files - a.files
        case "completion":
          return b.completionScore - a.completionScore
        case "date":
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        default:
          return 0
      }
    })
  }, [folders, searchTerm, statusFilter, locationFilter, sortBy, searchIndex])

  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchIndex.length === 0) return null

    const searchLower = searchTerm.toLowerCase()
    const matching = searchIndex.filter(
      (item) => item.name.toLowerCase().includes(searchLower) || item.path.toLowerCase().includes(searchLower),
    )

    const folders = matching.filter((item) => item.type === "folder")
    const files = matching.filter((item) => item.type === "file")

    return { folders, files, total: matching.length }
  }, [searchTerm, searchIndex])

  const totalPages = Math.ceil(filteredAndSortedFolders.length / itemsPerPage)
  const paginatedFolders = filteredAndSortedFolders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats = useMemo(() => {
    const total = filteredAndSortedFolders.length
    const complete = filteredAndSortedFolders.filter((f) => f.status === "complete").length
    const totalFiles = filteredAndSortedFolders.reduce((sum, f) => sum + f.files, 0)
    const totalRol = filteredAndSortedFolders.reduce((sum, f) => sum + f.rolNumbers, 0)

    // Removed PARA stats calculation
    return { total, complete, totalFiles, totalRol }
  }, [filteredAndSortedFolders])

  const uniqueLocations = useMemo(() => [...new Set(folders.map((f) => f.location))].sort(), [folders])

  const handleViewDetails = useCallback((folder: any) => {
    setSelectedFolder(folder)
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedFolder(null)
  }, [])

  if (error && !isAuthenticated && loading) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Autenticación Requerida</h2>
            <p className="text-gray-600 mb-6">
              Para acceder a los datos reales de Google Drive, necesita autenticarse.
            </p>
            <Button onClick={loadRealData} className="bg-blue-600 hover:bg-blue-700">
              Conectar con Google Drive
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (selectedFolder) {
    return (
      <>
        <AppHeader />
        <FolderDetailView folder={selectedFolder} onBack={handleBackToList} />
      </>
    )
  }

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  Gestión de Carpetas - Sur-Realista
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {folders.length} Carpetas {isAuthenticated ? "Reales" : "Demo"}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {/* Removed PARA related badge */}
                    {/* Método PARA Activo */}
                  </Badge>
                  {searchIndex.length > 0 && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Database className="h-3 w-3 mr-1" />
                      {searchIndex.length} items indexados
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isAuthenticated ? "Datos reales desde Google Drive" : "Datos de demostración"}
                  {/* Removed PARA related text */}
                  {/*  procesados con metodología PARA */}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open("/admin/file-explorer", "_blank")}
                  variant="outline"
                  size="sm"
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Explorador de Archivos
                </Button>
                {!isAuthenticated && (
                  <Button onClick={loadRealData} variant="outline" size="sm">
                    Conectar Google Drive
                  </Button>
                )}
                <Button onClick={loadRealData} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Cargando..." : "Actualizar"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {indexingProgress.isIndexing && (
          <div className="bg-blue-50 border-b border-blue-200">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900">
                      Indexando carpetas y archivos: {indexingProgress.currentFolder}
                    </p>
                    <p className="text-sm text-blue-700">
                      {indexingProgress.foldersProcessed} carpetas • {indexingProgress.filesProcessed} archivos
                    </p>
                  </div>
                  <Progress value={indexingProgress.totalProgress} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-4">
          {isAuthenticated && searchIndex.length === 0 && !indexingProgress.isIndexing && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    Indexación de Archivos Disponible
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Indexa todos los archivos de Google Drive para búsqueda avanzada (puede tomar varios minutos)
                  </p>
                </div>
                <Button onClick={startIndexing} className="bg-purple-600 hover:bg-purple-700">
                  <Database className="h-4 w-4 mr-2" />
                  Iniciar Indexación
                </Button>
              </div>
            </div>
          )}

          {searchIndex.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Archivos Indexados
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {searchIndex.length} archivos y carpetas indexados desde Google Drive
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      {searchIndex.filter((item) => item.type === "folder").length} carpetas
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {searchIndex.filter((item) => item.type === "file").length} archivos
                    </span>
                  </div>
                </div>
                <Button onClick={startIndexing} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-indexar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Removed PARA stats section */}
        {/* <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Proyectos Activos</p>
                  <p className="text-3xl font-bold text-red-600">{paraStats.projects}</p>
                  <p className="text-xs text-gray-500 mt-1">Con fechas límite</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Áreas Responsabilidad</p>
                  <p className="text-3xl font-bold text-blue-600">{paraStats.areas}</p>
                  <p className="text-xs text-gray-500 mt-1">Actividades continuas</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recursos Referencia</p>
                  <p className="text-3xl font-bold text-green-600">{paraStats.resources}</p>
                  <p className="text-xs text-gray-500 mt-1">Para consulta futura</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Archivo</p>
                  <p className="text-3xl font-bold text-gray-600">{paraStats.archive}</p>
                  <p className="text-xs text-gray-500 mt-1">Casos completados</p>
                </div>
                <Archive className="h-8 w-8 text-gray-500" />
              </div>
            </div>
          </div>
        </div> */}

        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar en todas las carpetas y archivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="complete">Completo</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="incomplete">Incompleto</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ubicaciones</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="files">Archivos</SelectItem>
                    <SelectItem value="completion">Completitud</SelectItem>
                    <SelectItem value="date">Fecha</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>

          {searchResults && searchResults.total > 0 && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                Resultados de búsqueda: {searchResults.total} items encontrados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.folders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Carpetas ({searchResults.folders.length})
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {searchResults.folders.slice(0, 10).map((item) => (
                        <div key={item.id} className="text-sm text-blue-700 bg-white rounded px-2 py-1">
                          {item.path}
                        </div>
                      ))}
                      {searchResults.folders.length > 10 && (
                        <p className="text-xs text-blue-600 italic">
                          +{searchResults.folders.length - 10} carpetas más...
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {searchResults.files.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Archivos ({searchResults.files.length})
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {searchResults.files.slice(0, 10).map((item) => (
                        <div key={item.id} className="text-sm text-blue-700 bg-white rounded px-2 py-1">
                          {item.path}
                        </div>
                      ))}
                      {searchResults.files.length > 10 && (
                        <p className="text-xs text-blue-600 italic">
                          +{searchResults.files.length - 10} archivos más...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
                : "space-y-4 mb-8"
            }
          >
            {paginatedFolders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} viewMode={viewMode} onViewDetails={handleViewDetails} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedFolders.length)} de{" "}
                {filteredAndSortedFolders.length} carpetas
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
