"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ImageIcon,
  Video,
  File,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

let realDriveService: any = null

function FolderDetailView({ folder, onBack }: { folder: any; onBack: () => void }) {
  const [folderContents, setFolderContents] = useState<any>(null)
  const [loadingContents, setLoadingContents] = useState(true)
  const [contentsError, setContentsError] = useState<string | null>(null)

  useEffect(() => {
    const loadFolderContents = async () => {
      try {
        setLoadingContents(true)
        setContentsError(null)

        const response = await fetch(`/api/drive/folders/${folder.id}`)
        if (!response.ok) {
          throw new Error("Failed to load folder contents")
        }

        const contents = await response.json()
        setFolderContents(contents)
      } catch (error) {
        console.error("[v0] Error loading folder contents:", error)
        setContentsError("Error al cargar el contenido de la carpeta")
      } finally {
        setLoadingContents(false)
      }
    }

    if (folder.id) {
      loadFolderContents()
    }
  }, [folder.id])

  const organizedContents = useMemo(() => {
    if (!folderContents?.files) return null

    const categories = {
      "1_FOTOS": {
        icon: <ImageIcon className="h-4 w-4" />,
        color: "text-green-600",
        files: [],
        subfolders: [],
      },
      "2_DOCUMENTOS": {
        icon: <FileText className="h-4 w-4" />,
        color: "text-blue-600",
        files: [],
        subfolders: [],
      },
      "3_COMUNICACIONES": {
        icon: <MapPin className="h-4 w-4" />,
        color: "text-purple-600",
        files: [],
        subfolders: [],
      },
      "4_MARKETING": {
        icon: <Video className="h-4 w-4" />,
        color: "text-orange-600",
        files: [],
        subfolders: [],
      },
      "5_PDF_SUELTO": {
        icon: <File className="h-4 w-4" />,
        color: "text-red-600",
        files: [],
        subfolders: [],
      },
      "6_KMZ_SUELTO": {
        icon: <MapPin className="h-4 w-4" />,
        color: "text-indigo-600",
        files: [],
        subfolders: [],
      },
    }

    folderContents.files.forEach((item: any) => {
      const name = item.name.toUpperCase()

      if (name.includes("FOTO") || name.includes("IMAGE") || name.includes("JPG") || name.includes("PNG")) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          categories["1_FOTOS"].subfolders.push(item)
        } else {
          categories["1_FOTOS"].files.push(item)
        }
      } else if (name.includes("DOCUMENTO") || name.includes("DOC") || name.includes("PDF")) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          categories["2_DOCUMENTOS"].subfolders.push(item)
        } else {
          categories["2_DOCUMENTOS"].files.push(item)
        }
      } else if (name.includes("COMUNICACION") || name.includes("MAIL") || name.includes("MENSAJE")) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          categories["3_COMUNICACIONES"].subfolders.push(item)
        } else {
          categories["3_COMUNICACIONES"].files.push(item)
        }
      } else if (name.includes("MARKETING") || name.includes("VIDEO") || name.includes("PROMOCION")) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          categories["4_MARKETING"].subfolders.push(item)
        } else {
          categories["4_MARKETING"].files.push(item)
        }
      } else if (name.includes("KMZ") || name.includes("KML")) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          categories["6_KMZ_SUELTO"].subfolders.push(item)
        } else {
          categories["6_KMZ_SUELTO"].files.push(item)
        }
      } else {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          categories["5_PDF_SUELTO"].subfolders.push(item)
        } else {
          categories["5_PDF_SUELTO"].files.push(item)
        }
      }
    })

    return categories
  }, [folderContents])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
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

      {/* Folder Metadata */}
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

        {loadingContents && (
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando contenido de la carpeta...</p>
            </div>
          </div>
        )}

        {contentsError && (
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{contentsError}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {!loadingContents && !contentsError && organizedContents && (
          <div className="container mx-auto px-4 py-6">
            <div className="space-y-4">
              {Object.entries(organizedContents).map(([categoryName, category]) => {
                const totalItems = category.files.length + category.subfolders.length

                return (
                  <div key={categoryName} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={category.color}>{category.icon}</div>
                        <h3 className="font-semibold text-gray-900">{categoryName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {totalItems} elementos
                        </Badge>
                      </div>

                      {totalItems > 0 ? (
                        <div className="ml-7 space-y-2">
                          {/* Show subfolders */}
                          {category.subfolders.map((subfolder: any) => (
                            <div key={subfolder.id} className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-md">
                              <Folder className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-700 font-medium">{subfolder.name}</span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                Carpeta
                              </Badge>
                            </div>
                          ))}

                          {/* Show files */}
                          {category.files.map((file: any) => (
                            <div key={file.id} className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-md">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                {file.mimeType?.split("/")[1]?.toUpperCase() || "Archivo"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="ml-7 text-sm text-gray-500 italic">No hay archivos en esta categoría</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
  const [searchIndex, setSearchIndex] = useState<Map<string, any>>(new Map())
  const [indexLoading, setIndexLoading] = useState(false)

  const initializeService = useCallback(async () => {
    if (typeof window !== "undefined" && !realDriveService && !serviceInitialized) {
      try {
        setServiceInitialized(true)
        const { RealDriveService } = await import("@/lib/google-drive/real-drive-service")
        realDriveService = new RealDriveService()
      } catch (err) {
        console.error("[v0] Error loading drive service:", err)
        setError("Error al cargar el servicio de Google Drive")
      }
    }
  }, [serviceInitialized])

  const buildSearchIndex = useCallback(async (foldersList: any[]) => {
    if (!foldersList.length) return

    setIndexLoading(true)
    const newIndex = new Map()

    try {
      // Add folder names to index
      foldersList.forEach((folder) => {
        const searchableContent = {
          folderId: folder.id,
          folderName: folder.name,
          type: "folder",
          content: [folder.name, folder.location, folder.propertyType].join(" ").toLowerCase(),
        }
        newIndex.set(`folder-${folder.id}`, searchableContent)
      })

      // Fetch contents for each folder and add to index
      const contentPromises = foldersList.map(async (folder) => {
        try {
          const response = await fetch(`/api/drive/folders/${folder.id}`)
          if (response.ok) {
            const contents = await response.json()

            if (contents.files) {
              contents.files.forEach((item: any) => {
                const searchableContent = {
                  folderId: folder.id,
                  folderName: folder.name,
                  type: item.mimeType === "application/vnd.google-apps.folder" ? "subfolder" : "file",
                  name: item.name,
                  content: [item.name, folder.name].join(" ").toLowerCase(),
                }
                newIndex.set(
                  `${item.mimeType === "application/vnd.google-apps.folder" ? "subfolder" : "file"}-${item.id}`,
                  searchableContent,
                )
              })
            }
          }
        } catch (error) {
          console.error(`[v0] Error fetching contents for folder ${folder.id}:`, error)
        }
      })

      await Promise.all(contentPromises)
      setSearchIndex(newIndex)
    } catch (error) {
      console.error("[v0] Error building search index:", error)
    } finally {
      setIndexLoading(false)
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
        setError("Error al inicializar el servicio")
        return
      }

      const authSuccess = await realDriveService.authenticate()
      setIsAuthenticated(authSuccess)

      if (!authSuccess) {
        setError("Autenticación requerida para acceder a Google Drive")
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
        completionScore:
          folder.completionStatus === "complete" ? 95 : folder.completionStatus === "incomplete" ? 65 : 35,
      }))

      setFolders(processedFolders)
      await buildSearchIndex(processedFolders)
    } catch (err) {
      console.error("[v0] Error loading real Google Drive data:", err)
      setError("Error al cargar datos de Google Drive")
    } finally {
      setLoading(false)
    }
  }, [initializeService, buildSearchIndex])

  const handleAuthenticate = useCallback(async () => {
    await initializeService()

    if (!realDriveService) {
      setError("Error al cargar el servicio")
      return
    }

    try {
      await realDriveService.authenticate()
      await loadRealData()
    } catch (err) {
      console.error("[v0] Authentication error:", err)
      setError("Error en la autenticación")
    }
  }, [initializeService, loadRealData])

  const filteredAndSortedFolders = useMemo(() => {
    if (!folders.length) return []

    const filtered = folders.filter((folder) => {
      const matchesStatus = statusFilter === "all" || folder.status === statusFilter
      const matchesLocation = locationFilter === "all" || folder.location === locationFilter

      let matchesSearch = true
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()

        const folderNameMatch = folder.name.toLowerCase().includes(searchLower)

        let contentMatch = false
        if (searchIndex.size > 0) {
          for (const [key, item] of searchIndex.entries()) {
            if (item.folderId === folder.id && item.content.includes(searchLower)) {
              contentMatch = true
              break
            }
          }
        }

        matchesSearch = folderNameMatch || contentMatch
      }

      return matchesSearch && matchesStatus && matchesLocation
    })

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

  const totalPages = Math.ceil(filteredAndSortedFolders.length / itemsPerPage)
  const paginatedFolders = filteredAndSortedFolders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats = useMemo(() => {
    const total = filteredAndSortedFolders.length
    const complete = filteredAndSortedFolders.filter((f) => f.status === "complete").length
    const totalFiles = filteredAndSortedFolders.reduce((sum, f) => sum + f.files, 0)
    const totalRol = filteredAndSortedFolders.reduce((sum, f) => sum + f.rolNumbers, 0)

    return { total, complete, totalFiles, totalRol }
  }, [filteredAndSortedFolders])

  const uniqueLocations = useMemo(() => [...new Set(folders.map((f) => f.location))].sort(), [folders])

  const handleViewDetails = useCallback((folder: any) => {
    setSelectedFolder(folder)
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedFolder(null)
  }, [])

  useEffect(() => {}, [buildSearchIndex])

  if (error && !isAuthenticated && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Autenticación Requerida</h2>
          <p className="text-gray-600 mb-6">Para acceder a los datos reales de Google Drive, necesita autenticarse.</p>
          <Button onClick={handleAuthenticate} className="bg-blue-600 hover:bg-blue-700">
            Conectar con Google Drive
          </Button>
        </div>
      </div>
    )
  }

  if (selectedFolder) {
    return <FolderDetailView folder={selectedFolder} onBack={handleBackToList} />
  }

  return (
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
              </h1>
              <p className="text-gray-600 mt-1">
                {isAuthenticated ? "Datos reales desde Google Drive" : "Datos de demostración"} - Casos de éxito
                procesados
              </p>
            </div>
            <div className="flex gap-2">
              {!isAuthenticated && (
                <Button onClick={handleAuthenticate} variant="outline" size="sm">
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

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Casos Filtrados</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">De {folders.length} totales</p>
              </div>
              <Folder className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Casos Completos</p>
                <p className="text-3xl font-bold text-green-600">{stats.complete}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0}% completitud
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Archivos</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalFiles}</p>
                <p className="text-xs text-gray-500 mt-1">En casos filtrados</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Números de Rol</p>
                <p className="text-3xl font-bold text-orange-600">{stats.totalRol}</p>
                <p className="text-xs text-gray-500 mt-1">Extraídos</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar en carpetas, subcarpetas y archivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {indexLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  </div>
                )}
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
  )
}
