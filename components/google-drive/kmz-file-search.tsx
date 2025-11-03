"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, FolderOpen, Download, Filter, Loader2, Eye, Map } from "lucide-react"
import { driveService, type DriveFile, type DriveFolder } from "@/lib/google-drive/drive-service"

interface KMZSearchResult {
  file: DriveFile
  folderPath: string[]
  parentFolder: string
  depth: number
}

export default function KMZFileSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<KMZSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
  const [folderFilter, setFolderFilter] = useState<string>("all")
  const [sizeFilter, setSizeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [allFolders, setAllFolders] = useState<DriveFolder[]>([])

  const searchKMZFiles = async () => {
    if (!searchQuery.trim() && folderFilter === "all") return

    setIsSearching(true)
    setSearchProgress(0)
    setSearchResults([])

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSearchProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      // Search for KMZ files using Google Drive API
      let searchQueryString = ""

      if (searchQuery.trim()) {
        searchQueryString = `name contains '${searchQuery}' and `
      }

      // Add KMZ file type filter
      searchQueryString += `(name contains '.kmz' or mimeType contains 'kmz' or mimeType contains 'google-earth') and trashed=false`

      const kmzFiles = await driveService.searchFiles(searchQueryString)

      // Get folder structure for each file to build path
      const results: KMZSearchResult[] = []

      for (const file of kmzFiles) {
        try {
          // Get parent folder information
          if (file.parents && file.parents.length > 0) {
            const parentId = file.parents[0]
            const folderPath = await buildFolderPath(parentId)

            results.push({
              file,
              folderPath,
              parentFolder: folderPath[folderPath.length - 1] || "Root",
              depth: folderPath.length,
            })
          } else {
            results.push({
              file,
              folderPath: ["Root"],
              parentFolder: "Root",
              depth: 0,
            })
          }
        } catch (error) {
          console.error(`Error getting folder path for ${file.name}:`, error)
          // Add file even if we can't get folder path
          results.push({
            file,
            folderPath: ["Unknown"],
            parentFolder: "Unknown",
            depth: 0,
          })
        }
      }

      // Apply additional filters
      let filteredResults = results

      if (folderFilter !== "all") {
        filteredResults = results.filter((result) =>
          result.parentFolder.toLowerCase().includes(folderFilter.toLowerCase()),
        )
      }

      if (sizeFilter !== "all") {
        filteredResults = filteredResults.filter((result) => {
          const size = Number.parseInt(result.file.size || "0")
          switch (sizeFilter) {
            case "small":
              return size < 1024 * 1024 // < 1MB
            case "medium":
              return size >= 1024 * 1024 && size < 10 * 1024 * 1024 // 1-10MB
            case "large":
              return size >= 10 * 1024 * 1024 // > 10MB
            default:
              return true
          }
        })
      }

      if (dateFilter !== "all") {
        const now = new Date()
        filteredResults = filteredResults.filter((result) => {
          const fileDate = new Date(result.file.modifiedTime)
          const daysDiff = (now.getTime() - fileDate.getTime()) / (1000 * 3600 * 24)

          switch (dateFilter) {
            case "week":
              return daysDiff <= 7
            case "month":
              return daysDiff <= 30
            case "year":
              return daysDiff <= 365
            default:
              return true
          }
        })
      }

      clearInterval(progressInterval)
      setSearchProgress(100)
      setSearchResults(filteredResults)

      setTimeout(() => {
        setSearchProgress(0)
        setIsSearching(false)
      }, 500)
    } catch (error) {
      console.error("Error searching KMZ files:", error)
      setIsSearching(false)
      setSearchProgress(0)
    }
  }

  const buildFolderPath = async (folderId: string): Promise<string[]> => {
    const path: string[] = []
    let currentId = folderId

    try {
      while (currentId) {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${currentId}?key=${driveService.apiKey}&fields=id,name,parents`,
        )

        if (!response.ok) break

        const folderInfo = await response.json()
        path.unshift(folderInfo.name)

        currentId = folderInfo.parents?.[0] || null

        // Prevent infinite loops
        if (path.length > 10) break
      }
    } catch (error) {
      console.error("Error building folder path:", error)
    }

    return path
  }

  const formatFileSize = (bytes: string | undefined): string => {
    if (!bytes) return "Unknown"
    const size = Number.parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchKMZFiles()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Búsqueda de Archivos KMZ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar archivos KMZ por nombre (ej: campo, iñipulli, 140)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button onClick={searchKMZFiles} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Buscar
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>

              <Select value={folderFilter} onValueChange={setFolderFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Carpeta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las carpetas</SelectItem>
                  <SelectItem value="campo">Campos</SelectItem>
                  <SelectItem value="fundo">Fundos</SelectItem>
                  <SelectItem value="terreno">Terrenos</SelectItem>
                  <SelectItem value="propiedad">Propiedades</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tamaño" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="small">&lt; 1MB</SelectItem>
                  <SelectItem value="medium">1-10MB</SelectItem>
                  <SelectItem value="large">&gt; 10MB</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Progress */}
            {isSearching && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Buscando archivos KMZ en carpetas y subcarpetas...</span>
                  <span>{searchProgress}%</span>
                </div>
                <Progress value={searchProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Archivos KMZ Encontrados
              </div>
              <Badge variant="default">{searchResults.length} archivos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div key={result.file.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{result.file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          KMZ
                        </Badge>
                      </div>

                      {/* Folder Path */}
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <FolderOpen className="h-3 w-3" />
                        <span>Ruta: </span>
                        {result.folderPath.map((folder, idx) => (
                          <span key={idx}>
                            {folder}
                            {idx < result.folderPath.length - 1 && " / "}
                          </span>
                        ))}
                      </div>

                      {/* File Details */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Tamaño: {formatFileSize(result.file.size)}</span>
                        {result.file.size && Number.parseInt(result.file.size) > 10 * 1024 * 1024 && (
                          <Badge variant="destructive" className="text-xs">
                            Archivo muy grande - puede causar problemas de rendimiento
                          </Badge>
                        )}
                        <span>Modificado: {new Date(result.file.modifiedTime).toLocaleDateString("es-CL")}</span>
                        <span>Profundidad: {result.depth} niveles</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-3 w-3 mr-1" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isSearching && searchResults.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron archivos KMZ</h3>
            <p className="text-gray-600">Intenta con diferentes términos de búsqueda o ajusta los filtros.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
