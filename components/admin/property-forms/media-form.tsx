"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Upload, Move, Link } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface PropertyMediaFormProps {
  data: {
    images: string[]
    videos?: string[]
    virtual_tour_url?: string
  }
  propertyId: string
  onChange: (data: any) => void
}

export function PropertyMediaForm({ data, propertyId, onChange }: PropertyMediaFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState(data)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [virtualTourUrl, setVirtualTourUrl] = useState(data.virtual_tour_url || "")

  useEffect(() => {
    setFormData(data)
    setVirtualTourUrl(data.virtual_tour_url || "")
  }, [data])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const newImages = [...formData.images]

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const payload = new FormData()
        payload.append("file", file, `${propertyId}-${file.name}`)

        const response = await fetch("/api/upload", { method: "POST", body: payload })
        const result = await response.json().catch(() => ({}))
        if (!response.ok || !result?.url) {
          throw new Error(result?.error || `No se pudo subir ${file.name}`)
        }

        newImages.push(result.url)
        setUploadProgress(Math.round(((index + 1) / files.length) * 100))
      }

      const updatedData = { ...formData, images: newImages }
      setFormData(updatedData)
      onChange(updatedData)
      toast({
        title: "Imágenes subidas",
        description: `Se han subido ${files.length} imágenes correctamente.`,
      })
    } catch (error: any) {
      toast({
        title: "Error al subir imágenes",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      event.target.value = ""
    }
  }

  const removeImage = (index: number) => {
    const updatedImages = formData.images.filter((_, imageIndex) => imageIndex !== index)
    const updatedData = { ...formData, images: updatedImages }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...formData.images]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if ((direction === "up" && index === 0) || (direction === "down" && index === newImages.length - 1)) return
    ;[newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]]
    const updatedData = { ...formData, images: newImages }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleVirtualTourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value
    setVirtualTourUrl(url)
    const updatedData = { ...formData, virtual_tour_url: url }
    setFormData(updatedData)
    onChange(updatedData)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label htmlFor="images">Imágenes</Label>
          <div className="relative">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? `Subiendo ${uploadProgress}%` : "Subir Imágenes"}
            </Button>
          </div>
        </div>

        {formData.images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <Card key={`${image}-${index}`} className="overflow-hidden">
                <div className="relative aspect-square">
                  <Image src={image || "/placeholder.svg"} alt={`Propiedad imagen ${index + 1}`} fill className="object-cover" />
                </div>
                <CardContent className="p-2 flex justify-between">
                  <div className="flex space-x-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveImage(index, "up")} disabled={index === 0} className="h-8 w-8">
                      <Move className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveImage(index, "down")} disabled={index === formData.images.length - 1} className="h-8 w-8">
                      <Move className="h-4 w-4 -rotate-90" />
                    </Button>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)} className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No hay imágenes. Haz clic en "Subir Imágenes" para agregar.</p>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="virtual_tour_url" className="flex items-center">
          <Link className="mr-2 h-4 w-4" />
          URL de Tour Virtual
        </Label>
        <Input id="virtual_tour_url" value={virtualTourUrl} onChange={handleVirtualTourChange} placeholder="https://ejemplo.com/tour-virtual" />
      </div>
    </div>
  )
}
