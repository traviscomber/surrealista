"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { KMZMapDisplay } from "@/components/kmz/kmz-map-display"
import { createBrowserClient } from "@/lib/supabase/client"
import { Folder, FolderOpen, File, Search, ChevronRight, ChevronDown, MapPin } from "lucide-react"

interface FolderItem {
  id: string
  name: string
  type: "folder" | "file"
  location?: { lat: number; lng: number }
  area?: string
  kmzFiles?: any[]
  children?: FolderItem[]
  isOpen?: boolean
}

// Mock folder structure with 7 divisions
const MASTER_FOLDERS: FolderItem[] = [
  {
    id: "region-14",
    name: "Región de Los Ríos",
    type: "folder",
    location: { lat: -39.8196, lng: -73.2452 },
    area: "Valdivia",
    children: [
      {
        id: "valdivia-1",
        name: "Valdivia 142 has",
        type: "file",
        location: { lat: -39.8196, lng: -73.2452 },
        area: "142 hectáreas",
      },
      {
        id: "valdivia-2",
        name: "Corral 85 has",
        type: "file",
        location: { lat: -39.8833, lng: -73.4333 },
        area: "85 hectáreas",
      },
    ],
  },
  {
    id: "region-9",
    name: "Región de La Araucanía",
    type: "folder",
    location: { lat: -39.2819, lng: -71.9489 },
    area: "Pucón",
    children: [
      {
        id: "pucon-1",
        name: "Pucón Lote 45",
        type: "file",
        location: { lat: -39.2819, lng: -71.9489 },
        area: "45 hectáreas",
      },
      {
        id: "pucon-2",
        name: "Villarrica 67 has",
        type: "file",
        location: { lat: -39.2833, lng: -72.2333 },
        area: "67 hectáreas",
      },
    ],
  },
  {
    id: "region-10",
    name: "Región de Los Lagos",
    type: "folder",
    location: { lat: -42.4827, lng: -73.7615 },
    area: "Castro",
    children: [
      {
        id: "castro-1",
        name: "Castro Parcela 23",
        type: "file",
        location: { lat: -42.4827, lng: -73.7615 },
        area: "23 hectáreas",
      },
      {
        id: "castro-2",
        name: "Ancud 156 has",
        type: "file",
        location: { lat: -41.8697, lng: -73.8203 },
        area: "156 hectáreas",
      },
    ],
  },
  {
    id: "region-8",
    name: "Región del Biobío",
    type: "folder",
    location: { lat: -36.8201, lng: -73.0444 },
    area: "Concepción",
    children: [
      {
        id: "concepcion-1",
        name: "Concepción 98 has",
        type: "file",
        location: { lat: -36.8201, lng: -73.0444 },
        area: "98 hectáreas",
      },
    ],
  },
  {
    id: "region-7",
    name: "Región del Maule",
    type: "folder",
    location: { lat: -35.4264, lng: -71.6554 },
    area: "Talca",
    children: [
      {
        id: "talca-1",
        name: "Talca 234 has",
        type: "file",
        location: { lat: -35.4264, lng: -71.6554 },
        area: "234 hectáreas",
      },
    ],
  },
  {
    id: "region-6",
    name: "Región de O'Higgins",
    type: "folder",
    location: { lat: -34.1701, lng: -70.7403 },
    area: "Rancagua",
    children: [
      {
        id: "rancagua-1",
        name: "Rancagua 178 has",
        type: "file",
        location: { lat: -34.1701, lng: -70.7403 },
        area: "178 hectáreas",
      },
    ],
  },
  {
    id: "region-5",
    name: "Región de Valparaíso",
    type: "folder",
    location: { lat: -33.0472, lng: -71.6127 },
    area: "Valparaíso",
    children: [
      {
        id: "valparaiso-1",
        name: "Valparaíso 89 has",
        type: "file",
        location: { lat: -33.0472, lng: -71.6127 },
        area: "89 hectáreas",
      },
    ],
  },
]

