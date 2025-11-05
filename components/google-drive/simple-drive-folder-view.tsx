"use client"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { realDriveService } from "@/lib/google-drive/real-drive-service"

interface DriveItem {
  id: string
  name: string
  mimeType: string
  isFolder: boolean
  size?: string
  modifiedTime?: string
  children?: DriveItem[]
  isExpanded: boolean
  isLoading: boolean
  childrenLoaded: boolean
}

interface SimpleDriveFolderViewProps {
  rootFolderId?: string
}

export function SimpleDriveFolderView({ rootFolderId }: SimpleDriveFolderViewProps) {
  const [rootFolders, setRootFolders] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

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

      // Fetch root folders from API
      const response = await fetch("/api/drive/folders")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Root folders response:", data)

      // Convert to DriveItem format
      const folders: DriveItem[] = (data.files || [])
        .filter((f: any) => f.mimeType === "application/vnd.google-apps.folder")
        .map((f: any) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          isFolder: true,
          modifiedTime: f.modifiedTime,
          children: [],
          isExpanded: false,
          isLoading: false,
          childrenLoaded: false,
        }))

      console.log("[v0] Loaded", folders.length, "root folders")
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
      console.log("[v0] Folder contents:", data)

      // Convert files and subfolders to DriveItem format
      const items: DriveItem[] = (data.files || []).map((f: any) => {
        const isFolder = f.mimeType === "application/vnd.google-apps.folder"
        return {
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          isFolder,
          size: f.size,
          modifiedTime: f.modifiedTime,
          children: [],
          isExpanded: false,
          isLoading: false,
          childrenLoaded: false,
        }
      })

      console.log("[v0] Loaded", items.length, "items from folder")
      return items
    } catch (error) {
      console.error("[v0] Error loading folder contents:", error)
      return []
    }
  }

  const toggleFolder = async (folderId: string, path: number[] = []) => {
    const updateFolder = (folders: DriveItem[], currentPath: number[]): DriveItem[] => {
      if (currentPath.length === 0) {
        return folders.map((folder) => {
          if (folder.id === folderId) {
            const newExpanded = !folder.isExpanded

            // If expanding and children not loaded, mark as loading
            if (newExpanded && !folder.childrenLoaded) {
              return { ...folder, isExpanded: newExpanded, isLoading: true }
            }

            return { ...folder, isExpanded: newExpanded }
          }
          return folder
        })
      }

      const [currentIndex, ...restPath] = currentPath
      return folders.map((folder, index) => {
        if (index === currentIndex && folder.children) {
          return {
            ...folder,
            children: updateFolder(folder.children, restPath),
          }
        }
        return folder
      })
    }

    setRootFolders((prev) => updateFolder(prev, path))

    // Load children if expanding and not already loaded
    const getFolder = (folders: DriveItem[], currentPath: number[]): DriveItem | null => {
      if (currentPath.length === 0) {
        return folders.find((f) => f.id === folderId) || null
      }
      const [currentIndex, ...restPath] = currentPath
      const folder = folders[currentIndex]
      if (folder && folder.children) {
        return getFolder(folder.children, restPath)
      }
      return null
    }

    const folder = getFolder(rootFolders, path)

    if (folder && !folder.isExpanded && !folder.childrenLoaded) {
      // Load children
      const children = await loadFolderContents(folderId)

      // Update folder with loaded children
      const updateWithChildren = (folders: DriveItem[], currentPath: number[]): DriveItem[] => {
        if (currentPath.length === 0) {
          return folders.map((f) => {
            if (f.id === folderId) {
              return {
                ...f,
                children,
                isLoading: false,
                childrenLoaded: true,
                isExpanded: true,
              }
            }
            return f
          })
        }

        const [currentIndex, ...restPath] = currentPath
        return folders.map((f, index) => {
          if (index === currentIndex && f.children) {
            return {
              ...f,
              children: updateWithChildren(f.children, restPath),
            }
          }
          return f
        })
      }

      setRootFolders((prev) => updateWithChildren(prev, path))
    }
  }

  const renderFile = (file: DriveItem, depth: number) => {
    const matchesSearch = searchTerm === "" || file.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return null

    return (
      <div
        key={file.id}
        className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded"
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm truncate">{file.name}</span>
        {file.size && (
          <span className="text-xs text-muted-foreground ml-auto">{formatFileSize(Number.parseInt(file.size))}</span>
        )}
      </div>
    )
  }

  const renderFolder = (folder: DriveItem, depth = 0, path: number[] = []) => {
    const matchesSearch = searchTerm === "" || folder.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch && searchTerm !== "") return null

    return (
      <div key={folder.id} className="w-full">
        <div
          className="flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded cursor-pointer"
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => toggleFolder(folder.id, path)}
        >
          {folder.isLoading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground flex-shrink-0 animate-spin" />
          ) : folder.isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium truncate">{folder.name}</span>
          {folder.childrenLoaded && (
            <span className="text-xs text-muted-foreground ml-auto">{folder.children?.length || 0} items</span>
          )}
        </div>

        {folder.isExpanded && folder.children && folder.children.length > 0 && (
          <div className="w-full">
            {folder.children.map((child, index) => {
              if (child.isFolder) {
                return renderFolder(child, depth + 1, [...path, index])
              } else {
                return renderFile(child, depth + 1)
              }
            })}
          </div>
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
          <Button onClick={loadRootFolders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
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
            <Button onClick={loadRootFolders} className="mt-4 bg-transparent" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar
            </Button>
          </div>
        ) : (
          <div className="space-y-1">{rootFolders.map((folder, index) => renderFolder(folder, 0, [index]))}</div>
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
