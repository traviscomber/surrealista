"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, X, type File, CheckCircle2, AlertCircle, FileText, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface UploadedFile {
  url: string
  fileName: string
  fileSize: number
  fileType: string
}

interface FileUploaderProps {
  onUploadComplete: (files: UploadedFile[]) => void
  acceptedTypes?: string
  maxSizeMB?: number
  multiple?: boolean
}

export function FileUploader({
  onUploadComplete,
  acceptedTypes = ".pdf,.doc,.docx,.kmz,.kml",
  maxSizeMB = 50,
  multiple = true,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<
    { file: File; progress: number; status: "uploading" | "complete" | "error"; error?: string; url?: string }[]
  >([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      return `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`
    }

    const allowedExtensions = acceptedTypes.split(",").map((ext) => ext.trim())
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return `Tipo de archivo no permitido. Permitidos: ${acceptedTypes}`
    }

    return null
  }

  const uploadFiles = async (files: File[]) => {
    const initialFiles = files.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }))
    setUploadingFiles(initialFiles)

    const results: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validationError = validateFile(file)

      if (validationError) {
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: validationError,
                  progress: 0,
                }
              : f,
          ),
        )
        continue
      }

      try {
        console.log("[v0] Starting upload for:", file.name)

        const formData = new FormData()
        formData.append("file", file)

        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, progress: Math.min(f.progress + 10, 90) } : f)),
          )
        }, 200)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)

        console.log("[v0] Upload response status:", response.status)

        if (!response.ok) {
          let errorMessage = "Error al subir archivo"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            const errorText = await response.text()
            console.error("[v0] Non-JSON error response:", errorText)
            errorMessage = `Error del servidor (${response.status})`
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log("[v0] Upload successful:", data)

        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  progress: 100,
                  status: "complete",
                  url: data.url,
                }
              : f,
          ),
        )

        results.push(data)
      } catch (err: any) {
        console.error("[v0] Upload error:", err)
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: err.message || "Error al subir archivo",
                  progress: 0,
                }
              : f,
          ),
        )
      }
    }

    setUploadedFiles((prev) => [...prev, ...results])
    if (results.length > 0) {
      onUploadComplete(results)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        uploadFiles(multiple ? files : [files[0]])
      }
    },
    [multiple],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFiles(multiple ? Array.from(files) : [files[0]])
    }
  }

  const handleClear = () => {
    setUploadingFiles([])
    setUploadedFiles([])
  }

  const isUploading = uploadingFiles.some((f) => f.status === "uploading")
  const hasFiles = uploadingFiles.length > 0 || uploadedFiles.length > 0

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (ext === "kmz" || ext === "kml") return <Map className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-orange-500 bg-orange-50" : "border-gray-300 bg-gray-50",
          isUploading && "opacity-50 pointer-events-none",
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          disabled={isUploading}
          multiple={multiple}
        />

        {!hasFiles && (
          <label htmlFor="file-upload" className="cursor-pointer block">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              {multiple
                ? "Arrastra múltiples archivos aquí o haz clic para seleccionar"
                : "Arrastra archivo aquí o haz clic para seleccionar"}
            </p>
            <p className="text-sm text-gray-500">Archivos permitidos: PDF, DOC, DOCX, KMZ, KML (máx. {maxSizeMB}MB)</p>
            {multiple && (
              <p className="text-sm text-orange-600 font-medium mt-2">
                💡 Puedes subir múltiples documentos y archivos KMZ/KML a la vez
              </p>
            )}
          </label>
        )}

        {hasFiles && (
          <div className="space-y-3">
            {uploadingFiles.map((fileState, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-4 rounded-lg border text-left",
                  fileState.status === "complete" && "bg-green-50 border-green-200",
                  fileState.status === "error" && "bg-red-50 border-red-200",
                  fileState.status === "uploading" && "bg-blue-50 border-blue-200",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getFileIcon(fileState.file.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{fileState.file.name}</p>
                      {fileState.status === "complete" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      {fileState.status === "error" && <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500">{(fileState.file.size / 1024 / 1024).toFixed(2)} MB</p>

                    {fileState.status === "uploading" && (
                      <div className="mt-2">
                        <Progress value={fileState.progress} className="h-2" />
                        <p className="text-xs text-gray-600 mt-1">{fileState.progress}%</p>
                      </div>
                    )}

                    {fileState.status === "complete" && (
                      <Badge className="mt-2 bg-green-600 text-white">Subido exitosamente</Badge>
                    )}

                    {fileState.status === "error" && <p className="text-xs text-red-600 mt-1">{fileState.error}</p>}
                  </div>
                </div>
              </div>
            ))}

            {!isUploading && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleClear} className="w-full bg-transparent">
                  <X className="h-4 w-4 mr-2" />
                  Limpiar Lista
                </Button>
                <label htmlFor="file-upload" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Más
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
