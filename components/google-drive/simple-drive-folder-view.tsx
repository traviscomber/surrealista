"use client"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, Loader2, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { realDriveService } from "@/lib/google-drive/real-drive-service"

interface DriveItem {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  size?: string
  webViewLink?: string
  children?: DriveItem[]
  isLoaded?: boolean
  isExpanded?: boolean
}

interface SimpleDriveFolderViewProps {
  rootFolderId?: string
}

export function SimpleDriveFolderView({ rootFolderId }: SimpleDriveFolderViewProps) {
  const [rootFolders, setRootFolders] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadRootFolders()
  }, [rootFolderId])

  const loadRootFolders = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Authenticating with Google Drive...")
      const authenticated = await realDriveService.authenticate()

      if (!authenticated) {
        throw new Error("Failed to authenticate with Google Drive")
      }

      console.log("[v0] Loading root folders from Google Drive...")
      const response = await fetch("/api/drive/folders")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Loaded root folders:", data.files?.length || 0)

      const folders: DriveItem[] = (data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        size: file.size,
        webViewLink: file.webViewLink,
        children: undefined, // Not loaded yet
        isLoaded: false,
        isExpanded: false,
      }))

      setRootFolders(folders)
    } catch (err: any) {
      console.error("[v0] Error loading root folders:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadFolderContents = async (folderId: string): Promise<DriveItem[]> => {
    try {
      console.log("[v0] Loading contents for folder:", folderId)
      const response = await fetch(`/api/drive/folders/${folderId}`)

      if (!response.ok) {
        throw new Error(`Failed to load folder contents: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Loaded", data.files?.length || 0, "items from folder")

      return (data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        size: file.size,
        webViewLink: file.webViewLink,
        children: file.mimeType === "application/vnd.google-apps.folder" ? undefined : null,
        isLoaded: false,
        isExpanded: false,
      }))
    } catch (error) {
      console.error("[v0] Error loading folder contents:", error)
      return []
    }
  }

  const toggleFolder = async (item: DriveItem, path: DriveItem[]) => {
    const isFolder = item.mimeType === "application/vnd.google-apps.folder"
    if (!isFolder) return

    // If already expanded, just collapse it
    if (item.isExpanded) {
      updateItemInTree(path, { ...item, isExpanded: false })
      return
    }

    // If not loaded yet, fetch contents
    if (!item.isLoaded) {
      setLoadingFolders((prev) => new Set(prev).add(item.id))

      const children = await loadFolderContents(item.id)

      setLoadingFolders((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })

      updateItemInTree(path, {
        ...item,
        children,
        isLoaded: true,
        isExpanded: true,
      })
    } else {
      // Already loaded, just expand
      updateItemInTree(path, { ...item, isExpanded: true })
    }
  }

  const updateItemInTree = (path: DriveItem[], updatedItem: DriveItem) => {
    setRootFolders((prevFolders) => {
      const newFolders = [...prevFolders]

      if (path.length === 1) {
        // Root level item
        const index = newFolders.findIndex((f) => f.id === updatedItem.id)
        if (index !== -1) {
          newFolders[index] = updatedItem
        }
      } else {
        // Nested item - traverse the path
        let current: DriveItem[] = newFolders
        for (let i = 0; i < path.length - 1; i++) {
          const parentIndex = current.findIndex((f) => f.id === path[i].id)
          if (parentIndex !== -1 && current[parentIndex].children) {
            current = current[parentIndex].children!
          }
        }

        const index = current.findIndex((f) => f.id === updatedItem.id)
        if (index !== -1) {
          current[index] = updatedItem
        }
      }

      return newFolders
    })
  }

  const renderFile = (file: DriveItem, depth: number) => {
    const matchesSearch = searchTerm === "" || file.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return null

    return (
      <div
        key={file.id}
        className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        onClick={() => file.webViewLink && window.open(file.webViewLink, "_blank")}
      >
        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm truncate flex-1">{file.name}</span>
        {file.size && (
          <span className="text-xs text-muted-foreground">{formatFileSize(Number.parseInt(file.size))}</span>
        )}
      </div>
    )
  }

  const renderFolder = (item: DriveItem, depth: number, path: DriveItem[]) => {
    const isFolder = item.mimeType === "application/vnd.google-apps.folder"
    const matchesSearch = searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch && searchTerm !== "") return null

    const currentPath = [...path, item]
    const isLoadingThis = loadingFolders.has(item.id)

    if (!isFolder) {
      return renderFile(item, depth)
    }

    return (
      <div key={item.id} className="w-full">
        <div
          className="flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded cursor-pointer"
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => toggleFolder(item, currentPath)}
        >
          {isLoadingThis ? (
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
          ) : item.isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          {item.isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )}
          <span className="text-sm font-medium truncate flex-1">{item.name}</span>
          {item.children && item.isLoaded && (
            <span className="text-xs text-muted-foreground">{item.children.length} items</span>
          )}
        </div>

        {item.isExpanded && item.children && (
          <div className="w-full">{item.children.map((child) => renderFolder(child, depth + 1, currentPath))}</div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-12">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={loadRootFolders}>Reintentar</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Google Drive - Estructura de Carpetas
        </CardTitle>
        <Input
          placeholder="Buscar carpetas y archivos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-4"
        />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {rootFolders.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron carpetas</p>
          </div>
        ) : (
          <div className="space-y-1">{rootFolders.map((folder) => renderFolder(folder, 0, []))}</div>
        )}
      </CardContent>
    </Card>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}
