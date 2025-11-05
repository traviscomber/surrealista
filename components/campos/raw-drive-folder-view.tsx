"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder, File, ChevronRight, ChevronDown, RefreshCw, Search, Loader2 } from "lucide-react"
import { driveFolderCache, type CachedFolder } from "@/lib/google-drive/drive-folder-cache"
import { cn } from "@/lib/utils"

interface RawDriveFolderViewProps {
  onFolderSelect?: (folder: CachedFolder) => void
  onFileSelect?: (file: CachedFolder) => void
}

export function RawDriveFolderView({ onFolderSelect, onFileSelect }: RawDriveFolderViewProps) {
  const [folders, setFolders] = useState<CachedFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading raw Drive folder structure...")
      const cachedFolders = await driveFolderCache.getOrFetchFolders()
      setFolders(cachedFolders)
      console.log("[v0] Loaded", cachedFolders.length, "folders")
    } catch (error) {
      console.error("[v0] Error loading folders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      console.log("[v0] Refreshing folder structure...")
      const freshFolders = await driveFolderCache.refreshCache()
      setFolders(freshFolders)
      console.log("[v0] Refreshed", freshFolders.length, "folders")
    } catch (error) {
      console.error("[v0] Error refreshing folders:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const filterFolders = (folders: CachedFolder[], query: string): CachedFolder[] => {
    if (!query) return folders

    const lowerQuery = query.toLowerCase()
    return folders.filter((folder) => {
      const matchesName = folder.name.toLowerCase().includes(lowerQuery)
      const hasMatchingChildren =
        folder.children && folder.children.some((child) => child.name.toLowerCase().includes(lowerQuery))
      return matchesName || hasMatchingChildren
    })
  }

  const renderFolder = (folder: CachedFolder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isFolder = folder.mimeType === "application/vnd.google-apps.folder"
    const hasChildren = folder.children && folder.children.length > 0

    return (
      <div key={folder.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-md cursor-pointer transition-colors",
            depth > 0 && "ml-4",
          )}
          onClick={() => {
            if (isFolder) {
              toggleFolder(folder.id)
              onFolderSelect?.(folder)
            } else {
              onFileSelect?.(folder)
            }
          }}
        >
          {isFolder && hasChildren && (
            <button
              className="p-0.5 hover:bg-accent-foreground/10 rounded"
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          {isFolder && !hasChildren && <div className="w-5" />}
          {isFolder ? <Folder className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-gray-500" />}
          <span className="text-sm truncate flex-1">{folder.name}</span>
          {hasChildren && <span className="text-xs text-muted-foreground">({folder.children?.length})</span>}
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-2">{folder.children?.map((child) => renderFolder(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  const filteredFolders = filterFolders(folders, searchQuery)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Cargando estructura de carpetas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Carpetas Google Drive</h3>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Actualizar
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar carpetas y archivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="text-xs text-muted-foreground">
          {filteredFolders.length} carpetas {searchQuery && `(filtradas de ${folders.length})`}
        </div>
      </div>

      {/* Folder Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredFolders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron carpetas</p>
            </div>
          ) : (
            filteredFolders.map((folder) => renderFolder(folder))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
