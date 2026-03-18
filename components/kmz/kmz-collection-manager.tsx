"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Database,
  MapPin,
  Search,
  RefreshCw,
  Trash2,
  Tag,
  Layers,
  CheckCircle,
  AlertCircle,
  Upload,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { driveService } from "@/lib/google-drive/drive-service"
import { kmzReader } from "@/lib/kmz/kmz-reader"
import { NeighborhoodAnalysisModal } from "@/components/kmz/neighborhood-analysis-modal"

interface KMZRecord {
  id: string
  file_name: string
  file_path: string
  drive_file_id: string | null
  description: string | null
  metadata: any
  placemarks_count: number
  rol_numbers: string[]
  bounds: any
  tags: string[]
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  file_size?: number
}

export function KMZCollectionManager() {
  const [kmzFiles, setKmzFiles] = useState<KMZRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [settingUpTable, setSettingUpTable] = useState(false)
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [selectedKmzForAnalysis, setSelectedKmzForAnalysis] = useState<KMZRecord | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "placemarks">("date")
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalPlacemarks: 0,
    totalRoles: 0,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [fixingRegions, setFixingRegions] = useState(false)

  useEffect(() => {
    loadKMZCollection()
  }, [])

  const loadKMZCollection = async () => {
    setLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // Fetch ALL active KMZ files without limit to show complete stats
      const { data: results, error } = await supabase
        .from("kmz_collection")
        .select("*", { count: 'exact' })
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.message.includes("does not exist") || error.code === "42P01") {
          console.log("[v0] Table kmz_collection does not exist yet")
          setTableExists(false)
          setKmzFiles([])
          setStats({
            total: 0,
            active: 0,
            totalPlacemarks: 0,
            totalRoles: 0,
          })
          setLoading(false)
          return // Exit early without throwing
        }
        throw error
      }

      setTableExists(true)
      setKmzFiles(results as KMZRecord[])

      const totalPlacemarks = results.reduce((sum: number, kmz: any) => sum + (kmz.placemarks_count || 0), 0)
      const allRoles = new Set(results.flatMap((kmz: any) => kmz.rol_numbers || []))

      console.log(`[v0] Loaded KMZ collection: ${results.length} total files, ${totalPlacemarks} total placemarks`)

      setStats({
        total: results.length,
        active: results.filter((kmz: any) => kmz.is_active).length,
        totalPlacemarks,
        totalRoles: allRoles.size,
      })
    } catch (error) {
      console.error("[v0] Error loading KMZ collection:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupTable = async () => {
    setSettingUpTable(true)
    try {
      const response = await fetch("/api/setup-kmz-table", {
        method: "POST",
      })

      const result = await response.json()

      if (response.ok) {
        alert("✅ Tabla KMZ Collection creada exitosamente!")
        setTableExists(true)
        await loadKMZCollection()
      } else {
        alert(
          `❌ Error: ${result.error || result.note}\n\nPor favor, copia el SQL de scripts/create-kmz-collection-table.sql y ejecútalo manualmente en el editor SQL de Supabase.`,
        )
      }
    } catch (error) {
      console.error("Error setting up table:", error)
      alert("Error al crear la tabla. Por favor, ejecuta el SQL manualmente en Supabase.")
    } finally {
      setSettingUpTable(false)
    }
  }

  const scanGoogleDrive = async () => {
    setScanning(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const rootFolderId = "1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F"
      const allFiles: any[] = []

      const scanFolder = async (folderId: string, path = "") => {
        const contents = await driveService.listFolderContents(folderId)

        for (const item of contents) {
          const currentPath = path ? `${path}/${item.name}` : item.name

          if (item.mimeType === "application/vnd.google-apps.folder") {
            await scanFolder(item.id, currentPath)
          } else if (item.name.toLowerCase().endsWith(".kmz") || item.mimeType === "application/vnd.google-earth.kmz") {
            allFiles.push({
              ...item,
              path: currentPath,
            })
          }
        }
      }

      await scanFolder(rootFolderId)

      console.log(`Found ${allFiles.length} KMZ files in Google Drive`)

      let processed = 0
      for (const file of allFiles) {
        try {
          const { data: existing } = await supabase
            .from("kmz_collection")
            .select("id")
            .eq("drive_file_id", file.id)
            .single()

          if (existing) {
            console.log(`Skipping existing file: ${file.name}`)
            continue
          }

          const fileBlob = await driveService.downloadFile(file.id)
          const fileObj = new File([fileBlob], file.name, { type: "application/vnd.google-earth.kmz" })
          const kmzData = await kmzReader.readKMZFile(fileObj)

          const rolNumbers = kmzReader.extractPropertyRoles(kmzData)

          // Insert KMZ into collection
          const { data: insertedKMZ, error: kmzError } = await supabase
            .from("kmz_collection")
            .insert({
              file_name: file.name,
              file_path: file.path,
              drive_file_id: file.id,
              description: kmzData.metadata?.description || null,
              metadata: kmzData.metadata,
              placemarks_count: kmzData.placemarks.length,
              rol_numbers: rolNumbers,
              bounds: kmzData.bounds,
              tags: [],
              category: detectCategory(file.path),
              is_active: true,
              file_size: fileBlob.size,
            })
            .select()

          if (kmzError) throw kmzError

          const kmzId = insertedKMZ?.[0]?.id
          if (!kmzId) throw new Error("KMZ insertion failed - no ID returned")

          // Index locations using kmzLocationIndexer
          if (kmzData.placemarks && kmzData.placemarks.length > 0) {
            try {
              await kmzLocationIndexer.initialize()
              const indexResult = await kmzLocationIndexer.indexKMZLocations(
                kmzId,
                file.name,
                kmzData.placemarks,
                kmzData.bounds ? detectRegionFromBounds(kmzData.bounds) : undefined,
              )
              console.log(`[v0] Indexed ${indexResult.indexCount} locations for ${file.name}`)
            } catch (indexError) {
              console.error(`[v0] Error indexing locations for ${file.name}:`, indexError)
            }
          }

          processed++
          console.log(`Processed ${processed}/${allFiles.length}: ${file.name}`)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
        }
      }

      await loadKMZCollection()
      alert(`Escaneo completado! ${processed} archivos KMZ agregados a la colección.\n✅ Ubicaciones indexadas automáticamente.`)
    } catch (error) {
      console.error("Error scanning Google Drive:", error)
      alert("Error al escanear Google Drive")
    } finally {
      setScanning(false)
    }
  }

  const detectCategory = (path: string): string => {
    const lowerPath = path.toLowerCase()
    if (lowerPath.includes("campo")) return "campo"
    if (lowerPath.includes("fundo")) return "fundo"
    if (lowerPath.includes("parcela")) return "parcela"
    if (lowerPath.includes("terreno")) return "terreno"
    if (lowerPath.includes("casa")) return "casa"
    return "general"
  }

  const deleteKMZ = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este archivo KMZ de la colección?")) return

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase.from("kmz_collection").update({ is_active: false }).eq("id", id)

      if (error) throw error

      await loadKMZCollection()
    } catch (error) {
      console.error("Error deleting KMZ:", error)
    }
  }

  const indexAllKMZLocations = async () => {
    setIndexing(true)
    try {
      console.log("[v0] Starting mass indexing of KMZ locations...")

      const response = await fetch("/api/admin/kmz/mass-index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      })

      if (response.ok) {
        alert("Indexación iniciada en background. Revisa /admin/kmz para ver el progreso.")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("[v0] Error starting indexation:", error)
      alert("Error al iniciar la indexación")
    } finally {
      setIndexing(false)
    }
  }

  const loadToMap = (kmz: KMZRecord) => {
    window.location.href = "/mapas"
  }

  const openNeighborhoodAnalysis = (kmz: KMZRecord) => {
    setSelectedKmzForAnalysis(kmz)
    setShowAnalysisModal(true)
  }

  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return hashHex
  }

  const handleOfflineKMZUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      let successCount = 0
      let errorCount = 0
      let skippedCount = 0

      for (const file of Array.from(files)) {
        try {
          console.log(`[v0] Processing offline KMZ file: ${file.name}`)

          // Calculate file hash for deduplication
          const fileHash = await calculateFileHash(file)
          console.log(`[v0] File hash: ${fileHash}`)

          // Check if this exact file already exists
          const { data: existing } = await supabase
            .from("kmz_collection")
            .select("id")
            .eq("file_hash", fileHash)
            .single()

          if (existing) {
            console.log(`[v0] Skipping duplicate file: ${file.name} (hash: ${fileHash})`)
            skippedCount++
            continue
          }

          // Parse KMZ file
          const kmzData = await kmzReader.readKMZFile(file)
          const rolNumbers = kmzReader.extractPropertyRoles(kmzData)

          // Save to database
          const { data: insertedKMZ, error } = await supabase
            .from("kmz_collection")
            .insert({
              file_name: file.name,
              file_path: `offline/${file.name}`,
              file_hash: fileHash,
              drive_file_id: null,
              description: kmzData.metadata?.description || null,
              metadata: kmzData.metadata,
              placemarks_count: kmzData.placemarks.length,
              rol_numbers: rolNumbers,
              bounds: kmzData.bounds,
              tags: ["offline"],
              category: "offline",
              is_active: true,
              file_size: file.size,
            })
            .select()

          if (error) {
            console.error(`[v0] Error saving ${file.name}:`, error)
            errorCount++
          } else {
            console.log(`[v0] Successfully saved ${file.name} to database`)
            successCount++

            // Index locations using kmzLocationIndexer
            const kmzId = insertedKMZ?.[0]?.id
            if (kmzId && kmzData.placemarks && kmzData.placemarks.length > 0) {
              try {
                await kmzLocationIndexer.initialize()
                const indexResult = await kmzLocationIndexer.indexKMZLocations(
                  kmzId,
                  file.name,
                  kmzData.placemarks,
                  kmzData.bounds ? detectRegionFromBounds(kmzData.bounds) : undefined,
                )
                console.log(`[v0] Indexed ${indexResult.indexCount} locations for ${file.name}`)
              } catch (indexError) {
                console.error(`[v0] Error indexing locations for ${file.name}:`, indexError)
              }
            }
          }
        } catch (error) {
          console.error(`[v0] Error processing ${file.name}:`, error)
          errorCount++
        }
      }

              // Reload collection
      await loadKMZCollection()

      // Show result
      const messages = []
      if (successCount > 0) messages.push(`✅ ${successCount} archivo(s) KMZ cargado(s) exitosamente`)
      if (skippedCount > 0) messages.push(`⏭️ ${skippedCount} archivo(s) duplicado(s) omitido(s)`)
      if (errorCount > 0) messages.push(`⚠️ ${errorCount} archivo(s) fallaron`)
      messages.push(`�� Ubicaciones indexadas automáticamente`)

      if (messages.length > 0) {
        alert(messages.join("\n"))
      } else {
        alert("❌ No se cargaron archivos. Por favor, verifica los archivos e intenta nuevamente.")
      }
    } catch (error) {
      console.error("[v0] Error uploading KMZ files:", error)
      alert("Error al cargar archivos KMZ")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const filteredKMZ = kmzFiles.filter((kmz) => {
    const matchesSearch =
      kmz.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kmz.file_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kmz.rol_numbers.some((rol) => rol.includes(searchQuery))

    const matchesCategory = selectedCategory === "all" || kmz.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Sort based on selected sort method
  const sortedKMZ = [...filteredKMZ].sort((a, b) => {
    if (sortBy === "placemarks") {
      // Sort by placemarks count (most first)
      return b.placemarks_count - a.placemarks_count
    } else {
      // Sort by date (newest first) - default
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const detectRegionFromBounds = (bounds: any): string => {
    const centerLat = (bounds.north + bounds.south) / 2
    const centerLng = (bounds.east + bounds.west) / 2
    
    // Simple region detection based on coordinates
    // Chile ranges roughly: -17° to -56° latitude, -66° to -75° longitude
    if (centerLat > -27) return "Arica y Parinacota"
    if (centerLat > -26) return "Tarapacá"
    if (centerLat > -25) return "Antofagasta"
    if (centerLat > -20) return "Atacama"
    if (centerLat > -19) return "Coquimbo"
    if (centerLat > -17) return "Valparaíso"
    if (centerLat > -15) return "Metropolitana"
    if (centerLat > -19) return "Libertador Bernardo O'Higgins"
    if (centerLat > -24) return "Maule"
    if (centerLat > -29) return "Ñuble"
    if (centerLat > -31) return "La Araucanía"
    if (centerLat > -38) return "Los Ríos"
    if (centerLat > -41) return "Los Lagos"
    if (centerLat > -44) return "Aysén"
    return "Magallanes"
  }

  const fixRegions = async () => {
    setFixingRegions(true)
    try {
      const response = await fetch("/api/admin/kmz/fix-regions", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to fix regions")
      }

      const data = await response.json()
      console.log("[v0] Regions fixed:", data)
      alert(`Regiones actualizadas: ${data.updated} ubicaciones`)
      loadKMZCollection()
    } catch (error) {
      console.error("[v0] Error fixing regions:", error)
      alert("Error al actualizar regiones")
    } finally {
      setFixingRegions(false)
    }
  }

  const reindexAllKMZ = async () => {
    if (!confirm(`¿Re-indexar todos los ${kmzFiles.length} KMZ? Esto puede tomar algunos minutos.`)) return
    
    setIndexing(true)
    try {
      const response = await fetch("/api/admin/kmz/reindex-all", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to re-index KMZ")
      }

      const data = await response.json()
      console.log("[v0] Re-index complete:", data)
      alert(`Re-indexación completa: ${data.totalLocations} ubicaciones indexadas en ${data.success} archivos`)
      loadKMZCollection()
    } catch (error) {
      console.error("[v0] Error re-indexing:", error)
      alert("Error al re-indexar KMZ")
    } finally {
      setIndexing(false)
    }
  }

  const processAllKMZ = async () => {
    if (!confirm(`¿Procesar todos los ${kmzFiles.length} KMZ? Esto extraerá ubicaciones y creará el índice de búsqueda. Puede tomar varios minutos.`)) return
    
    setIndexing(true)
    try {
      const response = await fetch("/api/admin/kmz/process-all", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to process KMZ")
      }

      const data = await response.json()
      console.log("[v0] Process complete:", data)
      alert(`${data.message}. Errores: ${data.errors.length}`)
      loadKMZCollection()
    } catch (error) {
      console.error("[v0] Error processing KMZ:", error)
      alert("Error al procesar KMZ")
    } finally {
      setIndexing(false)
    }
  }

  const categories = ["all", ...new Set(kmzFiles.map((kmz) => kmz.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <NeighborhoodAnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        kmz={selectedKmzForAnalysis}
      />
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex justify-between items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Database className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Colección de Archivos KMZ</h1>
              </div>
              <p className="text-purple-100 text-lg font-medium">
                Gestiona y visualiza todos los archivos KMZ de Google Drive
              </p>
              <p className="text-purple-200 text-sm">
                💡 Busca "Superposicion" o "Contao" para encontrar archivos específicos
              </p>
            </div>
            <div className="flex gap-3">
              {tableExists === false && (
                <Button
                  onClick={setupTable}
                  disabled={settingUpTable}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {settingUpTable ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creando Tabla...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Crear Tabla KMZ Collection
                    </>
                  )}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".kmz"
                multiple
                onChange={handleOfflineKMZUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || tableExists === false}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar KMZ Offline
                  </>
                )}
              </Button>
              <Button
                onClick={scanGoogleDrive}
                disabled={scanning || tableExists === false}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Escaneando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Escanear Drive
                  </>
                )}
              </Button>
              <Button
                onClick={loadKMZCollection}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button
                onClick={processAllKMZ}
                disabled={indexing}
                variant="secondary"
                className="bg-green-500/20 hover:bg-green-500/30 text-green-700 border-green-300 backdrop-blur-sm"
              >
                {indexing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Procesar Todo
                  </>
                )}
              </Button>
              <Button
                onClick={reindexAllKMZ}
                disabled={indexing}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                {indexing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Re-indexando...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Re-indexar Todo
                  </>
                )}
              </Button>
              <Button
                onClick={fixRegions}
                disabled={fixingRegions}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                {fixingRegions ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Corrigiendo Regiones...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Corregir Regiones
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Setup Message */}
        {tableExists === false && (
          <Card className="border-2 border-orange-200 shadow-xl bg-orange-50">
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-orange-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-orange-900 mb-2">Tabla KMZ Collection no existe</h3>
              <p className="text-orange-700 mb-6 text-lg">
                Necesitas crear la tabla en la base de datos antes de poder usar la colección de KMZ.
              </p>
              <Button
                onClick={setupTable}
                disabled={settingUpTable}
                className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-6"
              >
                {settingUpTable ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Creando Tabla...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5 mr-2" />
                    Crear Tabla Ahora
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-700">{stats.total}</div>
                  <div className="text-sm text-slate-600 font-medium">Archivos KMZ</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{stats.active}</div>
                  <div className="text-sm text-slate-600 font-medium">Activos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">{stats.totalPlacemarks}</div>
                  <div className="text-sm text-slate-600 font-medium">Ubicaciones</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Tag className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-700">{stats.totalRoles}</div>
                  <div className="text-sm text-slate-600 font-medium">Números de Rol</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar campos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                <span className="text-sm font-medium text-slate-600 self-center">Ordenar por:</span>
                <Button
                  variant={sortBy === "date" ? "default" : "outline"}
                  onClick={() => setSortBy("date")}
                  size="sm"
                >
                  Fecha
                </Button>
                <Button
                  variant={sortBy === "placemarks" ? "default" : "outline"}
                  onClick={() => setSortBy("placemarks")}
                  size="sm"
                >
                  Cantidad de Puntos
                </Button>
              </div>
                <div className="flex-1"></div>
                <div className="flex gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                      size="sm"
                    >
                      {category === "all" ? "Todos" : category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KMZ List */}
        {loading ? (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-slate-600 font-medium">Cargando colección...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedKMZ.map((kmz) => (
              <Card
                key={kmz.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-purple-100 text-purple-700 font-semibold">{kmz.category || "general"}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => deleteKMZ(kmz.id)} className="hover:bg-red-50">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800 truncate">{kmz.file_name}</CardTitle>
                  <CardDescription className="text-sm truncate">{kmz.file_path}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-slate-600">Ubicaciones</span>
                      </div>
                      <div className="text-xl font-bold text-blue-700">{kmz.placemarks_count}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-medium text-slate-600">Roles</span>
                      </div>
                      <div className="text-xl font-bold text-orange-700">{kmz.rol_numbers.length}</div>
                    </div>
                  </div>

                  {kmz.file_size && kmz.file_size > 10 * 1024 * 1024 && (
                    <div className="bg-red-50 p-2 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-semibold text-red-700">
                          Archivo grande: {formatFileSize(kmz.file_size)}
                        </span>
                      </div>
                    </div>
                  )}

                  {kmz.rol_numbers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {kmz.rol_numbers.slice(0, 3).map((rol, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {rol}
                        </Badge>
                      ))}
                      {kmz.rol_numbers.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{kmz.rol_numbers.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => loadToMap(kmz)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Cargar en Mapa
                    </Button>
                    <Button
                      onClick={() => openNeighborhoodAnalysis(kmz)}
                      variant="outline"
                      className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Analizar
                    </Button>
                  </div>

                  <div className="text-xs text-slate-500">
                    Agregado: {new Date(kmz.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredKMZ.length === 0 && !loading && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No se encontraron archivos KMZ</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery
                  ? "Intenta con otros términos de búsqueda"
                  : "Escanea Google Drive para agregar archivos KMZ a la colección"}
              </p>
              <Button onClick={scanGoogleDrive} disabled={scanning} className="bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Escanear Google Drive
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
