"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Folder,
  FolderOpen,
  FileText,
  ImageIcon,
  Video,
  MapPin,
  ChevronRight,
  ChevronDown,
  Search,
  Grid3X3,
  List,
  Eye,
  Download,
  Move,
  Trash2,
  RefreshCw,
  Filter,
  X,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FileItem {
  id: string
  name: string
  mimeType: string
  size?: number
  modifiedTime: string
  webViewLink?: string
  parents?: string[]
  isFolder: boolean
}

interface FolderNode {
  id: string
  name: string
  files: FileItem[]
  subfolders: FolderNode[]
  isExpanded: boolean
  level: number
  parentId?: string
  paraCategory?: string
  completionStatus?: string
}

export function EnhancedFolderView({ folderId, folderName }: { folderId: string; folderName: string }) {
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [viewMode, setViewMode] = useState<"tree" | "grid" | "list">("tree")
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("name")
  const [filterType, setFilterType] = useState<"all" | "folders" | "files" | "images" | "documents" | "kmz">("all")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [quickFilters, setQuickFilters] = useState<string[]>([])

  const loadFolderStructure = async (folderId: string, level = 0): Promise<FolderNode> => {
    try {
      const response = await fetch(`/api/drive/folders/${folderId}`)
      const data = await response.json()

      const node: FolderNode = {
        id: folderId,
        name: data.name || folderName,
        files: [],
        subfolders: [],
        isExpanded: level < 2,
        level,
        paraCategory: classifyPARACategory(data.name || folderName),
        completionStatus: assessCompletionStatus(data.files || []),
      }

      if (data.files) {
        const files = data.files.filter((item: any) => item.mimeType !== "application/vnd.google-apps.folder")
        const folders = data.files.filter((item: any) => item.mimeType === "application/vnd.google-apps.folder")

        node.files = files.map((file: any) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size ? Number.parseInt(file.size) : undefined,
          modifiedTime: file.modifiedTime,
          webViewLink: file.webViewLink,
          parents: file.parents,
          isFolder: false,
        }))

        if (level < 3) {
          const subfolderPromises = folders.map((folder: any) =>
            loadFolderStructure(folder.id, level + 1).catch((error) => {
              console.error(`Error loading subfolder ${folder.name}:`, error)
              return {
                id: folder.id,
                name: folder.name,
                files: [],
                subfolders: [],
                isExpanded: false,
                level: level + 1,
                paraCategory: classifyPARACategory(folder.name),
              }
            }),
          )

          node.subfolders = await Promise.all(subfolderPromises)
        }
      }

      return node
    } catch (error) {
      console.error("Error loading folder structure:", error)
      throw error
    }
  }

  const classifyPARACategory = (folderName: string): string => {
    const name = folderName.toLowerCase()

    if (
      name.includes("proyecto") ||
      name.includes("caso") ||
      name.includes("cliente") ||
      name.includes("venta") ||
      name.includes("compra") ||
      /\d{4}/.test(name)
    ) {
      return "projects"
    }

    if (
      name.includes("marketing") ||
      name.includes("legal") ||
      name.includes("contabilidad") ||
      name.includes("administracion") ||
      name.includes("recursos")
    ) {
      return "areas"
    }

    if (
      name.includes("archivo") ||
      name.includes("completado") ||
      name.includes("finalizado") ||
      name.includes("historico") ||
      name.includes("2023") ||
      name.includes("2022")
    ) {
      return "archive"
    }

    return "resources"
  }

  const assessCompletionStatus = (files: any[]): string => {
    if (!files || files.length === 0) return "empty"

    const requiredTypes = ["documentos", "fotos", "comunicaciones", "marketing", "pdf", "kmz"]
    const presentTypes = requiredTypes.filter((type) => files.some((file) => file.name.toLowerCase().includes(type)))

    const completionRatio = presentTypes.length / requiredTypes.length

    if (completionRatio >= 0.8) return "complete"
    if (completionRatio >= 0.5) return "partial"
    return "incomplete"
  }

  const toggleFolder = (nodeId: string) => {
    const updateNode = (node: FolderNode): FolderNode => {
      if (node.id === nodeId) {
        return { ...node, isExpanded: !node.isExpanded }
      }
      return {
        ...node,
        subfolders: node.subfolders.map(updateNode),
      }
    }

    if (folderTree) {
      setFolderTree(updateNode(folderTree))
    }
  }

  const getAllFiles = (node: FolderNode): FileItem[] => {
    let allFiles = [...node.files]
    node.subfolders.forEach((subfolder) => {
      allFiles = allFiles.concat(getAllFiles(subfolder))
    })
    return allFiles
  }

  const performSearch = () => {
    setSearchTerm(searchInput)
  }

  const clearSearch = () => {
    setSearchInput("")
    setSearchTerm("")
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch()
    }
  }

  const filteredFiles = useMemo(() => {
    if (!folderTree) return []

    let files = getAllFiles(folderTree)

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      files = files.filter((file) => {
        const fileName = file.name.toLowerCase()
        const fileExtension = fileName.split(".").pop() || ""

        if (searchLower.includes("kmz") || searchLower.includes("kml")) {
          return (
            fileName.includes("kmz") ||
            fileName.includes("kml") ||
            fileExtension === "kmz" ||
            fileExtension === "kml" ||
            file.mimeType.includes("kmz") ||
            file.mimeType.includes("kml") ||
            file.mimeType.includes("application/vnd.google-earth.kmz") ||
            file.mimeType.includes("application/vnd.google-earth.kml+xml")
          )
        }

        return fileName.includes(searchLower)
      })
    }

    switch (filterType) {
      case "folders":
        files = files.filter((file) => file.isFolder)
        break
      case "files":
        files = files.filter((file) => !file.isFolder)
        break
      case "images":
        files = files.filter((file) => file.mimeType.startsWith("image/"))
        break
      case "documents":
        files = files.filter((file) => file.mimeType.includes("pdf") || file.mimeType.includes("document"))
        break
      case "kmz":
        files = files.filter((file) => {
          const fileName = file.name.toLowerCase()
          const fileExtension = fileName.split(".").pop() || ""
          return (
            fileName.includes("kmz") ||
            fileName.includes("kml") ||
            fileExtension === "kmz" ||
            fileExtension === "kml" ||
            file.mimeType.includes("kmz") ||
            file.mimeType.includes("kml") ||
            file.mimeType.includes("application/vnd.google-earth.kmz") ||
            file.mimeType.includes("application/vnd.google-earth.kml+xml")
          )
        })
        break
    }

    if (quickFilters.length > 0) {
      files = files.filter((file) =>
        quickFilters.some((filter) => {
          const fileName = file.name.toLowerCase()
          const filterLower = filter.toLowerCase()

          if (filterLower.startsWith(".")) {
            const extension = filterLower.substring(1)
            const fileExtension = fileName.split(".").pop() || ""
            return fileExtension === extension || fileName.includes(extension)
          }

          return fileName.includes(filterLower)
        }),
      )
    }

    files.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "date":
          return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
        case "size":
          return (b.size || 0) - (a.size || 0)
        case "type":
          return a.mimeType.localeCompare(b.mimeType)
        default:
          return 0
      }
    })

    return files
  }, [folderTree, searchTerm, filterType, sortBy, quickFilters])

  const addQuickFilter = (filter: string) => {
    if (!quickFilters.includes(filter)) {
      setQuickFilters([...quickFilters, filter])
    }
  }

  const removeQuickFilter = (filter: string) => {
    setQuickFilters(quickFilters.filter((f) => f !== filter))
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setFilterType("all")
    setQuickFilters([])
  }

  const renderTreeNode = (node: FolderNode) => {
    const hasSubfolders = node.subfolders.length > 0
    const totalFiles = node.files.length + node.subfolders.reduce((sum, sub) => sum + getAllFiles(sub).length, 0)

    const getCategoryColor = (category?: string) => {
      switch (category) {
        case "projects":
          return "text-red-600 bg-red-50 border-red-200"
        case "areas":
          return "text-blue-600 bg-blue-50 border-blue-200"
        case "resources":
          return "text-green-600 bg-green-50 border-green-200"
        case "archive":
          return "text-gray-600 bg-gray-50 border-gray-200"
        default:
          return "text-purple-600 bg-purple-50 border-purple-200"
      }
    }

    const getStatusColor = (status?: string) => {
      switch (status) {
        case "complete":
          return "text-green-600"
        case "partial":
          return "text-yellow-600"
        case "incomplete":
          return "text-red-600"
        default:
          return "text-gray-600"
      }
    }

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-md cursor-pointer ${
            selectedItems.has(node.id) ? "bg-blue-50 border border-blue-200" : ""
          }`}
          style={{ paddingLeft: `${node.level * 20 + 12}px` }}
          onClick={() => toggleFolder(node.id)}
        >
          {hasSubfolders && (
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
              {node.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          {!hasSubfolders && <div className="w-4" />}

          {node.isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )}

          <span className="font-medium text-gray-900 flex-1">{node.name}</span>

          <div className="flex items-center gap-2">
            {node.paraCategory && (
              <Badge className={`text-xs ${getCategoryColor(node.paraCategory)}`}>
                {node.paraCategory.toUpperCase()}
              </Badge>
            )}
            {node.completionStatus && (
              <Badge variant="outline" className={`text-xs ${getStatusColor(node.completionStatus)}`}>
                {node.completionStatus.toUpperCase()}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {totalFiles} archivos
            </Badge>
          </div>
        </div>

        {node.isExpanded && (
          <div>
            {node.subfolders.map((subfolder) => renderTreeNode(subfolder))}

            {node.files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-2 py-1 px-3 hover:bg-gray-50 rounded-md cursor-pointer ${
                  selectedItems.has(file.id) ? "bg-blue-50 border border-blue-200" : ""
                }`}
                style={{ paddingLeft: `${(node.level + 1) * 20 + 12}px` }}
                onClick={() => {
                  const newSelected = new Set(selectedItems)
                  if (newSelected.has(file.id)) {
                    newSelected.delete(file.id)
                  } else {
                    newSelected.add(file.id)
                  }
                  setSelectedItems(newSelected)
                }}
              >
                <div className="w-4" />
                {file.mimeType.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4 text-green-500" />
                ) : file.mimeType.startsWith("video/") ? (
                  <Video className="h-4 w-4 text-purple-500" />
                ) : file.mimeType.includes("pdf") ? (
                  <FileText className="h-4 w-4 text-red-500" />
                ) : file.name.toLowerCase().includes("kmz") || file.name.toLowerCase().includes("kml") ? (
                  <MapPin className="h-4 w-4 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-500" />
                )}

                <span className="text-sm text-gray-700 flex-1">{file.name}</span>

                <div className="flex items-center gap-2">
                  {file.size && (
                    <Badge variant="outline" className="text-xs">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {new Date(file.modifiedTime).toLocaleDateString("es-CL")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const tree = await loadFolderStructure(folderId)
        setFolderTree(tree)
      } catch (error) {
        console.error("Error loading folder structure:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [folderId, folderName])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando estructura completa...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar archivos KMZ, KML y carpetas..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-10 pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={performSearch}
                className="h-6 w-6 p-0 hover:bg-blue-100"
                title="Buscar"
              >
                <Search className="h-3 w-3 text-blue-600" />
              </Button>
              {(searchInput || searchTerm) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSearch}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title="Limpiar búsqueda"
                >
                  <X className="h-3 w-3 text-gray-600" />
                </Button>
              )}
            </div>
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="folders">Carpetas</SelectItem>
              <SelectItem value="files">Archivos</SelectItem>
              <SelectItem value="images">Imágenes</SelectItem>
              <SelectItem value="documents">Documentos</SelectItem>
              <SelectItem value="kmz">Archivos KMZ/KML</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="date">Fecha</SelectItem>
              <SelectItem value="size">Tamaño</SelectItem>
              <SelectItem value="type">Tipo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={viewMode === "tree" ? "default" : "outline"} size="sm" onClick={() => setViewMode("tree")}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-700">Búsqueda rápida:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            addQuickFilter(".kmz")
            if (!searchTerm) setSearchTerm(" ")
          }}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <MapPin className="h-3 w-3 mr-1" />
          .kmz
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            addQuickFilter(".kml")
            if (!searchTerm) setSearchTerm(" ")
          }}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <MapPin className="h-3 w-3 mr-1" />
          .kml
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addQuickFilter(".pdf")}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <FileText className="h-3 w-3 mr-1" />
          .pdf
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addQuickFilter("plano")}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <FileText className="h-3 w-3 mr-1" />
          plano
        </Button>

        {(searchTerm || filterType !== "all" || quickFilters.length > 0) && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-gray-500 hover:text-gray-700">
            <X className="h-3 w-3 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {quickFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Filtros activos:</span>
          {quickFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
              {filter}
              <button onClick={() => removeQuickFilter(filter)} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {folderTree && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{getAllFiles(folderTree).length}</div>
              <div className="text-sm text-gray-600">Total Archivos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {getAllFiles(folderTree).filter((f) => f.mimeType.startsWith("image/")).length}
              </div>
              <div className="text-sm text-gray-600">Imágenes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {getAllFiles(folderTree).filter((f) => f.mimeType.includes("pdf")).length}
              </div>
              <div className="text-sm text-gray-600">PDFs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {
                  getAllFiles(folderTree).filter(
                    (f) => f.name.toLowerCase().includes("kmz") || f.name.toLowerCase().includes("kml"),
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">Archivos KMZ/KML</div>
            </CardContent>
          </Card>
        </div>
      )}

      {(searchTerm || filterType !== "all" || quickFilters.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Mostrando {filteredFiles.length} de {folderTree ? getAllFiles(folderTree).length : 0} archivos
              {searchTerm && <span className="ml-2 text-blue-700">• Búsqueda: "{searchTerm}"</span>}
            </span>
          </div>
          {filteredFiles.filter((f) => f.name.toLowerCase().includes("kmz") || f.name.toLowerCase().includes("kml"))
            .length > 0 && (
            <div className="mt-2 text-sm text-green-700">
              ✓{" "}
              {
                filteredFiles.filter(
                  (f) => f.name.toLowerCase().includes("kmz") || f.name.toLowerCase().includes("kml"),
                ).length
              }{" "}
              archivos KMZ/KML encontrados
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            {folderName}
            {selectedItems.size > 0 && (
              <Badge variant="outline" className="ml-2">
                {selectedItems.size} seleccionados
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === "tree" && folderTree && (
            <div className="space-y-1 max-h-96 overflow-y-auto">{renderTreeNode(folderTree)}</div>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {file.mimeType.startsWith("image/") ? (
                        <ImageIcon className="h-5 w-5 text-green-500" />
                      ) : file.mimeType.startsWith("video/") ? (
                        <Video className="h-5 w-5 text-purple-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="font-medium text-sm truncate">{file.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(file.modifiedTime).toLocaleDateString("es-CL")}
                    </div>
                    {file.size && (
                      <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedItems.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">{selectedItems.size} elementos seleccionados</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button size="sm" variant="outline">
                  <Move className="h-4 w-4 mr-2" />
                  Mover
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
