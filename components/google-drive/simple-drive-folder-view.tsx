"use client"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DriveItem {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  children?: DriveItem[]
  isExpanded?: boolean
}

interface SimpleDriveFolderViewProps {
  apiKey: string
}

export function SimpleDriveFolderView({ apiKey }: SimpleDriveFolderViewProps) {
  const [items, setItems] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRootFolders()
  }, [])

  const loadRootFolders = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Loading root folders from Google Drive...")

      // Fetch all folders and files from Google Drive
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?key=${apiKey}&q=trashed=false&fields=files(id,name,mimeType,parents)&pageSize=1000`,
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const allItems: DriveItem[] = data.files || []

      console.log("[v0] Loaded", allItems.length, "items from Google Drive")
      console.log("[v0] Item names:", allItems.map((i) => i.name).slice(0, 10))

      // Build tree structure
      const itemMap = new Map<string, DriveItem>()
      allItems.forEach((item) => {
        itemMap.set(item.id, { ...item, children: [], isExpanded: false })
      })

      // Find root items (items without parents or with parents not in our list)
      const rootItems: DriveItem[] = []
      allItems.forEach((item) => {
        const itemWithChildren = itemMap.get(item.id)!

        if (!item.parents || item.parents.length === 0) {
          rootItems.push(itemWithChildren)
        } else {
          const parent = itemMap.get(item.parents[0])
          if (parent) {
            parent.children = parent.children || []
            parent.children.push(itemWithChildren)
          } else {
            // Parent not in our list, treat as root
            rootItems.push(itemWithChildren)
          }
        }
      })

      // Sort by name
      const sortItems = (items: DriveItem[]) => {
        items.sort((a, b) => {
          // Folders first
          const aIsFolder = a.mimeType === "application/vnd.google-apps.folder"
          const bIsFolder = b.mimeType === "application/vnd.google-apps.folder"
          if (aIsFolder && !bIsFolder) return -1
          if (!aIsFolder && bIsFolder) return 1
          return a.name.localeCompare(b.name)
        })
        items.forEach((item) => {
          if (item.children) sortItems(item.children)
        })
      }

      sortItems(rootItems)

      console.log("[v0] Built tree with", rootItems.length, "root items")
      setItems(rootItems)
    } catch (err: any) {
      console.error("[v0] Error loading folders:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (itemId: string) => {
    const updateItems = (items: DriveItem[]): DriveItem[] => {
      return items.map((item) => {
        if (item.id === itemId) {
          return { ...item, isExpanded: !item.isExpanded }
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) }
        }
        return item
      })
    }

    setItems(updateItems(items))
  }

  const renderItem = (item: DriveItem, level = 0) => {
    const isFolder = item.mimeType === "application/vnd.google-apps.folder"
    const hasChildren = item.children && item.children.length > 0
    const matchesSearch = searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return null

    return (
      <div key={item.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-100 rounded cursor-pointer"
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => isFolder && toggleFolder(item.id)}
        >
          {isFolder && hasChildren && (
            <span className="text-gray-500">
              {item.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
          {isFolder && !hasChildren && <span className="w-4" />}
          {isFolder ? (
            <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <span className="text-sm truncate">{item.name}</span>
          {hasChildren && <span className="text-xs text-gray-400 ml-auto">{item.children!.length}</span>}
        </div>
        {isFolder && item.isExpanded && item.children && (
          <div>{item.children.map((child) => renderItem(child, level + 1))}</div>
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
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron carpetas</p>
          </div>
        ) : (
          <div className="space-y-1">{items.map((item) => renderItem(item))}</div>
        )}
      </CardContent>
    </Card>
  )
}
