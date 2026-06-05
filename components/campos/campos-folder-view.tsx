"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo, useCallback, memo, useDeferredValue } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { KMZMapDisplay } from "@/components/kmz/kmz-map-display"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Folder,
  FolderOpen,
  File,
  Search,
  ChevronRight,
  ChevronDown,
  MapPin,
  RefreshCw,
  Menu,
  Upload,
  FileText,
  ExternalLink,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { kmzReader } from "@/lib/kmz/kmz-reader"
import { kmzStorageService } from "@/lib/kmz/kmz-storage-service"
import { regionRescanService, type RescanProgress } from "@/lib/kmz/region-rescan-service"
import { documentKMZLinker, type KMZDocumentLink } from "@/lib/documents/document-kmz-linker"
import { useToast } from "@/hooks/use-toast"
import { CAMPOSAIAgent } from "@/components/campos/campos-ai-agent"
import { AdvancedGeoSearch } from "@/components/features/advanced-geo-search/advanced-geo-search"

interface FolderItem {
  id: string
  name: string
  type: "folder" | "file"
  location?: { lat: number; lng: number }
  area?: string
  owner?: string
  google_docs_link?: string
  kmzFiles?: any[]
  children?: FolderItem[]
  isOpen?: boolean
  category?: string
  fileCount?: number
  dbId?: number
  isDriveFile?: boolean
  driveFileId?: string
}

const getCleanRegionName = (fullName: string): string => {
  if (!fullName) return fullName

  // Remove "Región de " or "Región del "
  return fullName.replace(/^Región de /i, "").replace(/^Región del /i, "")
}

// Search input with internal state to prevent focus loss - only syncs to parent on debounce
const SearchInput = memo(function SearchInput({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string
  onChange: (value: string) => void
  disabled?: boolean 
}) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync from parent only when value changes externally (e.g., reset)
  useEffect(() => {
    if (value !== localValue && value === "") {
      setLocalValue(value)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    
    // Debounce parent update to prevent re-renders while typing
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, 300)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar ubicaciones, archivos KMZ..."
        value={localValue}
        onChange={handleChange}
        className="pl-9"
        disabled={disabled}
      />
    </div>
  )
})

