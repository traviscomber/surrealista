"use client"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, Loader2, FolderOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"

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
  onKMZSelected?: (kmzData: any[]) => void
}

export function SimpleDriveFolderView({ rootFolderId, onKMZSelected }: SimpleDriveFolderViewProps) {
  const [rootFolders, setRootFolders] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadOfflineData()
  }, [])

  const loadOfflineData = async () => {
    try {
      setLoading(true)

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase
        .from("kmz_collection")
        .select("id, file_name, region")
        .eq("is_active", true)
        .order("region", { ascending: true })

      if (error) {
        console.error("[v0] Error loading KMZ data:", error)
        setRootFolders([])
        return
      }

      const folderMap = new Map<string, DriveItem>()

      data?.forEach((kmz: any) => {
        const region = kmz.region || "Sin Región"
        if (!folderMap.has(region)) {
          folderMap.set(region, {
            id: `folder-${region}`,
            name: region,
            mimeType: "application/vnd.google-apps.folder",
            children: [],
            isLoaded: true,
            isExpanded: false,
          })
        }

        const folder = folderMap.get(region)!
        folder.children!.push({
          id: kmz.id,
          name: kmz.file_name || "Sin nombre",
          mimeType: "application/vnd.google-apps.file",
          children: null,
          isLoaded: true,
        })
      })

      setRootFolders(Array.from(folderMap.values()))
    } catch (error) {
      console.error("[v0] Error loading offline data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = async (item: DriveItem) => {
    const isFolder = item.mimeType === "application/vnd.google-apps.folder"
    if (!isFolder) return

    setRootFolders((prev) =>
      prev.map((folder) => (folder.id === item.id ? { ...folder, isExpanded: !folder.isExpanded } : folder)),
    )

    if (!item.isExpanded && onKMZSelected && item.children) {
      const kmzFiles = item.children.filter((child) => child.mimeType === "application/vnd.google-apps.file")
      onKMZSelected(kmzFiles)
    }
  }

  const handleFileClick = (file: DriveItem) => {
    if (onKMZSelected) {
      onKMZSelected([file])
    }
  }

  const renderFolder = (item: DriveItem, depth: number) => {
    const isFolder = item.mimeType === "application/vnd.google-apps.folder"
    const matchesSearch = searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch && searchTerm !== "") return null

    if (!isFolder) {
      return (
        <div
          key={item.id}
          className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer"
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => handleFileClick(item)}
        >
          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate flex-1">{item.name}</span>
        </div>
      )
    }

    return (
      <div key={item.id} className="w-full">
        <div
          className="flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded cursor-pointer"
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => toggleFolder(item)}
        >
          {item.isExpanded ? (
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
          {item.children && <span className="text-xs text-muted-foreground">{item.children.length} items</span>}
        </div>

        {item.isExpanded && item.children && (
          <div className="w-full">{item.children.map((child) => renderFolder(child, depth + 1))}</div>
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Estructura de Carpetas
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Mostrando datos desde Supabase. Haz clic en una carpeta o archivo para visualizar en el mapa.
        </p>
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
          <div className="space-y-1">{rootFolders.map((folder) => renderFolder(folder, 0))}</div>
        )}
      </CardContent>
    </Card>
  )
}
