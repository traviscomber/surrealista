"use client"

import { useState, useRef } from "react"
import { Upload, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ImageUploadDragDropProps {
  value?: string
  onUpload: (file: File) => Promise<void>
  accept?: string
  label: string
  required?: boolean
  isUploading?: boolean
}

export function ImageUploadDragDrop({
  value,
  onUpload,
  accept = "image/*",
  label,
  required = false,
  isUploading = false,
}: ImageUploadDragDropProps) {
  const [dragOver, setDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      console.log("[v0] File dropped:", file.name, "Size:", file.size)
      await handleFile(file)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      console.log("[v0] File selected:", file.name, "Size:", file.size)
      await handleFile(file)
    }
    // Reset input for reselection
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFile = async (file: File) => {
    try {
      setIsLoading(true)
      console.log("[v0] Processing file:", { name: file.name, size: file.size, type: file.type })
      await onUpload(file)
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loading = isLoading || isUploading

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {value ? (
        <div className="space-y-2">
          <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(value, "_blank")}
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Cambiar
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full p-8 rounded-lg border-2 border-dashed cursor-pointer
            transition-all duration-200 text-center
            ${
              dragOver
                ? "border-blue-500 bg-blue-50 scale-102"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            }
            ${loading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <Upload className={`h-8 w-8 mx-auto mb-2 ${dragOver ? "text-blue-500" : "text-gray-400"}`} />
          <p className="text-sm font-medium text-gray-700">
            {loading ? "Cargando..." : dragOver ? "Suelta la imagen aquí" : "Arrastra una imagen aquí"}
          </p>
          <p className="text-xs text-gray-500 mt-1">o haz clic para seleccionar</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={loading}
      />
    </div>
  )
}
