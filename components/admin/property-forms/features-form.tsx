"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface PropertyFeaturesFormProps {
  data: {
    features: string[]
    amenities: string[]
  }
  onChange: (data: any) => void
}

export function PropertyFeaturesForm({ data, onChange }: PropertyFeaturesFormProps) {
  const [formData, setFormData] = useState(data)
  const [newFeature, setNewFeature] = useState("")
  const [newAmenity, setNewAmenity] = useState("")

  useEffect(() => {
    setFormData(data)
  }, [data])

  const addFeature = () => {
    if (newFeature.trim() === "") return

    const updatedFeatures = [...formData.features, newFeature.trim()]
    const updatedData = { ...formData, features: updatedFeatures }

    setFormData(updatedData)
    onChange(updatedData)
    setNewFeature("")
  }

  const removeFeature = (index: number) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index)
    const updatedData = { ...formData, features: updatedFeatures }

    setFormData(updatedData)
    onChange(updatedData)
  }

  const addAmenity = () => {
    if (newAmenity.trim() === "") return

    const updatedAmenities = [...formData.amenities, newAmenity.trim()]
    const updatedData = { ...formData, amenities: updatedAmenities }

    setFormData(updatedData)
    onChange(updatedData)
    setNewAmenity("")
  }

  const removeAmenity = (index: number) => {
    const updatedAmenities = formData.amenities.filter((_, i) => i !== index)
    const updatedData = { ...formData, amenities: updatedAmenities }

    setFormData(updatedData)
    onChange(updatedData)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label htmlFor="features">Características</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.features.map((feature, index) => (
            <Badge key={index} variant="secondary" className="px-3 py-1">
              {feature}
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {formData.features.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay características agregadas</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            id="new-feature"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="Ej: Calefacción central"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
          />
          <Button type="button" onClick={addFeature}>
            Agregar
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Label htmlFor="amenities">Comodidades</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.amenities.map((amenity, index) => (
            <Badge key={index} variant="secondary" className="px-3 py-1">
              {amenity}
              <button
                type="button"
                onClick={() => removeAmenity(index)}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {formData.amenities.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay comodidades agregadas</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            id="new-amenity"
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            placeholder="Ej: Piscina"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
          />
          <Button type="button" onClick={addAmenity}>
            Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}
