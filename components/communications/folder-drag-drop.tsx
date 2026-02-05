"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, Trash2, Settings } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { FolderPlaceholdersEditor } from "./folder-placeholders-editor"

interface DragDropFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadedAt?: string
}

interface FolderDropZone {
  id: string
  name: string
  label: string
  files: DragDropFile[]
}

interface FolderDragDropProps {
  folderName: string
  folderId: string
  isAdmin?: boolean
  onFilesUpdated?: (zone: string, files: DragDropFile[]) => void
}

const DEFAULT_ZONES = [
  { id: "propuesta-comercial", name: "Propuesta Comercial" },
  { id: "presentacion", name: "Presentacion" },
  { id: "kmz", name: "KMZ" },
]

export function FolderDragDrop({ folderName, folderId, isAdmin = false, onFilesUpdated }: FolderDragDropProps) {
  const [zones, setZones] = useState<FolderDropZone[]>(
    DEFAULT_ZONES.map((zone) => ({
      ...zone,
      label: zone.name,
      files: [],
    }))
  )
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(true)
  const [showPlaceholdersEditor, setShowPlaceholdersEditor] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const supabase = createBrowserClient()

  // Load custom placeholders from database
  useEffect(() => {
    loadPlaceholders()
  }, [folderId])

  const loadPlaceholders = async () => {
    try {
      setLoadingPlaceholders(true)
      const { data, error } = await supabase
        .from("folder_placeholders")
        .select("*")
        .eq("folder_id", folderId)
        .order("sort_order", { ascending: true })

      if (error) {
        console.log("[v0] No custom placeholders found, using defaults:", error.message)
        return
      }

      if (data && data.length > 0) {
        console.log("[v0] Loaded custom placeholders:", data)
        const customZones: FolderDropZone[] = data.map((p) => ({
          id: p.placeholder_name,
          name: p.placeholder_name,
          label: p.placeholder_label,
          files: [],
        }))
        setZones(customZones)
      }
    } catch (err) {
      console.error("[v0] Error loading placeholders:", err)
    } finally {
      setLoadingPlaceholders(false)
    }
  }

  const handleDragOver = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setDragOverZone(zoneId)
  }

  const handleDragLeave = () => {
    setDragOverZone(null)
  }

  const uploadFile = async (file: File, zoneId: string) => {
    try {
      setUploading(true)
      console.log("[v0] Starting file upload:", { file: file.name, zoneId })

      // Upload to Supabase Storage via API
      const formData = new FormData()
      formData.append("file", file)

      console.log("[v0] Uploading to /api/upload...")
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Upload response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Upload failed:", errorData)
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Upload successful, response:", data)

      const newFile: DragDropFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: data.url,
        uploadedAt: new Date().toISOString(),
      }

      console.log("[v0] Adding file to zone:", { zoneId, fileId: newFile.id })

      setZones((prevZones) =>
        prevZones.map((zone) =>
          zone.id === zoneId ? { ...zone, files: [...zone.files, newFile] } : zone
        )
      )

      // Notify parent component
      onFilesUpdated?.(zoneId, [...(zones.find((z) => z.id === zoneId)?.files || []), newFile])

      console.log("[v0] File uploaded successfully:", newFile.name)
    } catch (err: any) {
      console.error("[v0] Upload error details:", {
        message: err.message,
        stack: err.stack,
        type: err.constructor?.name,
      })
      alert(`Error al cargar el archivo: ${err.message || "Error desconocido"}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setDragOverZone(null)

    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      uploadFile(file, zoneId)
    })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, zoneId: string) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      uploadFile(file, zoneId)
    })
  }

  const handleRemoveFile = (zoneId: string, fileId: string) => {
    setZones((prevZones) =>
      prevZones.map((zone) =>
        zone.id === zoneId ? { ...zone, files: zone.files.filter((f) => f.id !== fileId) } : zone
      )
    )

    if (onFilesUpdated) {
      const updatedZone = zones.find((z) => z.id === zoneId)
      if (updatedZone) {
        onFilesUpdated(
          zoneId,
          updatedZone.files.filter((f) => f.id !== fileId)
        )
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{folderName}</h3>
        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPlaceholdersEditor(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Editar Placeholders
          </Button>
        )}
      </div>

      {loadingPlaceholders && (
        <div className="text-center text-sm text-muted-foreground">Cargando placeholders...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <Card
            key={zone.id}
            className={`border-2 transition-all ${
              dragOverZone === zone.id
                ? "border-emerald-500 bg-emerald-50"
                : "border-dashed border-gray-300 hover:border-gray-400"
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{zone.label}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Files List - Always show if there are files */}
              {zone.files.length > 0 && (
                <div className="space-y-2 border-b pb-3">
                  <p className="text-xs font-semibold text-gray-600">Archivos cargados:</p>
                  <div className="space-y-1">
                    {zone.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 group hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        {file.url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveFile(zone.id, file.id)}
                            title="Eliminar archivo"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drag and Drop Area - Always visible */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  {zone.files.length > 0 ? "Agregar más archivos" : "Cargar archivo"}
                </p>
                <div
                  onDragOver={(e) => handleDragOver(e, zone.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
                    dragOverZone === zone.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    ref={(el) => {
                      if (el) fileInputRefs.current[zone.id] = el
                    }}
                    onChange={(e) => handleFileInputChange(e, zone.id)}
                    className="hidden"
                    disabled={uploading}
                  />

                  <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Arrastra archivos aquí</p>
                  <p className="text-xs text-gray-500 mt-1">o</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => fileInputRefs.current[zone.id]?.click()}
                    disabled={uploading}
                  >
                    Seleccionar archivo
                  </Button>
                </div>
              </div>

              {zone.files.length === 0 && (
                <p className="text-xs text-gray-400 text-center">Sin archivos aún</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholders Editor - Only show for admins */}
      {isAdmin && (
        <FolderPlaceholdersEditor
          folderId={folderId}
          folderName={folderName}
          isOpen={showPlaceholdersEditor}
          onClose={() => {
            setShowPlaceholdersEditor(false)
            // Reload placeholders after editing
            loadPlaceholders()
          }}
        />
      )}
    </div>
  )
}
