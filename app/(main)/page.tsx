"use client"

import { useState, useEffect, useMemo } from "react"
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
  const standardStructure = {
    "1_FOTOS": {
      icon: <ImageIcon className="h-4 w-4" />,
      color: "text-green-600",
      subfolders: ["2024-06-20", "2024-07-10", "drone_aereas", "seleccion_jorge"],
    },
    "2_DOCUMENTOS": {
      icon: <FileText className="h-4 w-4" />,
      color: "text-blue-600",
      subfolders: ["a_antecedentes_titulo", "b_tasacion_info", "c_documentos_comerciales"],
    },
    "3_COMUNICACIONES": {
      icon: <MapPin className="h-4 w-4" />,
      color: "text-purple-600",
      subfolders: ["a_interaccion_compradores", "b_interaccion_dueno", "c_sugerencia_clientes"],
    },
    "4_MARKETING": {
      icon: <Video className="h-4 w-4" />,
      color: "text-orange-600",
      subfolders: ["video_promocional", "fotos_marketing", "publicaciones_portales"],
    },
    "5_PDF_SUELTO": {
      icon: <File className="h-4 w-4" />,
      color: "text-red-600",
      subfolders: [],
    },
    "6_KMZ_SUELTO": {
      icon: <MapPin className="h-4 w-4" />,
      color: "text-indigo-600",
      subfolders: [],
    },
  }

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

        {/* Folder Structure */}
        <div className="space-y-4">
          {Object.entries(standardStructure).map(([folderName, config]) => (
            <div key={folderName} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={config.color}>{config.icon}</div>
                  <h3 className="font-semibold text-gray-900">{folderName}</h3>
                </div>

                {config.subfolders.length > 0 && (
                  <div className="ml-7 space-y-2">
                    {config.subfolders.map((subfolder) => (
                      <div key={subfolder} className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-md">
                        <Folder className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{subfolder}</span>
                      </div>
                    ))}
                  </div>
                )}

                {config.subfolders.length === 0 && (
                  <div className="ml-7 text-sm text-gray-500 italic">Archivos sueltos organizados</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FolderCard({
  folder,
  viewMode,
  onViewDetails,
}: { folder: any; viewMode: "grid" | "list"; onViewDetails: (folder: any) => void }) {
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

  if (viewMode === "list") {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onViewDetails(folder)}
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
            <Badge className={getStatusColor(folder.status)}>
              {getStatusIcon(folder.status)}
              {getStatusText(folder.status)}
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(folder)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{folder.name}</CardTitle>
          <Badge className={getStatusColor(folder.status)}>{getStatusIcon(folder.status)}</Badge>
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
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null)

  useEffect(() => {
    const initializeService = async () => {
      if (typeof window !== "undefined" && !realDriveService) {
        try {
          const { RealDriveService } = await import("@/lib/google-drive/real-drive-service")
          realDriveService = new RealDriveService()
          await loadRealData()
        } catch (err) {
          console.error("[v0] Error loading drive service:", err)
          setError("Error al cargar el servicio de Google Drive")
          setLoading(false)
        }
      } else if (typeof window === "undefined") {
        setLoading(false)
        setError("Servicio no disponible en el servidor")
      }
    }

    initializeService()
  }, [])

  const loadRealData = async () => {
    if (typeof window === "undefined" || !realDriveService) {
      setLoading(false)
      setError("Servicio no disponible en el servidor")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const authSuccess = await realDriveService.authenticate()
      setIsAuthenticated(authSuccess)

      if (!authSuccess) {
        setError("Autenticación requerida para acceder a Google Drive")
        setLoading(false)
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
    } catch (err) {
      console.error("[v0] Error loading real Google Drive data:", err)
      setError("Error al cargar datos de Google Drive")
    } finally {
      setLoading(false)
    }
  }

  const handleAuthenticate = async () => {
    if (!realDriveService) {
      if (typeof window !== "undefined") {
        try {
          const { RealDriveService } = await import("@/lib/google-drive/real-drive-service")
          realDriveService = new RealDriveService()
        } catch (err) {
          setError("Error al cargar el servicio")
          return
        }
      } else {
        setError("Servicio no disponible")
        return
      }
    }

    try {
      await realDriveService.authenticate()
      await loadRealData()
    } catch (err) {
      console.error("[v0] Authentication error:", err)
      setError("Error en la autenticación")
    }
  }

  const filteredAndSortedFolders = useMemo(() => {
    const filtered = folders.filter((folder) => {
      const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || folder.status === statusFilter
      const matchesLocation = locationFilter === "all" || folder.location === locationFilter
      return matchesSearch && matchesStatus && matchesLocation
    })

    filtered.sort((a, b) => {
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

    return filtered
  }, [folders, searchTerm, statusFilter, locationFilter, sortBy])

  const totalPages = Math.ceil(filteredAndSortedFolders.length / itemsPerPage)
  const paginatedFolders = filteredAndSortedFolders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats = useMemo(() => {
    const total = filteredAndSortedFolders.length
    const complete = filteredAndSortedFolders.filter((f) => f.status === "complete").length
    const totalFiles = filteredAndSortedFolders.reduce((sum, f) => sum + f.files, 0)
    const totalRol = filteredAndSortedFolders.reduce((sum, f) => sum + f.rolNumbers, 0)

    return { total, complete, totalFiles, totalRol }
  }, [filteredAndSortedFolders])

  const uniqueLocations = [...new Set(folders.map((f) => f.location))].sort()

  const handleViewDetails = (folder: any) => {
    setSelectedFolder(folder)
  }

  const handleBackToList = () => {
    setSelectedFolder(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando datos reales de Google Drive</h2>
          <p className="text-gray-600">Conectando con su carpeta de casos de éxito...</p>
        </div>
      </div>
    )
  }

  if (error && !isAuthenticated) {
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
                  {folders.length} Carpetas Reales
                </Badge>
              </h1>
              <p className="text-gray-600 mt-1">Datos reales desde Google Drive - Casos de éxito procesados</p>
            </div>
            <Button onClick={loadRealData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
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
                  {Math.round((stats.complete / stats.total) * 100)}% completitud
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
                  placeholder="Buscar carpetas..."
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
