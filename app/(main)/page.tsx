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
  Building,
  BookOpen,
  Archive,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PARAOrganizer, type PARAClassification } from "@/lib/para-method/para-organizer"

let realDriveService: any = null

const classificationCache = new Map<string, any>()
const paraCache = new Map<string, PARAClassification>()

// Compiled regex patterns for better performance
const classificationPatterns = {
  DATOS_TECNICOS: /\b(KMZ|KML|COORDENADA|GPS|TOPOGRAFIA|PLANO)\b/i,
  RECURSOS_VISUALES: /\b(FOTO|IMAGE|JPG|PNG|VIDEO|IMAGEN|PICTURE|DRONE|AEREA)\b/i,
  COMUNICACIONES: /\b(MAIL|MENSAJE|COMUNICACION|WHATSAPP|CHAT|EMAIL|CORREO|CONVERSACION)\b/i,
  DOCUMENTOS_LEGALES:
    /\b(CONTRATO|ESCRITURA|LEGAL|NOTARIA|INSCRIPCION|MANDATO|TASACION|COMERCIAL|ORDEN|VENTA|COMPRA|FUNDO|CAMPO|PARCELA|ROL|CONSERVADOR|REGISTRO|DOC|CERT|TITULO|PROPIEDAD)\b/i,
}

const mimeTypePatterns = {
  DATOS_TECNICOS: /\b(kmz|kml)\b/i,
  RECURSOS_VISUALES: /\b(image|video|jpeg|png|gif)\b/i,
  DOCUMENTOS_LEGALES: /\bpdf\b/i,
}

