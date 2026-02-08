"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, Trash2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

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
  files: DragDropFile[]
}

interface FolderDragDropProps {
  folderName: string
  folderId: string
  onFilesUpdated?: (zone: string, files: DragDropFile[]) => void
}

const DEFAULT_ZONES = [
  { id: "propuesta-comercial", name: "Propuesta Comercial" },
  { id: "presentacion", name: "Presentacion" },
  { id: "kmz", name: "KMZ" },
]

export function FolderDragDrop({ folderName, folderId, onFilesUpdated }: FolderDragDropProps) {
  const [zones, setZones] = useState<FolderDropZone[]>(
    DEFAULT_ZONES.map((zone) => ({
      ...zone,
      files: [],
    }))
  )
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const supabase = createBrowserClient()

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
      console.log("[v0] Starting upload for file:", file.name, "to zone:", zoneId)

      // Upload to Supabase Storage via API
      const formData = new FormData()
      formData.append("file", file)

      let response
      try {
        console.log("[v0] Sending fetch request to /api/upload")
        response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        console.log("[v0] Fetch request completed with status:", response.status)
      } catch (fetchError: any) {
        console.error("[v0] Fetch error (network/connection issue):", {
          message: fetchError?.message,
          error: fetchError,
        })
        throw new Error(
          `Error de conexión: ${fetchError?.message || "No se pudo contactar al servidor. Verifica tu conexión a internet."}`,
        )
      }

      console.log("[v0] Upload response status:", response.status)

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error("[v0] Upload failed with status:", response.status, "error:", errorData)
        } catch (parseError) {
          const errorText = await response.text()
          console.error("[v0] Upload failed - could not parse response:", response.status, errorText)
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("[v0] Upload response data:", data)

      if (!data.url) {
        throw new Error("No URL returned from upload API")
      }

      const newFile: DragDropFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: data.url,
        uploadedAt: new Date().toISOString(),
      }

      setZones((prevZones) =>
        prevZones.map((zone) =>
          zone.id === zoneId ? { ...zone, files: [...zone.files, newFile] } : zone
        )
      )

      // Notify parent component
      const updatedZone = zones.find((z) => z.id === zoneId)
      if (updatedZone && onFilesUpdated) {
        onFilesUpdated(zoneId, [...updatedZone.files, newFile])
      }

      console.log("[v0] File uploaded successfully:", file.name, "URL:", data.url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[v0] Upload error:", errorMessage)
      alert(`Error al cargar el archivo:\n\n${errorMessage}`)
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{folderName}</h3>
        <p className="text-sm text-blue-700">
          📁 <span className="font-medium">Arrastra archivos directamente a las carpetas de abajo</span>
        </p>
        <p className="text-xs text-blue-600 mt-1">Los archivos se organizarán automáticamente en cada sección</p>
      </div>

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
              <CardTitle className="text-base">{zone.name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Drag and Drop Area */}
              <div
                onDragOver={(e) => handleDragOver(e, zone.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, zone.id)}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer min-h-[200px] flex flex-col items-center justify-center ${
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

                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Arrastra archivos aquí</p>
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

              {/* Files List */}
              {zone.files.length > 0 && (
                <div className="space-y-2 mt-4">
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

              {zone.files.length === 0 && (
                <div className="space-y-2 text-center py-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Placeholder</div>
                  <p className="text-xs text-gray-400 italic">Listo para recibir archivos</p>
                  <div className="flex justify-center gap-1 mt-2">
                    <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                    <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                    <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
