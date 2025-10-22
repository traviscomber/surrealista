"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { KMZMapDisplay } from "@/components/kmz/kmz-map-display"
import { createBrowserClient } from "@/lib/supabase/client"
import { Folder, FolderOpen, File, Search, ChevronRight, ChevronDown, MapPin, RefreshCw } from "lucide-react"

interface FolderItem {
  id: string
  name: string
  type: "folder" | "file"
  location?: { lat: number; lng: number }
  area?: string
  kmzFiles?: any[]
  children?: FolderItem[]
  isOpen?: boolean
  category?: string
  fileCount?: number
  dbId?: number
}

export function CAMPOSFolderView() {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FolderItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [kmzFiles, setKmzFiles] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [isLoadingKMZ, setIsLoadingKMZ] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const supabase = createBrowserClient()

  useEffect(() => {
    loadRegionMetadata()
  }, [])

  const loadRegionMetadata = async () => {
    console.log("[v0] Loading region metadata from database...")
    setIsLoadingMetadata(true)

    try {
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("id, file_name, region, placemarks_count, bounds, tags, file_path")
        .eq("is_active", true)
        .order("region", { ascending: true })

      if (error) {
        console.error("[v0] Error loading metadata:", error)
        setFolders([])
      } else {
        console.log("[v0] Loaded metadata for", data?.length || 0, "KMZ files")
        buildRegionFolders(data || [])
      }
    } catch (err) {
      console.error("[v0] Error fetching metadata:", err)
      setFolders([])
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  const calculateCenterFromBounds = (bounds: any): { lat: number; lng: number } => {
    if (!bounds || !bounds.south || !bounds.north || !bounds.west || !bounds.east) {
      return { lat: -39.8196, lng: -73.2452 } // Default Chile center
    }

    return {
      lat: (bounds.south + bounds.north) / 2,
      lng: (bounds.west + bounds.east) / 2,
    }
  }

  const buildRegionFolders = (metadata: any[]) => {
    const regionMap = new Map<string, any[]>()

    metadata.forEach((record) => {
      const region = record.region || "Sin Región"
      if (!regionMap.has(region)) {
        regionMap.set(region, [])
      }
      regionMap.get(region)?.push(record)
    })

    console.log("[v0] Grouped files into", regionMap.size, "regions")

    const folderItems: FolderItem[] = []
    let folderId = 1

    for (const [region, files] of regionMap.entries()) {
      let regionLat = 0
      let regionLng = 0
      let validFiles = 0

      files.forEach((file) => {
        const center = calculateCenterFromBounds(file.bounds)
        regionLat += center.lat
        regionLng += center.lng
        validFiles++
      })

      const regionCenter =
        validFiles > 0 ? { lat: regionLat / validFiles, lng: regionLng / validFiles } : { lat: -39.8196, lng: -73.2452 }

      const totalPlacemarks = files.reduce((sum, f) => sum + (f.placemarks_count || 0), 0)

      folderItems.push({
        id: `region-${folderId}`,
        name: region,
        type: "folder",
        location: regionCenter,
        category: region,
        fileCount: files.length,
        children: files.map((file, idx) => {
          const fileCenter = calculateCenterFromBounds(file.bounds)
          return {
            id: `file-${folderId}-${idx}`,
            name: file.file_name,
            type: "file" as const,
            area: `${file.placemarks_count || 0} puntos`,
            location: fileCenter,
            dbId: file.id,
          }
        }),
        isOpen: false,
      })
      folderId++
    }

    console.log("[v0] Built", folderItems.length, "region folders with", metadata.length, "total files")
    setFolders(folderItems)
  }

  const loadRegionKMZFiles = async (region: string) => {
    console.log("[v0] Loading full KMZ data for region:", region)
    setIsLoadingKMZ(true)
    setSelectedRegion(region)

    try {
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("region", region)
        .order("file_name", { ascending: true })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading KMZ files:", error)
        setKmzFiles([])
      } else {
        console.log("[v0] Loaded", data?.length || 0, "KMZ files with full coordinates for region:", region)

        const uniqueData = data?.filter(
          (record, index, self) => index === self.findIndex((r) => r.file_name === record.file_name),
        )

        console.log("[v0] After deduplication:", uniqueData?.length || 0, "unique KMZ files")

        const transformedKMZ = (uniqueData || []).map((record: any) => {
          const placemarks = (record.coordinates || []).map((coordArray: any, index: number) => {
            // Determine geometry type based on coordinate structure
            let geometryType = "Point"
            let coordinates = coordArray

            // If coordArray is an array of coordinate pairs (more than 3 points), it's likely a polygon
            if (Array.isArray(coordArray) && coordArray.length > 3) {
              // Check if first element is a coordinate pair [lng, lat]
              if (Array.isArray(coordArray[0]) && coordArray[0].length >= 2 && typeof coordArray[0][0] === "number") {
                geometryType = "Polygon"
                // Polygons need coordinates wrapped in an extra array for Leaflet
                coordinates = coordArray
              }
            } else if (Array.isArray(coordArray) && coordArray.length <= 3) {
              // Single point or very small line
              geometryType = "Point"
              coordinates = coordArray
            }

            console.log(
              `[v0] Placemark ${index + 1}: ${record.file_name} - Type: ${geometryType}, Coords: ${coordArray.length}`,
            )

            return {
              name: `${record.file_name} - ${geometryType === "Polygon" ? "Polígono" : "Punto"} ${index + 1}`,
              type: geometryType,
              coordinates: coordinates,
              description: record.description || "",
              properties: {
                rol: record.rol_numbers?.[index] || "",
                category: record.category || "general",
              },
            }
          })

          return {
            fileName: record.file_name,
            placemarks: placemarks,
            bounds: record.bounds,
            metadata: {
              id: record.id,
              category: record.category,
              rolNumbers: record.rol_numbers || [],
              placemarks_count: record.placemarks_count,
            },
          }
        })

        console.log("[v0] Transformed", transformedKMZ.length, "KMZ files for display")
        setKmzFiles(transformedKMZ)
      }
    } catch (err) {
      console.error("[v0] Error fetching KMZ files:", err)
      setKmzFiles([])
    } finally {
      setIsLoadingKMZ(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((folder) => (folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder)),
    )
  }

  const handleItemClick = async (item: FolderItem) => {
    console.log("[v0] Item clicked:", item.name, "type:", item.type)
    setSelectedItem(item)

    if (item.location) {
      console.log("[v0] Centering map on coordinates:", item.location)
      setMapCenter(item.location)
    }

    if (item.type === "folder") {
      toggleFolder(item.id)

      if (item.category && item.category !== selectedRegion) {
        await loadRegionKMZFiles(item.category)
      }
    }
  }

  const filteredFolders = folders.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex h-screen bg-background">
      <Card className="w-80 m-4 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">Carpetas CAMPOS</h2>
          <Button
            onClick={loadRegionMetadata}
            disabled={isLoadingMetadata}
            className="w-full mb-3 bg-transparent"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMetadata ? "animate-spin" : ""}`} />
            {isLoadingMetadata ? "Cargando..." : "Actualizar Regiones"}
          </Button>
          {folders.length > 0 && (
            <Badge variant="secondary" className="mb-3">
              {folders.length} regiones disponibles
            </Badge>
          )}
          {selectedRegion && kmzFiles.length > 0 && (
            <Badge variant="default" className="mb-3 ml-2">
              {kmzFiles.length} archivos cargados
            </Badge>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar regiones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredFolders.length === 0 && !isLoadingMetadata && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay regiones disponibles. Haz clic en "Actualizar Regiones" para cargar.
              </p>
            )}
            {filteredFolders.map((folder) => (
              <div key={folder.id}>
                <Button
                  variant={selectedItem?.id === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleItemClick(folder)}
                  disabled={isLoadingKMZ && folder.category === selectedRegion}
                >
                  {folder.isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                  {folder.isOpen ? <FolderOpen className="h-4 w-4 mr-2" /> : <Folder className="h-4 w-4 mr-2" />}
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {folder.fileCount || 0}
                  </Badge>
                  {folder.location && <MapPin className="h-3 w-3 ml-2 text-muted-foreground" />}
                </Button>

                {folder.isOpen && folder.children && (
                  <div className="ml-6 mt-1 space-y-1">
                    {isLoadingKMZ && folder.category === selectedRegion ? (
                      <div className="text-sm text-muted-foreground p-2 text-center">
                        <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                        Cargando archivos...
                      </div>
                    ) : (
                      folder.children.map((child) => (
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
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <div className="flex-1 m-4 relative">
        {isLoadingKMZ && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Cargando archivos KMZ...</span>
            </div>
          </div>
        )}
        <KMZMapDisplay kmzFiles={kmzFiles} centerCoordinates={mapCenter || undefined} />
      </div>

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
                  {selectedItem.type === "folder" ? "Región" : "Archivo KMZ"}
                </p>
              </div>

              {selectedItem.area && (
                <div>
                  <p className="text-sm font-medium mb-1">Información</p>
                  <Badge variant="secondary">{selectedItem.area}</Badge>
                </div>
              )}

              {selectedItem.location && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    {selectedItem.type === "folder" ? "Centro de Región" : "Ubicación del Archivo"}
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Lat: {selectedItem.location.lat.toFixed(6)}</p>
                    <p>Lng: {selectedItem.location.lng.toFixed(6)}</p>
                  </div>
                </div>
              )}

              {selectedItem.type === "folder" && selectedItem.fileCount && (
                <div>
                  <p className="text-sm font-medium mb-2">Archivos en esta región ({selectedItem.fileCount})</p>
                  {selectedItem.children && (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {selectedItem.children.map((child) => (
                        <div key={child.id} className="text-sm p-2 rounded bg-muted/50 flex items-center gap-2">
                          <File className="h-3 w-3" />
                          <span className="flex-1 truncate">{child.name}</span>
                          {child.area && (
                            <Badge variant="outline" className="text-xs">
                              {child.area}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedRegion && kmzFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Archivos cargados en mapa ({kmzFiles.length})</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {kmzFiles.map((file) => (
                      <div key={file.metadata.id} className="text-sm p-2 rounded bg-muted/50 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="flex-1 truncate">{file.fileName}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.placemarks.length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecciona una región para ver detalles y cargar archivos KMZ</p>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  )
}