export function CAMPOSFolderView() {
  const [folders, setFolders] = useState<FolderItem[]>(MASTER_FOLDERS)
  const [selectedItem, setSelectedItem] = useState<FolderItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [kmzFiles, setKmzFiles] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)

  const supabase = createBrowserClient()

  // Toggle folder open/close
  const toggleFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((folder) => (folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder)),
    )
  }

  // Handle folder/file click
  const handleItemClick = async (item: FolderItem) => {
    console.log("[v0] Item clicked:", item.name)
    setSelectedItem(item)

    if (item.location) {
      setMapCenter(item.location)
    }

    // If it's a folder, toggle it open
    if (item.type === "folder") {
      toggleFolder(item.id)
    }

    // Load KMZ files for this location
    if (item.location) {
      try {
        const { data, error } = await supabase
          .from("kmz_collection")
          .select("*")
          .or(`location.cs.{lat:${item.location.lat},lng:${item.location.lng}},name.ilike.%${item.name}%`)
          .limit(10)

        if (error) {
          console.error("[v0] Error loading KMZ files:", error)
        } else {
          console.log("[v0] Loaded KMZ files for item:", data?.length || 0)
          setKmzFiles(data || [])
        }
      } catch (err) {
        console.error("[v0] Error fetching KMZ:", err)
      }
    }
  }

  // Filter folders based on search
  const filteredFolders = folders.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Folders */}
      <Card className="w-80 m-4 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">Carpetas CAMPOS</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar carpetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredFolders.map((folder) => (
              <div key={folder.id}>
                <Button
                  variant={selectedItem?.id === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleItemClick(folder)}
                >
                  {folder.isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                  {folder.isOpen ? <FolderOpen className="h-4 w-4 mr-2" /> : <Folder className="h-4 w-4 mr-2" />}
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  {folder.location && <MapPin className="h-3 w-3 ml-2 text-muted-foreground" />}
                </Button>

                {/* Children files */}
                {folder.isOpen && folder.children && (
                  <div className="ml-6 mt-1 space-y-1">
                    {folder.children.map((child) => (
                      <Button
                        key={child.id}
                        variant={selectedItem?.id === child.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleItemClick(child)}
                      >
                        <File className="h-3 w-3 mr-2" />
                        <span className="flex-1 text-left text-sm truncate">{child.name}</span>
                        {child.area && (
                          <Badge variant="outline" className="text-xs">
                            {child.area}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Center - Map */}
      <div className="flex-1 m-4 relative">
        <KMZMapDisplay
          kmzFiles={kmzFiles}
          center={mapCenter || undefined}
          selectedMarker={
            selectedItem?.location
              ? {
                  position: selectedItem.location,
                  label: selectedItem.name,
                }
              : undefined
          }
        />
      </div>

      {/* Right Sidebar - Details */}
      <Card className="w-80 m-4 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Detalles</h2>
        </div>

        <ScrollArea className="flex-1">
          {selectedItem ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedItem.type === "folder" ? (
                    <Folder className="h-5 w-5 text-primary" />
                  ) : (
                    <File className="h-5 w-5 text-primary" />
                  )}
                  <h3 className="font-semibold">{selectedItem.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.type === "folder" ? "Carpeta" : "Archivo"}
                </p>
              </div>

              {selectedItem.area && (
                <div>
                  <p className="text-sm font-medium mb-1">Área</p>
                  <Badge variant="secondary">{selectedItem.area}</Badge>
                </div>
              )}

              {selectedItem.location && (
                <div>
                  <p className="text-sm font-medium mb-1">Ubicación</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Lat: {selectedItem.location.lat.toFixed(4)}</p>
                    <p>Lng: {selectedItem.location.lng.toFixed(4)}</p>
                  </div>
                </div>
              )}

              {selectedItem.children && (
                <div>
                  <p className="text-sm font-medium mb-2">Archivos ({selectedItem.children.length})</p>
                  <div className="space-y-1">
                    {selectedItem.children.map((child) => (
                      <div key={child.id} className="text-sm p-2 rounded bg-muted/50 flex items-center gap-2">
                        <File className="h-3 w-3" />
                        <span className="flex-1 truncate">{child.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {kmzFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Archivos KMZ ({kmzFiles.length})</p>
                  <div className="space-y-1">
                    {kmzFiles.map((file) => (
                      <div key={file.id} className="text-sm p-2 rounded bg-muted/50 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="flex-1 truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecciona una carpeta o archivo para ver detalles</p>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  )
}
