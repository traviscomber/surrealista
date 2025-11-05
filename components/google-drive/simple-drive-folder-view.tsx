"use client"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { realDriveService, type FolderStructure, type DriveFile } from "@/lib/google-drive/real-drive-service"

interface DriveItem {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  children?: DriveItem[]
  isExpanded?: boolean
}

interface SimpleDriveFolderViewProps {
  rootFolderId?: string
}

export function SimpleDriveFolderView({ rootFolderId }: SimpleDriveFolderViewProps) {
  const [folders, setFolders] = useState<FolderStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFolders()
  }, [rootFolderId])

  const loadFolders = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Authenticating with Google Drive...")
      const authenticated = await realDriveService.authenticate()

      if (!authenticated) {
        throw new Error("Failed to authenticate with Google Drive")
      }

      console.log("[v0] Loading folders from Google Drive...")
      const folderData = await realDriveService.listSuccessCases()

      console.log(
        "[v0] Loaded folders:",
        folderData.map((f) => f.name),
      )
      setFolders(folderData)
    } catch (err: any) {
      console.error("[v0] Error loading folders:", err)
      setError(err.message)
    } finally {
      setLoading(false)
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

  const renderFile = (file: DriveFile) => {
    const isFolder = file.mimeType === "application/vnd.google-apps.folder"
    const Icon = isFolder ? Folder : File
    const matchesSearch = searchTerm === "" || file.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return null

    return (
      <div key={file.id} className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded">
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm truncate">{file.name}</span>
        {file.size && (
          <span className="text-xs text-muted-foreground ml-auto">{formatFileSize(Number.parseInt(file.size))}</span>
        )}
      </div>
    )
  }

  const renderFolder = (folder: FolderStructure, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const hasChildren = folder.files.length > 0 || folder.subfolders.length > 0
    const matchesSearch = searchTerm === "" || folder.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch && searchTerm !== "") return null

    return (
      <div key={folder.id} className="w-full">
        <div
          className="flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded cursor-pointer"
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => hasChildren && toggleFolder(folder.id)}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ))}
          {!hasChildren && <div className="w-4" />}
          <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium truncate">{folder.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">{folder.totalFiles} archivos</span>
        </div>

        {isExpanded && (
          <div className="w-full">
            {folder.subfolders.map((subfolder) => renderFolder(subfolder, depth + 1))}
            {folder.files.map((file) => (
              <div key={file.id} style={{ paddingLeft: `${(depth + 1) * 1.5 + 0.5}rem` }}>
                {renderFile(file)}
              </div>
            ))}
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
          <Button onClick={loadFolders}>Reintentar</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Google Drive
        </CardTitle>
        <Input
          placeholder="Buscar carpetas y archivos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-4"
        />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {folders.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron carpetas</p>
          </div>
        ) : (
          <div className="space-y-1">{folders.map((folder) => renderFolder(folder))}</div>
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
