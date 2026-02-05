"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, Trash2 } from "lucide-react"

interface DragDropFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadedAt?: string
}

interface PlaceholderZone {
  id: string
  name: string
  label: string
}

interface FolderPlaceholdersInlineProps {
  folderId: string
  folderName: string
  placeholders: PlaceholderZone[]
  onFileUpload: (zoneId: string, file: File) => void
  uploading?: boolean
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function FolderPlaceholdersInline({
  folderId,
  folderName,
  placeholders,
  onFileUpload,
  uploading = false,
}: FolderPlaceholdersInlineProps) {
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [fileInputRefs] = useState<{ [key: string]: HTMLInputElement | null }>({})

  const handleDragOver = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverZone(zoneId)
  }

  const handleDragLeave = () => {
    setDragOverZone(null)
  }

  const handleDrop = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverZone(null)

    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      onFileUpload(zoneId, file)
    })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, zoneId: string) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      onFileUpload(zoneId, file)
    })
    e.target.value = ""
  }

  return (
    <div className="border-t bg-muted/20 p-4 space-y-4">
      <h4 className="font-medium text-sm text-gray-900 mb-3">Agregar Documentos a: {folderName}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {placeholders.map((placeholder) => (
          <Card
            key={placeholder.id}
            className={`border-2 transition-all ${
              dragOverZone === placeholder.id
                ? "border-emerald-500 bg-emerald-50"
                : "border-dashed border-gray-300 hover:border-gray-400"
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{placeholder.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div
                  onDragOver={(e) => handleDragOver(e, placeholder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, placeholder.id)}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
                    dragOverZone === placeholder.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    ref={(el) => {
                      if (el) fileInputRefs[placeholder.id] = el
                    }}
                    onChange={(e) => handleFileInputChange(e, placeholder.id)}
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
                    onClick={() => fileInputRefs[placeholder.id]?.click()}
                    disabled={uploading}
                  >
                    Seleccionar archivo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