export function CAMPOSFolderView() {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FolderItem | null>(null)
  const [editingOwner, setEditingOwner] = useState<string>("")
  const [editingGoogleDocsLink, setEditingGoogleDocsLink] = useState<string>("")
  const [isSavingOwner, setIsSavingOwner] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [kmzFiles, setKmzFiles] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [isLoadingKMZ, setIsLoadingKMZ] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [regionLoadingProgress, setRegionLoadingProgress] = useState<Record<string, number>>({})
  const [isFolderSheetOpen, setIsFolderSheetOpen] = useState(false)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAIAgent, setShowAIAgent] = useState(false)
  const [totalFileCount, setTotalFileCount] = useState(0)

  const supabase = createBrowserClient()
  const { toast } = useToast()
  const [isRescanning, setIsRescanning] = useState(false)
  const [rescanProgress, setRescanProgress] = useState<RescanProgress | null>(null)

  const [selectedItemDocuments, setSelectedItemDocuments] = useState<KMZDocumentLink[]>([])
  const [documentCount, setDocumentCount] = useState<number>(0)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [isLoadingFromURL, setIsLoadingFromURL] = useState(false)
  const [selectedKmzId, setSelectedKmzId] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const kmzIdFromURL = searchParams?.get("kmz")

  const calculateCenterFromBounds = (bounds: any): { lat: number; lng: number } => {
    if (!bounds || !bounds.south || !bounds.north || !bounds.west || !bounds.east) {
      return { lat: -39.8196, lng: -73.2452 }
    }
    return {
      lat: (bounds.south + bounds.north) / 2,
      lng: (bounds.west + bounds.east) / 2,
    }
  }

  useEffect(() => {
    loadRegionMetadata()
  }, [])

  // Update editingOwner when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setEditingOwner(selectedItem.owner || "")
    }
  }, [selectedItem])

  // Load KMZ file from URL parameter if provided
  useEffect(() => {
    if (kmzIdFromURL && kmzIdFromURL.trim()) {
      setIsLoadingFromURL(true)
    }
  }, [kmzIdFromURL])

  // Once metadata is loaded and we have a kmzIdFromURL, load the KMZ
  useEffect(() => {
    if (isLoadingFromURL && !isLoadingMetadata && kmzIdFromURL && handleLoadKmzFromId) {
      handleLoadKmzFromId(kmzIdFromURL)
    }
  }, [isLoadingFromURL, isLoadingMetadata, kmzIdFromURL])

  const loadRegionMetadata = async () => {
    setIsLoadingMetadata(true)

    try {
      const allData: any[] = []
      const pageSize = 1000
      let page = 0
      let hasMore = true

      // Fetch all metadata with pagination
      while (hasMore) {
        const start = page * pageSize
        const end = start + pageSize - 1
        
        
        const { data, error, count } = await supabase
          .from("kmz_collection")
          .select("id, file_name, region, placemarks_count, bounds, tags, file_path, owner, google_docs_link", { count: 'exact' })
          .eq("is_active", true)
          .order("region", { ascending: true })
          .range(start, end)

        if (error) {
          break
        }

        if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData.push(...data)
          page++
        }
      }

      if (allData.length > 0) {
        const uniqueRegions = new Set(allData.map(d => d.region).filter(r => r)).size
        setTotalFileCount(allData.length)
        buildRegionFolders(allData)
      } else {
        setFolders([])
        setTotalFileCount(0)
      }
    } catch (err) {
      setFolders([])
      setTotalFileCount(0)
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  const handleRefresh = async () => {
    
    // Clear current selection
    setSelectedItem(null)
    setSelectedRegion(null)
    setKmzFiles([])
    setMapCenter(null)
    setSelectedItemDocuments([])
    setDocumentCount(0)
    
    // Reload metadata
    await loadRegionMetadata()
    
    toast({
      title: "Vista actualizada",
      description: "Se han recargado todas las regiones. Selecciona una para continuar.",
    })
  }

  const handleLoadKmzFromId = async (kmzId: string) => {
    setIsLoadingKMZ(true)

    try {
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("id", kmzId)
        .single()

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el archivo KMZ",
          variant: "destructive",
        })
        setKmzFiles([])
        setIsLoadingFromURL(false)
        return
      }

      if (data) {

        // Set the region
        setSelectedRegion(data.region)

        // Calculate map center
        const center = calculateCenterFromBounds(data.bounds)
        setMapCenter(center)

        // Transform the KMZ file
        const placemarks = (data.coordinates || []).map((coordArray: any, index: number) => {
          let geometryType = "Point"
          let coordinates = coordArray

          if (Array.isArray(coordArray) && coordArray.length > 3) {
            if (Array.isArray(coordArray[0]) && coordArray[0].length >= 2 && typeof coordArray[0][0] === "number") {
              geometryType = "Polygon"
              coordinates = coordArray
            }
          }

          return {
            name: `${data.file_name} - ${geometryType === "Polygon" ? "Polígono" : "Punto"} ${index + 1}`,
            type: geometryType,
            coordinates: coordinates,
            description: data.description || "",
            properties: {
              rol: data.rol_numbers?.[index] || "",
              category: data.category || "general",
            },
          }
        })

        const transformedKMZ = {
          fileName: data.file_name,
          placemarks: placemarks,
          bounds: data.bounds,
          metadata: {
            id: data.id,
            category: data.category,
            rolNumbers: data.rol_numbers || [],
            placemarks_count: data.placemarks_count,
          },
        }

        setKmzFiles([transformedKMZ])

        // Load documents for this KMZ
        try {
          const docs = await documentKMZLinker.getDocumentsForKMZ(data.id, data.file_name)
          const count = await documentKMZLinker.getDocumentCountForKMZ(data.id, data.file_name)
          setSelectedItemDocuments(docs)
          setDocumentCount(count)
        } catch (docError) {
          setSelectedItemDocuments([])
          setDocumentCount(0)
        }

        // Create and select a virtual item
        const virtualItem: FolderItem = {
          id: `file-${data.id}`,
          name: data.file_name,
          type: "file",
          dbId: data.id,
          location: center,
          area: `${data.placemarks_count || 0} puntos`,
        }
        setSelectedItem(virtualItem)
        setIsDetailsSheetOpen(false)
        setIsLoadingFromURL(false)

        toast({
          title: "KMZ Cargado",
          description: `Se cargó ${data.file_name} desde la búsqueda`,
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al cargar el archivo KMZ",
        variant: "destructive",
      })
      setKmzFiles([])
      setIsLoadingFromURL(false)
    } finally {
      setIsLoadingKMZ(false)
    }
  }

  // Handle toggling region selection for multi-select
  const handleRegionToggle = (regionName: string) => {
    const newSelected = new Set(selectedRegions)
    if (newSelected.has(regionName)) {
      newSelected.delete(regionName)
    } else {
      newSelected.add(regionName)
    }
    setSelectedRegions(newSelected)
    
    // Clear old single region selection
    setSelectedRegion(null)
    setKmzFiles([])
  }

  // Load KMZ files progressively from multiple selected regions
  const loadMultipleRegionsKMZ = useCallback(async () => {
    if (selectedRegions.size === 0) {
      setKmzFiles([])
      return
    }

    setIsLoadingKMZ(true)
    const allKmzFiles: any[] = []
    const loadingProgress: Record<string, number> = {}

    try {
      // Create array of regions to load
      const regionsToLoad = Array.from(selectedRegions)
      
      // Load KMZ files for each selected region progressively
      for (const regionName of regionsToLoad) {
        loadingProgress[regionName] = 0
        setRegionLoadingProgress({...loadingProgress})

        const { data, error } = await supabase
          .from("kmz_collection")
          .select("*")
          .eq("is_active", true)
          .eq("region", regionName)
          .limit(1000)

        if (!error && data) {
          // Process each KMZ file in the region
          for (let i = 0; i < data.length; i++) {
            const kmzData = data[i]
            
            try {
              // Read KMZ file content
              const kmzContent = await kmzStorageService.readKMZ(kmzData.file_path)
              const placemarks = await kmzReader.parseKMZContent(kmzContent)

              const transformedKMZ = {
                fileName: kmzData.file_name,
                placemarks: placemarks,
                bounds: kmzData.bounds,
                metadata: {
                  id: kmzData.id,
                  category: kmzData.category,
                  rolNumbers: kmzData.rol_numbers || [],
                  placemarks_count: kmzData.placemarks_count,
                  region: regionName,
                },
              }

              allKmzFiles.push(transformedKMZ)
              
              // Update progress for this region
              loadingProgress[regionName] = Math.round(((i + 1) / data.length) * 100)
              setRegionLoadingProgress({...loadingProgress})
            } catch (fileError) {
              console.error(`Error loading KMZ file ${kmzData.file_name}:`, fileError)
            }
          }
        }

        // Mark region as complete
        loadingProgress[regionName] = 100
        setRegionLoadingProgress({...loadingProgress})
      }

      setKmzFiles(allKmzFiles)

      if (allKmzFiles.length > 0) {
        toast({
          title: "Regiones Cargadas",
          description: `Se cargaron ${allKmzFiles.length} archivos de ${selectedRegions.size} región(es)`,
        })
      } else {
        toast({
          title: "Sin resultados",
          description: "No se encontraron archivos KMZ en las regiones seleccionadas",
          variant: "default",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al cargar los archivos KMZ",
        variant: "destructive",
      })
      setKmzFiles([])
    } finally {
      setIsLoadingKMZ(false)
      setRegionLoadingProgress({})
    }
  }, [selectedRegions, toast])

  // Trigger loading when regions are selected
  useEffect(() => {
    if (selectedRegions.size > 0) {
      loadMultipleRegionsKMZ()
    } else {
      setKmzFiles([])
    }
  }, [selectedRegions, loadMultipleRegionsKMZ])

  const buildRegionFolders = (metadata: any[]) => {
    const regionMap = new Map<string, any[]>()

    metadata.forEach((record) => {
      const region = record.region || "Sin Región"
      if (!regionMap.has(region)) {
        regionMap.set(region, [])
      }
      regionMap.get(region)?.push(record)
    })

    const regionDetails: string[] = []
    regionMap.forEach((files, region) => {
      regionDetails.push(`${region}: ${files.length} files`)
    })

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
            owner: file.owner,
            google_docs_link: file.google_docs_link,
          }
        }),
        isOpen: false,
      })
      folderId++
    }

    folderItems.sort((a, b) => (b.fileCount || 0) - (a.fileCount || 0))

    setFolders(folderItems)
  }

  const loadRegionKMZFiles = async (region: string) => {
    setIsLoadingKMZ(true)
    setSelectedRegion(region)

    try {
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("region", region)
        .order("file_name", { ascending: true })

      if (error) {
        setKmzFiles([])
      } else {
        const uniqueData = data?.filter(
          (record, index, self) => index === self.findIndex((r) => r.file_name === record.file_name),
        )

        const transformedKMZ = (uniqueData || []).map((record: any) => ({
          fileName: record.file_name,
          dbId: record.id, // Add dbId at top level for filtering in KMZMapDisplay
          id: record.id, // Also add id for direct access
          placemarks: (record.coordinates || []).map((coordArray: any, index: number) => ({
            name: `${record.file_name} - ${Array.isArray(coordArray) && coordArray.length > 3 ? "Polígono" : "Punto"} ${index + 1}`,
            type: Array.isArray(coordArray) && coordArray.length > 3 ? "Polygon" : "Point",
            coordinates: coordArray,
            description: record.description || "",
            properties: {
              rol: record.rol_numbers?.[index] || "",
              category: record.category || "general",
            },
          })),
          bounds: record.bounds,
          metadata: {
            id: record.id,
            category: record.category,
            rolNumbers: record.rol_numbers || [],
            placemarks_count: record.placemarks_count,
          },
        }))

        setKmzFiles(transformedKMZ)
        
        // Now rebuild folders with children to show files
        setFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.name === region
              ? {
                  ...folder,
                  children: transformedKMZ.map((kmz, idx) => ({
                    id: `file-${folder.id}-${idx}`,
                    name: kmz.fileName,
                    type: "file" as const,
                    area: `${kmz.metadata.placemarks_count || 0} puntos`,
                    location: kmz.bounds ? calculateCenterFromBounds(kmz.bounds) : undefined,
                    dbId: kmz.metadata.id,
                    owner: undefined,
                    google_docs_link: undefined,
                  })),
                }
              : folder,
          ),
        )
      }
    } catch (err) {
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
    setSelectedItem(item)
    setIsDetailsSheetOpen(true)

    // Si es archivo, cargar owner y google_docs_link
    if (item.type === "file") {
      setEditingOwner(item.owner || "")
      setEditingGoogleDocsLink(item.google_docs_link || "")
    }

    // If this is a FOLDER/REGION, load all KMZ files for that region AND toggle folder open/closed
    if (item.type === "folder") {
      // Clear selectedKmzId to show ALL capas when viewing a region
      setSelectedKmzId(null)
      setFolders((prevFolders) =>
        prevFolders.map((folder) => {
          if (folder.id === item.id) {
            const isNowOpen = !folder.isOpen
            // ALWAYS load region KMZ files when opening a folder to show ALL layers on the map
            if (isNowOpen) {
              loadRegionKMZFiles(folder.name)
            }
            return { ...folder, isOpen: isNowOpen }
          }
          return folder
        }),
      )
      return
    }

    // Otherwise, it's a file - load ONLY this file on the map
    if (item.location) {
      setMapCenter(item.location)
    }

    // Set selectedKmzId to filter the map display
    if (item.type === "file") {
      setSelectedKmzId(item.dbId?.toString() || item.name || null)
    }

    if (item.type === "file" && item.dbId) {
      setLoadingDocuments(true)
      try {
        const docs = await documentKMZLinker.getDocumentsForKMZ(item.dbId.toString(), item.name)
        const count = await documentKMZLinker.getDocumentCountForKMZ(item.dbId.toString(), item.name)
        setSelectedItemDocuments(docs)
        setDocumentCount(count)

        // Load ONLY this specific KMZ file on the map
        const { data, error } = await supabase
          .from("kmz_collection")
          .select("*")
          .eq("is_active", true)
          .eq("id", item.dbId)
          .single()

        if (!error && data) {
          const placemarks = (data.coordinates || []).map((coordArray: any, index: number) => {
            let geometryType = "Point"
            let coordinates = coordArray

            if (Array.isArray(coordArray) && coordArray.length > 3) {
              if (Array.isArray(coordArray[0]) && coordArray[0].length >= 2 && typeof coordArray[0][0] === "number") {
                geometryType = "Polygon"
                coordinates = coordArray
              }
            }

            return {
              name: `${data.file_name} - ${geometryType === "Polygon" ? "Polígono" : "Punto"} ${index + 1}`,
              type: geometryType,
              coordinates: coordinates,
              description: data.description || "",
              properties: {
                rol: data.rol_numbers?.[index] || "",
                category: data.category || "general",
              },
            }
          })

          const transformedKMZ = {
            fileName: data.file_name,
            dbId: data.id, // Add dbId at top level for filtering
            id: data.id, // Also add id
            placemarks: placemarks,
            bounds: data.bounds,
            metadata: {
              id: data.id,
              category: data.category,
              rolNumbers: data.rol_numbers || [],
              placemarks_count: data.placemarks_count,
            },
          }

          setKmzFiles([transformedKMZ]) // Show ONLY this file on the map
        }
      } catch (error) {
        setSelectedItemDocuments([])
        setDocumentCount(0)
      } finally {
        setLoadingDocuments(false)
      }
    } else {
      setSelectedItemDocuments([])
      setDocumentCount(0)
    }
  }

  const handleOfflineKMZUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      let successCount = 0
      let errorCount = 0

      const {
        data: { user },
      } = await supabase.auth.getUser()

      for (const file of Array.from(files)) {
        try {

          // Parse KMZ file
          const kmzData = await kmzReader.readKMZFile(file)
          const rolNumbers = kmzReader.extractPropertyRoles(kmzData)

          // This automatically detects and sets the region using detectRegionFromBounds()
          const saveResult = await kmzStorageService.saveKMZ({
            file_name: file.name,
            file_path: `offline/${file.name}`,
            description: kmzData.metadata?.description,
            metadata: kmzData.metadata,
            placemarks_count: kmzData.placemarks.length,
            rol_numbers: rolNumbers,
            bounds: kmzData.bounds,
            coordinates: kmzData.placemarks.map((p: any) => p.coordinates),
            tags: ["offline"],
            category: "offline",
            created_by: user?.id,
            file_size: file.size,
          })

          if (!saveResult.success) {
            errorCount++
          } else {
            successCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      // Reload metadata after upload
      await loadRegionMetadata()

      // Show result
      if (successCount > 0) {
        alert(
          `✅ ${successCount} archivo(s) KMZ cargado(s) exitosamente!${errorCount > 0 ? `\n⚠️ ${errorCount} archivo(s) fallaron.` : ""}`,
        )
      } else {
        alert(`❌ Error al cargar archivos KMZ. Por favor, verifica los archivos e intenta nuevamente.`)
      }
    } catch (error) {
      alert("Error al cargar archivos KMZ")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSaveOwnerAndDocsLink = async () => {
    if (!selectedItem || selectedItem.type !== "file" || !selectedItem.dbId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un archivo KMZ válido",
        variant: "destructive",
      })
      return
    }

    setIsSavingOwner(true)

    try {
      const { error } = await supabase
        .from("kmz_collection")
        .update({
          owner: editingOwner || null,
          google_docs_link: editingGoogleDocsLink || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedItem.dbId)

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron guardar los cambios",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Guardado",
          description: "Propietario y enlace de documentos actualizados",
        })
        // Actualizar el item seleccionado
        setSelectedItem((prev) =>
          prev
            ? {
                ...prev,
                owner: editingOwner,
                google_docs_link: editingGoogleDocsLink,
              }
            : null,
        )
      }
    } finally {
      setIsSavingOwner(false)
    }
  }

  const handleRescanRegions = async () => {
    if (isRescanning) return

    const sinRegionFolder = folders.find((f) => f.name === "Sin Región")
    const fileCount = sinRegionFolder?.fileCount || 0

    if (fileCount === 0) {
      toast({
        title: "No hay archivos para reasignar",
        description: "Todos los archivos ya tienen una región asignada.",
      })
      return
    }

    const confirmed = confirm(
      `¿Deseas reanalizar ${fileCount} archivos KMZ en 'Sin Región' y asignarlos a sus regiones correctas?\n\n` +
        "Esto puede tomar varios minutos dependiendo de la cantidad de archivos.",
    )

    if (!confirmed) return

    setIsRescanning(true)
    setRescanProgress({ total: 0, processed: 0, updated: 0, failed: 0, currentFile: "" })

    try {
      const result = await regionRescanService.rescanAndUpdateRegions((progress) => {
        setRescanProgress(progress)
      })

      if (result.success) {
        toast({
          title: "Reasignación completada",
          description: `Se reasignaron ${result.totalUpdated} archivos a sus regiones correctas.`,
        })

        // Refresh the folder structure
        await loadRegionMetadata()
      } else {
        toast({
          title: "Error en reasignación",
          description: "Ocurrió un error al reasignar las regiones. Ver consola para detalles.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la reasignación de regiones.",
        variant: "destructive",
      })
    } finally {
      setIsRescanning(false)
      setRescanProgress(null)
    }
  }

  // Defer search query to prevent input focus loss - keeps search responsive while deferring filtering
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const filteredFolders = useMemo(() => {
    return folders.map((folder) => {
      const searchLower = deferredSearchQuery.toLowerCase()
      
      // Check if region name matches search
      const regionMatches = folder.name.toLowerCase().includes(searchLower)
      
      // Filter children (KMZ files) based on search
      const filteredChildren = folder.children?.filter((child) => {
        const childNameMatches = child.name.toLowerCase().includes(searchLower)
        const areaMatches = child.area?.toLowerCase().includes(searchLower) || false
        return childNameMatches || areaMatches
      }) || []
      
      // If search query is empty, show all; otherwise only show if region or children match
      if (!deferredSearchQuery.trim()) {
        return folder
      }
      
      if (regionMatches || filteredChildren.length > 0) {
        return {
          ...folder,
          children: regionMatches ? folder.children : filteredChildren, // If region matches, show all children; otherwise show only matching children
        }
      }
      
      return null
    }).filter(Boolean) as FolderItem[]
  }, [folders, deferredSearchQuery])

  // Use exact count from database instead of summing folder counts
  const totalFiles = totalFileCount > 0 ? totalFileCount : folders.reduce((sum, folder) => sum + (folder.fileCount || 0), 0)

  const FolderList = () => (
    <>
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Carpetas CAMPOS</h2>
          <Button onClick={handleRefresh} disabled={isLoadingMetadata || isRescanning} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 ${isLoadingMetadata ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="default" className="text-sm font-semibold">
            {totalFiles} archivos
          </Badge>
          {folders.length > 0 && <Badge variant="secondary">{folders.length} regiones</Badge>}
          {selectedRegion && kmzFiles.length > 0 && <Badge variant="outline">{kmzFiles.length} en mapa</Badge>}
          {selectedRegions.size > 0 && <Badge variant="secondary">{selectedRegions.size} seleccionadas</Badge>}
          {kmzFiles.length > 0 && selectedRegions.size > 0 && <Badge variant="outline">{kmzFiles.length} en mapa</Badge>}
        </div>

        {/* Selected regions display */}
        {selectedRegions.size > 0 && (
          <div className="flex gap-2 flex-wrap p-3 bg-teal-50 border border-teal-200 rounded-lg">
            {Array.from(selectedRegions).map((region) => (
              <div key={region} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-teal-200">
                <span className="text-sm">{getCleanRegionName(region)}</span>
                {regionLoadingProgress[region] !== undefined && regionLoadingProgress[region] < 100 && (
                  <span className="text-xs text-teal-600 font-medium">{regionLoadingProgress[region]}%</span>
                )}
                <button
                  onClick={() => handleRegionToggle(region)}
                  className="ml-2 text-teal-600 hover:text-teal-700 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {(folders.find((f) => f.name === "Sin Región")?.fileCount || 0) > 0 && (
          <div className="p-3 bg-sage-50 border border-sage-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-sage-900">
                  {folders.find((f) => f.name === "Sin Región")?.fileCount || 0} archivos sin región
                </p>
                <p className="text-xs text-sage-700 mt-1">Pueden reasignarse automáticamente según coordenadas</p>
              </div>
              <Button
                onClick={handleRescanRegions}
                disabled={isRescanning}
                size="sm"
                className="bg-sage hover:bg-sage-dark text-white"
              >
                {isRescanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reasignando...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Reasignar
                  </>
                )}
              </Button>
            </div>

            {rescanProgress && rescanProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-sage-700">
                  <span>
                    {rescanProgress.processed} / {rescanProgress.total}
                  </span>
                  <span>
                    ✓ {rescanProgress.updated} | ✗ {rescanProgress.failed}
                  </span>
                </div>
                <div className="w-full bg-sage-200 rounded-full h-2">
                  <div
                    className="bg-sage h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(rescanProgress.processed / rescanProgress.total) * 100}%`,
                    }}
                  />
                </div>
                {rescanProgress.currentFile && (
                  <p className="text-xs text-sage-600 truncate">{rescanProgress.currentFile}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".kmz,.kml"
            multiple
            onChange={handleOfflineKMZUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isRescanning}
            variant="outline"
            className="w-full justify-start gap-2 border-blue-200 hover:bg-blue-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Subiendo archivos...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Cargar KMZ/KML Offline
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoadingFromURL ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Cargando archivo KMZ...</p>
              <p className="text-xs text-muted-foreground">Por favor espera mientras se carga el mapa</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredFolders.length === 0 && !isLoadingMetadata && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay regiones disponibles. Haz clic en actualizar para cargar.
              </p>
            )}
          {filteredFolders.map((folder) => {
            const isRegionSelected = selectedRegions.has(folder.name)
            const regionProgress = regionLoadingProgress[folder.name]
            
            return (
            <div key={folder.id}>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50">
                <Checkbox
                  checked={isRegionSelected}
                  onCheckedChange={() => handleRegionToggle(folder.name)}
                  className="h-4 w-4"
                  disabled={isLoadingMetadata}
                />
                <Button
                  variant={selectedItem?.id === folder.id && !isRegionSelected ? "secondary" : "ghost"}
                  className="flex-1 justify-start"
                  onClick={() => handleItemClick(folder)}
                  disabled={isLoadingKMZ && folder.category === selectedRegion}
                >
                  {folder.isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                  {folder.isOpen ? <FolderOpen className="h-4 w-4 mr-2" /> : <Folder className="h-4 w-4 mr-2" />}
                  <span className="flex-1 text-left truncate">{getCleanRegionName(folder.name)}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {folder.fileCount || 0}
                  </Badge>
                  {regionProgress !== undefined && regionProgress < 100 && (
                    <span className="text-xs text-teal-600 ml-2">{regionProgress}%</span>
                  )}
                  {folder.location && <MapPin className="h-3 w-3 ml-2 text-muted-foreground" />}
                </Button>
              </div>

              {folder.isOpen && folder.children && (
                <div className="ml-8 mt-1 space-y-1">
                  {isLoadingKMZ && (isRegionSelected || folder.category === selectedRegion) ? (
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
            )
          })}
            </div>
        )}
      </div>
    </>
  )

  const DetailsPanel = () => (
    <>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Detalles</h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
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

            {selectedItem.type === "file" && (
              <div className="pt-2 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Propietario / Cliente</label>
                  <input
                    type="text"
                    value={editingOwner}
                    onChange={(e) => setEditingOwner(e.target.value)}
                    placeholder="Ingresa nombre del propietario o cliente"
                    className="w-full px-2 py-1.5 border rounded-md text-sm bg-background text-foreground border-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Nombre del dueño del predio o cliente asociado</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Enlace Google Docs</label>
                  <input
                    type="text"
                    value={editingGoogleDocsLink}
                    onChange={(e) => setEditingGoogleDocsLink(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full px-2 py-1.5 border rounded-md text-sm bg-background text-foreground border-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enlace a la documentacion en Google Docs</p>
                  {editingGoogleDocsLink && (
                    <a
                      href={editingGoogleDocsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abrir documento
                    </a>
                  )}
                </div>

                <Button
                  onClick={handleSaveOwnerAndDocsLink}
                  disabled={isSavingOwner}
                  className="w-full"
                >
                  {isSavingOwner ? "Guardando..." : "Guardar Cambios"}
                </Button>
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

            {selectedItem.type === "file" && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos Asociados
                  </h4>
                  {documentCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {documentCount}
                    </Badge>
                  )}
                </div>

                {loadingDocuments && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage"></div>
                  </div>
                )}

                {!loadingDocuments && documentCount > 0 && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        const folderPath = documentKMZLinker.getDocumentFolderPath(selectedItem.name)
                        window.location.href = folderPath
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Carpeta de Documentos ({documentCount})
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      <p className="mb-1">Documentos recientes:</p>
                      <ScrollArea className="h-24">
                        <div className="space-y-1">
                          {selectedItemDocuments.slice(0, 5).map((doc) => (
                            <div
                              key={doc.documentId}
                              className="flex items-start gap-2 p-1.5 rounded hover:bg-accent/50"
                            >
                              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">{doc.documentTitle}</p>
                                <p className="text-[10px] text-muted-foreground">{doc.documentType}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {!loadingDocuments && documentCount === 0 && (
                  <div className="text-xs text-muted-foreground py-2 bg-muted/30 rounded p-3">
                    <p>No hay documentos asociados a este campo.</p>
                    <p className="mt-1">Puedes agregar documentos desde la sección de Documentación.</p>
                  </div>
                )}
              </div>
            )}

            {selectedItem.type === "folder" && selectedItem.fileCount && (
              <div>
                <p className="text-sm font-medium mb-2">Archivos en esta región ({selectedItem.fileCount})</p>
                {selectedItem.children && (
                  <ScrollArea className="h-[240px] rounded-md border">
                    <div className="space-y-1 p-2">
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
                  </ScrollArea>
                )}
              </div>
            )}

            {selectedRegion && kmzFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Archivos cargados en mapa ({kmzFiles.length})</p>
                <ScrollArea className="h-[160px] rounded-md border">
                  <div className="space-y-1 p-2">
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
                </ScrollArea>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Selecciona una región para ver detalles y cargar archivos KMZ</p>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div
      className={`flex h-full w-full bg-slate-50 ${
        isMapFullscreen ? "md:flex" : ""
      }`}
    >
      {/* Left sidebar - collapsible on desktop, hidden on mobile when fullscreen */}
      <div
        className={`hidden md:flex flex-col bg-card overflow-hidden transition-all duration-300 ${
          isMapFullscreen ? "md:hidden" : ""
        } ${isLeftPanelOpen ? "w-80 border-r" : "w-0"}`}
      >
        {/* Search input rendered outside FolderList to prevent focus loss */}
        <div className="p-4 border-b flex-shrink-0">
          <SearchInput 
            value={searchQuery} 
            onChange={setSearchQuery} 
            disabled={isLoadingFromURL}
          />
        </div>
        <FolderList />
      </div>

      {/* Left panel toggle button */}
      <div
        className={`hidden md:flex flex-col items-center pt-2 bg-card border-r ${
          isMapFullscreen ? "md:hidden" : ""
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          title={isLeftPanelOpen ? "Colapsar panel izquierdo" : "Expandir panel izquierdo"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${isLeftPanelOpen ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Main content area */}
      <div className={`${isMapFullscreen ? "fixed inset-0 md:relative z-50" : "flex-1"} flex flex-col overflow-hidden`}>
        <div
          className={`${isMapFullscreen ? "md:flex" : "flex"} items-center justify-between px-4 py-2 border-b bg-card flex-shrink-0`}
        >
          <h1 className="text-2xl font-bold text-foreground">CAMPOS</h1>
          {isMapFullscreen && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMapFullscreen(false)}
              className="md:hidden"
              title="Salir de pantalla completa"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <>
          {/* Map Display */}
          <div className="flex-1 overflow-hidden relative w-full">
            {kmzFiles.length > 0 && mapCenter ? (
              <KMZMapDisplay 
                kmzFiles={kmzFiles} 
                centerCoordinates={mapCenter} 
                height="100%" 
                enableGeocoding={true}
                selectedKmzId={selectedKmzId}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Selecciona una región para ver el mapa</p>
                </div>
              </div>
            )}

            <div className="fixed bottom-6 right-6 z-40">
              <Button
                onClick={() => setShowAIAgent(!showAIAgent)}
                className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
                  showAIAgent
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                }`}
                size="icon"
              >
                {showAIAgent ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
              </Button>
            </div>

            {showAIAgent && (
              <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] max-w-[calc(100vw-3rem)]">
                <Card className="h-full flex flex-col shadow-2xl border-0 bg-card">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Asistente IA CAMPOS
                      <Badge variant="secondary" className="ml-auto bg-white/20 text-white text-xs">
                        En línea
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <CAMPOSAIAgent />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Bottom Sheets for Mobile */}
          <div className="md:hidden absolute top-4 left-4 z-[999] flex gap-2">
            <Sheet open={isFolderSheetOpen} onOpenChange={setIsFolderSheetOpen}>
              <SheetTrigger asChild>
                <Button size="icon" className="shadow-lg bg-white hover:bg-gray-50">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 flex flex-col h-full">
                {/* Search input rendered outside FolderList for mobile */}
                <div className="p-4 border-b flex-shrink-0">
                  <SearchInput 
                    value={searchQuery} 
                    onChange={setSearchQuery} 
                    disabled={isLoadingFromURL}
                  />
                </div>
                <FolderList />
              </SheetContent>
            </Sheet>
            <Button
              size="icon"
              className="shadow-lg bg-white hover:bg-gray-50 md:hidden"
              onClick={() => setIsMapFullscreen(!isMapFullscreen)}
              title={isMapFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isMapFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>
        </>
      </div>

      {/* Right Panel - Details (Desktop) - Collapsible */}
      <div
        className={`hidden md:flex flex-col items-center pt-2 bg-card border-l ${
          isMapFullscreen ? "md:hidden" : ""
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          title={isRightPanelOpen ? "Colapsar panel derecho" : "Expandir panel derecho"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${!isRightPanelOpen ? "rotate-180" : ""}`} />
        </Button>
      </div>

      <div
        className={`hidden md:flex flex-col bg-card overflow-hidden transition-all duration-300 ${
          isMapFullscreen ? "md:hidden" : ""
        } ${isRightPanelOpen ? "w-80 border-l" : "w-0"}`}
      >
        <DetailsPanel />
      </div>
    </div>
  )
}