function FolderDetailView({ folder, onBack }: { folder: any; onBack: () => void }) {
  const [folderContents, setFolderContents] = useState<any>(null)
  const [loadingContents, setLoadingContents] = useState(true)
  const [contentsError, setContentsError] = useState<string | null>(null)
  const [paraClassification, setParaClassification] = useState<PARAClassification | null>(null)

  const paraOrganizer = useMemo(() => new PARAOrganizer(), [])

  useEffect(() => {
    const loadFolderContents = async () => {
      try {
        setLoadingContents(true)
        setContentsError(null)

        const cacheKey = `folder-${folder.id}`
        if (classificationCache.has(cacheKey)) {
          const cached = classificationCache.get(cacheKey)
          setFolderContents(cached.contents)
          setParaClassification(cached.classification)
          setLoadingContents(false)
          return
        }

        // Use hierarchy data if available to avoid API call
        if (folder.hierarchy) {
          const contents = { files: [...(folder.hierarchy.files || []), ...(folder.hierarchy.folders || [])] }
          setFolderContents(contents)

          const classification = paraOrganizer.classifyFolder(folder.name, contents.files || [])
          setParaClassification(classification)

          // Cache the results
          classificationCache.set(cacheKey, { contents, classification })
        } else {
          const response = await fetch(`/api/drive/folders/${folder.id}`)
          if (!response.ok) {
            throw new Error("Failed to load folder contents")
          }

          const contents = await response.json()
          setFolderContents(contents)

          const classification = paraOrganizer.classifyFolder(folder.name, contents.files || [])
          setParaClassification(classification)

          // Cache the results
          classificationCache.set(cacheKey, { contents, classification })
        }
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
  }, [folder.id, folder.hierarchy, paraOrganizer])

  const organizedContents = useMemo(() => {
    if (!folderContents?.files || !paraClassification) return null

    const cacheKey = `organized-${folder.id}-${folderContents.files.length}`
    if (classificationCache.has(cacheKey)) {
      return classificationCache.get(cacheKey)
    }

    console.log("[v0] Testing classification for folder:", folder.name)

    const categories = paraOrganizer.getCategories()
    const currentCategory = categories[paraClassification.category]

    const paraStructure = {
      category: currentCategory,
      classification: paraClassification,
      files: {
        DOCUMENTOS_LEGALES: {
          icon: <FileText className="h-4 w-4" />,
          color: "text-blue-600",
          files: [],
          subfolders: [],
        },
        COMUNICACIONES: {
          icon: <MapPin className="h-4 w-4" />,
          color: "text-purple-600",
          files: [],
          subfolders: [],
        },
        RECURSOS_VISUALES: {
          icon: <ImageIcon className="h-4 w-4" />,
          color: "text-green-600",
          files: [],
          subfolders: [],
        },
        DATOS_TECNICOS: {
          icon: <MapPin className="h-4 w-4" />,
          color: "text-indigo-600",
          files: [],
          subfolders: [],
        },
        OTROS_DOCUMENTOS: {
          icon: <Archive className="h-4 w-4" />,
          color: "text-gray-600",
          files: [],
          subfolders: [],
        },
      },
    }

    folderContents.files.forEach((item: any) => {
      const name = item.name
      const mimeType = item.mimeType || ""
      const isFolder = item.mimeType === "application/vnd.google-apps.folder"

      let category = "OTROS_DOCUMENTOS"

      // Use compiled regex patterns for faster matching
      if (classificationPatterns.DATOS_TECNICOS.test(name) || mimeTypePatterns.DATOS_TECNICOS.test(mimeType)) {
        category = "DATOS_TECNICOS"
      } else if (
        classificationPatterns.RECURSOS_VISUALES.test(name) ||
        mimeTypePatterns.RECURSOS_VISUALES.test(mimeType)
      ) {
        category = "RECURSOS_VISUALES"
      } else if (classificationPatterns.COMUNICACIONES.test(name)) {
        category = "COMUNICACIONES"
      } else if (
        classificationPatterns.DOCUMENTOS_LEGALES.test(name) ||
        (mimeTypePatterns.DOCUMENTOS_LEGALES.test(mimeType) && classificationPatterns.DOCUMENTOS_LEGALES.test(name))
      ) {
        category = "DOCUMENTOS_LEGALES"
      }

      if (isFolder) {
        paraStructure.files[category].subfolders.push(item)
      } else {
        paraStructure.files[category].files.push(item)
      }
    })

    // Cache the organized structure
    classificationCache.set(cacheKey, paraStructure)
    return paraStructure
  }, [folderContents, paraClassification, paraOrganizer, folder.id])

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
              {paraClassification && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={organizedContents?.category.color}>{organizedContents?.category.name}</Badge>
                  <Badge variant="outline">{paraClassification.status.toUpperCase()}</Badge>
                  <Badge variant="outline" className="text-xs">
                    Prioridad: {paraClassification.priority.toUpperCase()}
                  </Badge>
                  {paraClassification.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-4 gap-4 text-center">
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
            <div>
              <div className="flex items-center justify-center mb-2">
                {paraClassification?.category === "projects" && <TrendingUp className="h-5 w-5 text-red-600" />}
                {paraClassification?.category === "areas" && <Building className="h-5 w-5 text-blue-600" />}
                {paraClassification?.category === "resources" && <BookOpen className="h-5 w-5 text-green-600" />}
                {paraClassification?.category === "archive" && <Archive className="h-5 w-5 text-gray-600" />}
              </div>
              <p className="text-sm font-bold text-gray-900">PARA</p>
              <p className="text-xs text-gray-600">{paraClassification?.category.toUpperCase()}</p>
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
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Organización PARA Aplicada</h3>
              <p className="text-sm text-gray-700 mb-2">{organizedContents.category.description}</p>
              <div className="text-xs text-gray-600">
                <strong>Subcategoría:</strong> {paraClassification?.subcategory} |<strong> Estado:</strong>{" "}
                {paraClassification?.status} |<strong> Prioridad:</strong> {paraClassification?.priority}
                {paraClassification?.dueDate && (
                  <span>
                    {" "}
                    | <strong>Fecha límite:</strong> {paraClassification.dueDate}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(organizedContents.files).map(([categoryName, category]) => {
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
                          {category.subfolders.map((subfolder: any) => (
                            <div key={subfolder.id} className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-md">
                              <Folder className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-700 font-medium">{subfolder.name}</span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                Carpeta
                              </Badge>
                            </div>
                          ))}

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

function FolderCardComponent({
  folder,
  viewMode,
  onViewDetails,
}: { folder: any; viewMode: "grid" | "list"; onViewDetails: (folder: any) => void }) {
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

  const paraOrganizer = useMemo(() => new PARAOrganizer(), [])
  const paraStats = useMemo(() => paraOrganizer.getCategoryStats(folders), [folders, paraOrganizer])

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
      foldersList.forEach((folder) => {
        const searchableContent = {
          folderId: folder.id,
          folderName: folder.name,
          type: "folder",
          content: [folder.name, folder.location, folder.propertyType].join(" ").toLowerCase(),
        }
        newIndex.set(`folder-${folder.id}`, searchableContent)

        // Use hierarchy data if available to avoid API calls
        if (folder.hierarchy?.files) {
          folder.hierarchy.files.forEach((item: any) => {
            const searchableContent = {
              folderId: folder.id,
              folderName: folder.name,
              type: "file",
              name: item.name,
              content: [item.name, folder.name].join(" ").toLowerCase(),
            }
            newIndex.set(`file-${item.id}`, searchableContent)
          })
        }

        if (folder.hierarchy?.folders) {
          folder.hierarchy.folders.forEach((item: any) => {
            const searchableContent = {
              folderId: folder.id,
              folderName: folder.name,
              type: "subfolder",
              name: item.name,
              content: [item.name, folder.name].join(" ").toLowerCase(),
            }
            newIndex.set(`subfolder-${item.id}`, searchableContent)
          })
        }
      })

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

      const response = await fetch("/api/drive/folders/complete-hierarchy")

      if (!response.ok) {
        throw new Error("Failed to fetch complete hierarchy")
      }

      const hierarchyData = await response.json()
      console.log("[v0] Complete hierarchy loaded:", hierarchyData)

      const processedFolders = []

      function processHierarchy(folders, parentPath = "") {
        folders.forEach((folder) => {
          const folderPath = parentPath ? `${parentPath}/${folder.name}` : folder.name

          // Add the folder itself
          processedFolders.push({
            id: folder.id,
            name: folderPath,
            status: folder.contents?.files?.length > 0 ? "complete" : "pending",
            files: (folder.contents?.files?.length || 0) + (folder.contents?.folders?.length || 0),
            rolNumbers: 0, // Will be calculated later
            location: extractLocation(folder.name),
            propertyType: extractPropertyType(folder.name),
            lastModified: folder.modifiedTime
              ? new Date(folder.modifiedTime).toLocaleDateString("es-CL")
              : new Date().toLocaleDateString("es-CL"),
            completionScore: folder.contents?.files?.length > 0 ? 85 : 35,
            hierarchy: folder.contents, // Store complete hierarchy for detail view
          })

          // Recursively process subfolders
          if (folder.contents?.folders?.length > 0) {
            processHierarchy(folder.contents.folders, folderPath)
          }
        })
      }

      if (hierarchyData.hierarchy?.folders) {
        processHierarchy(hierarchyData.hierarchy.folders)
      }

      function extractLocation(folderName) {
        const locationPatterns = ["PUCON", "TEMUCO", "VALDIVIA", "OSORNO", "PUERTO MONTT", "CHILOE"]
        const found = locationPatterns.find((loc) => folderName.toUpperCase().includes(loc))
        return found || "DESCONOCIDA"
      }

      function extractPropertyType(folderName) {
        const typePatterns = ["PARCELA", "CASA", "CAMPO", "TERRENO", "DEPARTAMENTO"]
        const found = typePatterns.find((type) => folderName.toUpperCase().includes(type))
        return found || "PROPIEDAD"
      }

      console.log("[v0] Processed folders with complete hierarchy:", processedFolders.length)
      setFolders(processedFolders)
      await buildSearchIndex(processedFolders)
      setIsAuthenticated(true)
    } catch (err) {
      console.error("[v0] Error loading complete hierarchy:", err)
      setError("Error al cargar la jerarquía completa de Google Drive")
    } finally {
      setLoading(false)
    }
  }, [buildSearchIndex])

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
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Método PARA Activo
                </Badge>
              </h1>
              <p className="text-gray-600 mt-1">
                {isAuthenticated ? "Datos reales desde Google Drive" : "Datos de demostración"} - Casos de éxito
                procesados con metodología PARA
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
            <FolderCardComponent
              key={folder.id}
              folder={folder}
              viewMode={viewMode}
              onViewDetails={handleViewDetails}
            />
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
